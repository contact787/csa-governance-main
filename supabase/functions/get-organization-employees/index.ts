import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting get-organization-employees function');

    // Verify API key
    const apiKey = req.headers.get('X-API-Key');
    const expectedApiKey = Deno.env.get('API_SECRET_KEY');

    if (!apiKey || apiKey !== expectedApiKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid API key' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse query parameters
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organization_id');
    const includeRoles = url.searchParams.get('include_roles') === 'true';

    console.log('Query parameters:', { organizationId, includeRoles });

    // Build the query
    let query = supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        full_name,
        email,
        avatar_url,
        organization_id,
        created_at,
        updated_at
      `);

    // Filter by organization_id if provided
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    // Execute the query
    const { data: profiles, error: profilesError, count } = await query;

    if (profilesError) {
      console.error('Database error:', profilesError);
      return new Response(
        JSON.stringify({ error: profilesError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${profiles?.length || 0} employees`);

    // If include_roles is true, fetch roles for each user
    let employeesWithRoles = profiles;
    if (includeRoles && profiles && profiles.length > 0) {
      const userIds = profiles.map(p => p.user_id);
      
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .in('user_id', userIds);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      } else {
        // Map roles to profiles
        employeesWithRoles = profiles.map(profile => ({
          ...profile,
          roles: roles?.filter(r => r.user_id === profile.user_id) || []
        }));
      }
    }

    return new Response(
      JSON.stringify({
        data: employeesWithRoles,
        count: count || profiles?.length || 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
