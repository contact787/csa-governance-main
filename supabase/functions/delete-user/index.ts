import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateUUID(id: string): { valid: boolean; error?: string } {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'User ID is required' };
  }
  const trimmed = id.trim();
  if (!UUID_REGEX.test(trimmed)) {
    return { valid: false, error: 'Invalid user ID format' };
  }
  return { valid: true };
}

Deno.serve(async (req) => {
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

    // Check if requesting user is admin or master_admin using has_role RPC
    // These checks are only needed if user is trying to delete someone else
    const { data: isAdmin } = await supabaseClient.rpc('has_role', {
      _user_id: requestingUser.id,
      _role: 'admin',
    });

    const { data: isMasterAdmin } = await supabaseClient.rpc('has_role', {
      _user_id: requestingUser.id,
      _role: 'master_admin',
    });

    // Parse and validate request body
    const body = await req.json();
    const { user_id } = body;

    const uuidValidation = validateUUID(user_id);
    if (!uuidValidation.valid) {
      return new Response(
        JSON.stringify({ error: uuidValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedUserId = user_id.trim();

    // Check if user is deleting their own account OR is an admin deleting another user
    const isSelfDeletion = sanitizedUserId === requestingUser.id;
    
    if (!isSelfDeletion && !isAdmin && !isMasterAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only admins can delete other users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If not self-deletion, check if target user is a master_admin (only master_admins can't delete other master_admins)
    if (!isSelfDeletion && isMasterAdmin) {
      const { data: targetIsMasterAdmin } = await supabaseClient.rpc('has_role', {
        _user_id: sanitizedUserId,
        _role: 'master_admin',
      });

      if (targetIsMasterAdmin) {
        return new Response(
          JSON.stringify({ error: 'Master admins cannot delete other master admins' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing backend env vars', {
        hasUrl: !!supabaseUrl,
        hasServiceRoleKey: !!serviceRoleKey,
      });
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Find the user's profile.id (used by some FKs like organization_standards.responsible_person_id)
    const { data: profileRow, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', sanitizedUserId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile for user:', sanitizedUserId, profileError);
    }

    // Clear ALL foreign key references before deleting user
    // These tables have FK constraints without ON DELETE CASCADE

    // 1. organization_standards - clear user references
    await supabaseAdmin
      .from('organization_standards')
      .update({ reviewed_by: null })
      .eq('reviewed_by', sanitizedUserId);

    await supabaseAdmin
      .from('organization_standards')
      .update({ submitted_by: null })
      .eq('submitted_by', sanitizedUserId);

    await supabaseAdmin
      .from('organization_standards')
      .update({ updated_by: null })
      .eq('updated_by', sanitizedUserId);

    // NOTE: responsible_person_id references profiles.id (NOT auth.users.id)
    if (profileRow?.id) {
      const { error: clearResponsibleError } = await supabaseAdmin
        .from('organization_standards')
        .update({ responsible_person_id: null })
        .eq('responsible_person_id', profileRow.id);

      if (clearResponsibleError) {
        console.error('Error clearing responsible_person_id:', clearResponsibleError);
      }
    }

    // 2. Delete participation_logs created by user
    await supabaseAdmin
      .from('participation_logs')
      .delete()
      .eq('created_by', sanitizedUserId);

    // 3. Delete secondary_logs created by user
    await supabaseAdmin
      .from('secondary_logs')
      .delete()
      .eq('created_by', sanitizedUserId);

    // 4. Delete standard_activity_logs performed by user
    await supabaseAdmin
      .from('standard_activity_logs')
      .delete()
      .eq('performed_by', sanitizedUserId);

    // 5. Delete method_evidence uploaded by user
    await supabaseAdmin
      .from('method_evidence')
      .delete()
      .eq('uploaded_by', sanitizedUserId);

    // 6. Delete participation_log_evidence uploaded by user
    await supabaseAdmin
      .from('participation_log_evidence')
      .delete()
      .eq('uploaded_by', sanitizedUserId);

    // 7. Delete standard_documents uploaded by user
    await supabaseAdmin
      .from('standard_documents')
      .delete()
      .eq('uploaded_by', sanitizedUserId);

    // 8. Delete announcements created by user
    await supabaseAdmin
      .from('announcements')
      .delete()
      .eq('created_by', sanitizedUserId);

    // 9. Delete roma_reports created by user
    await supabaseAdmin
      .from('roma_reports')
      .delete()
      .eq('user_id', sanitizedUserId);

    // 10. Delete resources created by user
    await supabaseAdmin
      .from('resources')
      .delete()
      .eq('created_by', sanitizedUserId);

    // 11. Delete login_history for user
    await supabaseAdmin
      .from('login_history')
      .delete()
      .eq('user_id', sanitizedUserId);

    // 12. Delete announcement_reads for user
    await supabaseAdmin
      .from('announcement_reads')
      .delete()
      .eq('user_id', sanitizedUserId);

    // 13. Delete system_alerts for user
    await supabaseAdmin
      .from('system_alerts')
      .delete()
      .eq('user_id', sanitizedUserId);

    // 14. Delete messages sent or received by user
    await supabaseAdmin
      .from('messages')
      .delete()
      .eq('sender_id', sanitizedUserId);

    await supabaseAdmin
      .from('messages')
      .delete()
      .eq('receiver_id', sanitizedUserId);

    // 15. Delete user_roles for user
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', sanitizedUserId);

    // 16. Delete profile for user
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', sanitizedUserId);

    console.log('Cleared all foreign key references for user:', sanitizedUserId);

    // Delete user from auth (this will cascade delete profile and roles due to foreign keys)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(sanitizedUserId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return new Response(
        JSON.stringify({
          error: 'Failed to delete user',
          details: (deleteError as any)?.message ?? String(deleteError),
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User deleted successfully:', sanitizedUserId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});