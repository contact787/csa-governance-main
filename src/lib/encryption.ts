// Server-side encryption/decryption for messages
// Encryption keys are stored securely on the server

import { supabase } from "@/integrations/supabase/client";

export async function encryptMessage(plaintext: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('encrypt-message', {
      body: { action: 'encrypt', text: plaintext }
    });

    if (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }

    return data.encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw error;
  }
}

export async function decryptMessage(ciphertext: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('encrypt-message', {
      body: { action: 'decrypt', text: ciphertext }
    });

    if (error) {
      console.error('Decryption error:', error);
      return '[Message could not be decrypted]';
    }

    return data.decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Message could not be decrypted]';
  }
}

export async function decryptMessages(ciphertexts: string[]): Promise<string[]> {
  if (ciphertexts.length === 0) return [];
  
  try {
    const { data, error } = await supabase.functions.invoke('encrypt-message', {
      body: { action: 'decrypt', texts: ciphertexts }
    });

    if (error) {
      console.error('Batch decryption error:', error);
      return ciphertexts.map(() => '[Message could not be decrypted]');
    }

    return data.decrypted;
  } catch (error) {
    console.error('Batch decryption failed:', error);
    return ciphertexts.map(() => '[Message could not be decrypted]');
  }
}
