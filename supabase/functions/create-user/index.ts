// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Input validation helpers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 255;
const MAX_NAME_LENGTH = 100;
const MAX_ORG_NAME_LENGTH = 200;
const VALID_ROLES = ['admin', 'staff', 'compliance_manager', 'board_member', 'master_admin'];

function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email cannot be empty' };
  }
  if (trimmed.length > MAX_EMAIL_LENGTH) {
    return { valid: false, error: `Email must be less than ${MAX_EMAIL_LENGTH} characters` };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
}

function validateName(name: string, fieldName: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `${fieldName} must be less than ${MAX_NAME_LENGTH} characters` };
  }
  return { valid: true };
}

function validateOrganizationName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Organization name is required' };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Organization name cannot be empty' };
  }
  if (trimmed.length > MAX_ORG_NAME_LENGTH) {
    return { valid: false, error: `Organization name must be less than ${MAX_ORG_NAME_LENGTH} characters` };
  }
  return { valid: true };
}

function validateRole(role: string | undefined): { valid: boolean; error?: string } {
  if (!role) return { valid: true }; // Role is optional
  if (!VALID_ROLES.includes(role)) {
    return { valid: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` };
  }
  return { valid: true };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create an auth client bound to the caller's JWT to check permissions
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await authClient.auth.getUser();

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if caller is admin or master_admin
    const { data: isAdmin, error: adminRoleError } = await authClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });

    const { data: isMasterAdmin, error: masterRoleError } = await authClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "master_admin",
    });

    if ((adminRoleError && masterRoleError) || (!isAdmin && !isMasterAdmin)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { 
      email, 
      full_name, 
      organization_id, 
      organization_name, 
      create_new_organization, 
      role, 
      redirect_to 
    } = body;

    // Validate all inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return new Response(
        JSON.stringify({ error: emailValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nameValidation = validateName(full_name, 'Full name');
    if (!nameValidation.valid) {
      return new Response(
        JSON.stringify({ error: nameValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate organization: either organization_id OR organization_name must be provided
    if (!organization_id && !organization_name) {
      return new Response(
        JSON.stringify({ error: 'Organization is required. Provide either organization_id or organization_name.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If creating new organization, validate the name
    if (create_new_organization) {
      if (!isMasterAdmin) {
        return new Response(
          JSON.stringify({ error: 'Only master admins can create new organizations' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const orgValidation = validateOrganizationName(organization_name);
      if (!orgValidation.valid) {
        return new Response(
          JSON.stringify({ error: orgValidation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const roleValidation = validateRole(role);
    if (!roleValidation.valid) {
      return new Response(
        JSON.stringify({ error: roleValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = full_name.trim();

    // Determine the organization to use
    let finalOrgId: string;
    let finalOrgName: string;

    if (create_new_organization && organization_name) {
      // Create a new organization
      const sanitizedOrgName = organization_name.trim();
      
      // Check if organization with this name already exists
      const { data: existingOrg } = await adminClient
        .from("organizations")
        .select("id, name")
        .eq("name", sanitizedOrgName)
        .maybeSingle();

      if (existingOrg) {
        return new Response(
          JSON.stringify({ error: `An organization named "${sanitizedOrgName}" already exists` }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create the new organization
      const { data: newOrg, error: createOrgError } = await adminClient
        .from("organizations")
        .insert({ name: sanitizedOrgName })
        .select("id, name")
        .single();

      if (createOrgError || !newOrg) {
        console.error("Error creating organization:", createOrgError);
        return new Response(
          JSON.stringify({ error: "Failed to create organization" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      finalOrgId = newOrg.id;
      finalOrgName = newOrg.name;
      console.log(`Created new organization: ${finalOrgName} (${finalOrgId})`);
    } else if (organization_id) {
      // Use existing organization by ID
      const { data: org, error: orgError } = await adminClient
        .from("organizations")
        .select("id, name")
        .eq("id", organization_id)
        .maybeSingle();

      if (orgError || !org) {
        return new Response(
          JSON.stringify({ error: "Organization not found" }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      finalOrgId = org.id;
      finalOrgName = org.name;
    } else if (organization_name) {
      // Find organization by name (legacy support)
      const sanitizedOrgName = organization_name.trim();
      const { data: org, error: orgError } = await adminClient
        .from("organizations")
        .select("id, name")
        .eq("name", sanitizedOrgName)
        .maybeSingle();

      if (orgError || !org) {
        return new Response(
          JSON.stringify({ error: `Organization "${sanitizedOrgName}" not found` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      finalOrgId = org.id;
      finalOrgName = org.name;
    } else {
      return new Response(
        JSON.stringify({ error: "Organization is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Invite user by email - they will set their own password
    const { data: created, error: createError } = await adminClient.auth.admin.inviteUserByEmail(
      sanitizedEmail,
      {
        data: { full_name: sanitizedName, organization_name: finalOrgName },
        redirectTo: redirect_to || undefined,
      }
    );

    if (createError) {
      // Handle duplicate email error specifically
      if (createError.message?.includes("already been registered") || createError.message?.includes("already exists")) {
        return new Response(
          JSON.stringify({ error: "A user with this email already exists" }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      
      console.error("Error inviting user:", createError);
      return new Response(
        JSON.stringify({ error: "Failed to invite user" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!created?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const newUserId = created.user.id;
    console.log(`User invited successfully: ${newUserId}`);

    // Update the user's profile with the correct organization_id
    const { error: profileUpdateError } = await adminClient
      .from("profiles")
      .update({ organization_id: finalOrgId })
      .eq("user_id", newUserId);

    if (profileUpdateError) {
      console.error("Error updating profile organization:", profileUpdateError);
    }

    // If a specific role is requested, update the role
    // Only master_admin can create admin users
    if (role === "admin" && !isMasterAdmin) {
      return new Response(
        JSON.stringify({ error: "Only master admins can create admin users" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (role && role !== "admin") {
      // First delete the default admin role created by the trigger
      const { error: deleteError } = await adminClient
        .from("user_roles")
        .delete()
        .eq("user_id", newUserId);

      if (deleteError) {
        console.error("Error deleting default role:", deleteError);
      }

      // Then insert the new role
      const { error: roleInsertError } = await adminClient
        .from("user_roles")
        .insert({ user_id: newUserId, role });

      if (roleInsertError) {
        console.error("Error inserting new role:", roleInsertError);
        return new Response(
          JSON.stringify({ error: "Failed to assign role" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUserId, organization_id: finalOrgId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
