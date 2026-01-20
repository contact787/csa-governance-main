import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the requesting user
    const {
      data: { user: requestingUser },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !requestingUser) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requesting user is admin or master_admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id);

    if (roleError) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const roles = roleData?.map(r => r.role) || [];
    const isAdmin = roles.includes('admin') || roles.includes('master_admin');

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only admins can view invite status' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds)) {
      return new Response(
        JSON.stringify({ error: 'userIds array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client to access auth.users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user details for each user ID
    const statuses: Record<string, { status: 'pending' | 'accepted', invited_at: string | null }> = {};

    for (const userId of userIds) {
      const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (getUserError) {
        console.error(`Error getting user ${userId}:`, getUserError);
        statuses[userId] = { status: 'pending', invited_at: null };
        continue;
      }

      const user = userData?.user;
      if (!user) {
        statuses[userId] = { status: 'pending', invited_at: null };
        continue;
      }

      // Check if user has confirmed email (accepted invite)
      // When invited, email_confirmed_at is null. After accepting, it gets set
      const isAccepted = !!user.email_confirmed_at;
      
      statuses[userId] = {
        status: isAccepted ? 'accepted' : 'pending',
        invited_at: user.invited_at || user.created_at,
      };
    }

    console.log('Invite statuses retrieved:', Object.keys(statuses).length);

    return new Response(
      JSON.stringify({ statuses }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
