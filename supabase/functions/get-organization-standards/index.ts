import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('get-organization-standards: Starting request');

    // Verify API Key for security
    const apiKey = req.headers.get('X-API-Key');
    const expectedApiKey = Deno.env.get('API_SECRET_KEY');
    
    if (!apiKey || apiKey !== expectedApiKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role (access to all data)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('API key validated, proceeding with request');

    // Parse query parameters
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organization_id');
    const status = url.searchParams.get('status');
    const standardId = url.searchParams.get('standard_id');
    const includeDocuments = url.searchParams.get('include_documents') === 'true';
    const includeStandardDetails = url.searchParams.get('include_standard_details') === 'true';

    console.log('Query parameters:', { organizationId, status, standardId, includeDocuments, includeStandardDetails });

    // Build the select string dynamically
    let selectString = '*';
    const selectParts = [];
    
    if (includeStandardDetails) {
      selectParts.push('standards:standard_id (*)');
    }
    if (includeDocuments) {
      selectParts.push('standard_documents (*)');
    }
    
    if (selectParts.length > 0) {
      selectString = `*, ${selectParts.join(', ')}`;
    }

    // Build the query
    let query = supabase
      .from('organization_standards')
      .select(selectString);

    // Apply filters
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (standardId) {
      query = query.eq('standard_id', standardId);
    }

    // Execute query
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Successfully retrieved ${data?.length || 0} organization standards`);

    return new Response(
      JSON.stringify({ data, count: data?.length || 0 }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
