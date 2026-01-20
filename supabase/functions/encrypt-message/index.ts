import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get encryption key from secure environment variable - no fallback for security
const ENCRYPTION_KEY = Deno.env.get('MESSAGE_ENCRYPTION_KEY');
if (!ENCRYPTION_KEY) {
  throw new Error('MESSAGE_ENCRYPTION_KEY environment variable is required');
}

// Input validation constants
const MAX_MESSAGE_LENGTH = 10000; // 10KB max message size
const MAX_BATCH_SIZE = 100; // Max messages in a batch

function validateText(text: unknown): { valid: boolean; error?: string } {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Text parameter is required and must be a string' };
  }
  if (text.length === 0) {
    return { valid: false, error: 'Text cannot be empty' };
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Text exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters` };
  }
  return { valid: true };
}

function validateTextsArray(texts: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(texts)) {
    return { valid: false, error: 'Texts must be an array' };
  }
  if (texts.length === 0) {
    return { valid: false, error: 'Texts array cannot be empty' };
  }
  if (texts.length > MAX_BATCH_SIZE) {
    return { valid: false, error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE} messages` };
  }
  for (let i = 0; i < texts.length; i++) {
    const validation = validateText(texts[i]);
    if (!validation.valid) {
      return { valid: false, error: `Invalid text at index ${i}: ${validation.error}` };
    }
  }
  return { valid: true };
}

async function getKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('inbox-salt-v2'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptMessage(plaintext: string): Promise<string> {
  const key = await getKey();
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  // Combine IV + encrypted data and encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function decryptMessage(ciphertext: string): Promise<string> {
  try {
    const key = await getKey();
    const combined = new Uint8Array(
      atob(ciphertext).split('').map(c => c.charCodeAt(0))
    );
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Message could not be decrypted]';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, text, texts } = body;

    if (!action || (action !== 'encrypt' && action !== 'decrypt')) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "encrypt" or "decrypt"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'encrypt') {
      const textValidation = validateText(text);
      if (!textValidation.valid) {
        return new Response(
          JSON.stringify({ error: textValidation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const encrypted = await encryptMessage(text);
      console.log(`Encrypted message for user ${user.id}`);
      
      return new Response(
        JSON.stringify({ encrypted }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } 
    
    if (action === 'decrypt') {
      if (texts) {
        // Batch decrypt multiple messages
        const textsValidation = validateTextsArray(texts);
        if (!textsValidation.valid) {
          return new Response(
            JSON.stringify({ error: textsValidation.error }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const decrypted = await Promise.all(
          texts.map(async (t: string) => await decryptMessage(t))
        );
        console.log(`Batch decrypted ${texts.length} messages for user ${user.id}`);
        
        return new Response(
          JSON.stringify({ decrypted }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const textValidation = validateText(text);
      if (!textValidation.valid) {
        return new Response(
          JSON.stringify({ error: textValidation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const decrypted = await decryptMessage(text);
      console.log(`Decrypted message for user ${user.id}`);
      
      return new Response(
        JSON.stringify({ decrypted }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in encrypt-message function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});