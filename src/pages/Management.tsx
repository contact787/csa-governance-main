import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, ArrowLeft, Trash2, Pencil, RefreshCw, Check, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: "admin" | "staff" | "compliance_manager" | "board_member" | "master_admin";
  organization_id: string | null;
  invite_status?: "pending" | "accepted";
}

interface Organization {
  id: string;
  name: string;
}

export default function Management() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [resendingInvite, setResendingInvite] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [adminOrgId, setAdminOrgId] = useState<string | null>(null);
  const [adminOrgName, setAdminOrgName] = useState<string>("");

  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    role: "staff" as "admin" | "staff" | "compliance_manager" | "board_member",
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [newOrgName, setNewOrgName] = useState<string>("");
  const [isCreatingNewOrg, setIsCreatingNewOrg] = useState(false);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        navigate("/login");
        return;
      }

      // Check admin or master_admin using RPC
      const { data: isAdminRole, error: hasRoleError } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      const { data: isMasterAdminRole, error: hasMasterRoleError } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "master_admin",
      });

      if (hasRoleError && hasMasterRoleError) {
        console.error("Error verifying roles:", hasRoleError, hasMasterRoleError);
        throw new Error("Failed to verify user role");
      }

      if (!isAdminRole && !isMasterAdminRole) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You must be an admin to access this page.",
        });
        navigate("/");
        return;
      }

      setIsMasterAdmin(!!isMasterAdminRole);

      // Get admin's profile to retrieve organization
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_id, organization_id, full_name, email")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw new Error("Failed to load profile data");
      }

      // Master admins can access without belonging to an organization
      if (!isMasterAdminRole && (!profileData || !profileData.organization_id)) {
        toast({
          variant: "destructive",
          title: "No Organization",
          description: "You must belong to an organization to manage users.",
        });
        navigate("/");
        return;
      }

      // For master admins without org, they can select any org - for now just set isAdmin
      if (isMasterAdminRole) {
        setIsAdmin(true);
        setIsMasterAdmin(true);
        // Load all organizations for master admin dropdown
        const { data: allOrgs } = await supabase
          .from("organizations")
          .select("id, name")
          .order("name");
        if (allOrgs) {
          setOrganizations(allOrgs);
        }
        // Master admin sees ALL users from ALL organizations
        if (profileData?.organization_id) {
          const { data: orgData } = await supabase
            .from("organizations")
            .select("id, name")
            .eq("id", profileData.organization_id)
            .maybeSingle();
          if (orgData) {
            setAdminOrgId(orgData.id);
            setAdminOrgName(orgData.name);
          }
        }
        // Load ALL users for master admin
        await loadAllUsers();
      } else {
        // Regular admin - must have organization
        const orgId = profileData!.organization_id!;
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("id, name")
          .eq("id", orgId)
          .maybeSingle();

        if (orgError) {
          console.error("Error fetching organization:", orgError);
        }

        if (orgData) {
          setAdminOrgId(orgData.id);
          setAdminOrgName(orgData.name);
        }

        setIsAdmin(true);
        await loadUsers(orgId);
      }
    } catch (error: any) {
      console.error("Error in checkAdminAndLoadData:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load management data",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (orgIdParam?: string) => {
    try {
      const orgIdToUse = orgIdParam ?? adminOrgId;
      console.log("loadUsers called with orgIdParam:", orgIdParam, "adminOrgId:", adminOrgId, "using:", orgIdToUse);
      
      if (!orgIdToUse) {
        console.error("No organization ID available");
        setUsers([]);
        return;
      }

      // Get all profiles from the admin's organization
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, organization_id")
        .eq("organization_id", orgIdToUse);

      console.log("Profiles query result:", { profiles, profilesError, count: profiles?.length });

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        console.log("No profiles found for organization:", orgIdToUse);
        setUsers([]);
        return;
      }

      // Get roles for each user - prioritize master_admin if exists
      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: allRoles, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.user_id);

          if (roleError) {
            console.error(`Error loading role for user ${profile.user_id}:`, roleError);
          }

          // Prioritize master_admin role if exists
          const userRole = allRoles?.find(r => r.role === 'master_admin')?.role || 
                          allRoles?.[0]?.role || 
                          "staff";

          return {
            id: profile.id,
            user_id: profile.user_id,
            full_name: profile.full_name || "",
            email: profile.email || "",
            role: userRole as "admin" | "staff" | "compliance_manager" | "board_member" | "master_admin",
            organization_id: profile.organization_id,
            invite_status: undefined as "pending" | "accepted" | undefined,
          };
        })
      );

      // Fetch invite statuses for all users
      const userIds = usersWithRoles.map(u => u.user_id);
      try {
        const { data: statusData, error: statusError } = await supabase.functions.invoke("get-user-invite-status", {
          body: { userIds },
        });

        if (!statusError && statusData?.statuses) {
          usersWithRoles.forEach(user => {
            const status = statusData.statuses[user.user_id];
            if (status) {
              user.invite_status = status.status;
            }
          });
        }
      } catch (statusErr) {
        console.error("Error fetching invite statuses:", statusErr);
      }

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error in loadUsers:", error);
      toast({
        variant: "destructive",
        title: "Error loading users",
        description: error.message || "Failed to load users",
      });
    }
  };

  // Load ALL users from ALL organizations (for master_admin)
  const loadAllUsers = async () => {
    try {
      // Get all profiles from all organizations
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, organization_id");

      if (profilesError) {
        console.error("Error loading all profiles:", profilesError);
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        setUsers([]);
        return;
      }

      // Get roles for each user - prioritize master_admin if exists
      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: allRoles, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.user_id);

          if (roleError) {
            console.error(`Error loading role for user ${profile.user_id}:`, roleError);
          }

          const userRole = allRoles?.find(r => r.role === 'master_admin')?.role || 
                          allRoles?.[0]?.role || 
                          "staff";

          return {
            id: profile.id,
            user_id: profile.user_id,
            full_name: profile.full_name || "",
            email: profile.email || "",
            role: userRole as "admin" | "staff" | "compliance_manager" | "board_member" | "master_admin",
            organization_id: profile.organization_id,
            invite_status: undefined as "pending" | "accepted" | undefined,
          };
        })
      );

      // Fetch invite statuses for all users
      const userIds = usersWithRoles.map(u => u.user_id);
      try {
        const { data: statusData, error: statusError } = await supabase.functions.invoke("get-user-invite-status", {
          body: { userIds },
        });

        if (!statusError && statusData?.statuses) {
          usersWithRoles.forEach(user => {
            const status = statusData.statuses[user.user_id];
            if (status) {
              user.invite_status = status.status;
            }
          });
        }
      } catch (statusErr) {
        console.error("Error fetching invite statuses:", statusErr);
      }

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error in loadAllUsers:", error);
      toast({
        variant: "destructive",
        title: "Error loading users",
        description: error.message || "Failed to load users",
      });
    }
  };

  // Helper function to reload users based on user type
  const reloadUsers = async () => {
    if (isMasterAdmin) {
      await loadAllUsers();
    } else if (adminOrgId) {
      await loadUsers(adminOrgId);
    }
  };

  const getAvailableRoles = () => {
    const roles: { value: string; label: string }[] = [
      { value: "staff", label: "Staff" },
      { value: "compliance_manager", label: "Compliance Manager" },
      { value: "board_member", label: "Board Member" },
    ];
    if (isMasterAdmin) {
      roles.unshift({ value: "admin", label: "Admin" });
    }
    return roles;
  };

  const handleCreateUser = async () => {
    try {
      setCreating(true);

      // Validation for Master Admin
      if (isMasterAdmin) {
        if (!isCreatingNewOrg && !selectedOrgId) {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please select an organization or create a new one.",
          });
          return;
        }
        if (isCreatingNewOrg && !newOrgName.trim()) {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please enter the new organization name.",
          });
          return;
        }
      } else {
        // Regular admin must belong to an organization
        if (!adminOrgId || !adminOrgName) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "You must belong to an organization to create users.",
          });
          return;
        }
      }

      if (!newUser.email || !newUser.full_name) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please fill in all required fields.",
        });
        return;
      }

      // First, check if there is already a profile using this email
      const { data: existingProfiles, error: existingProfilesError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newUser.email)
        .limit(1);

      if (existingProfilesError) {
        console.error("Error checking existing profiles", existingProfilesError);
      }

      if (existingProfiles && existingProfiles.length > 0) {
        toast({
          variant: "destructive",
          title: "Email already registered",
          description: `The email ${newUser.email} is already in use. Please use a different email address.`,
        });
        return;
      }

      // Determine organization info based on user type
      let orgIdToUse: string | undefined;
      let orgNameToUse: string | undefined;
      let createNewOrg = false;

      if (isMasterAdmin) {
        if (isCreatingNewOrg) {
          orgNameToUse = newOrgName.trim();
          createNewOrg = true;
        } else {
          orgIdToUse = selectedOrgId;
          const selectedOrg = organizations.find(o => o.id === selectedOrgId);
          orgNameToUse = selectedOrg?.name;
        }
      } else {
        orgIdToUse = adminOrgId ?? undefined;
        orgNameToUse = adminOrgName;
      }

      // Invite user via backend function - they will set their own password
      const redirectUrl = `${window.location.origin}/accept-invite`;
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: newUser.email,
          full_name: newUser.full_name,
          organization_id: createNewOrg ? undefined : orgIdToUse,
          organization_name: orgNameToUse,
          create_new_organization: createNewOrg,
          role: newUser.role,
          redirect_to: redirectUrl,
        },
      });

      if (error) {
        // Handle specific error cases coming from the edge function
        if (error.message?.includes("already exists") || error.message?.includes("already been registered")) {
          toast({
            variant: "destructive",
            title: "Email already registered",
            description: `The email ${newUser.email} is already in use. Please use a different email address.`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error creating user",
            description: error.message || "Failed to create user",
          });
        }
        return;
      }

      toast({
        title: "Invitation sent",
        description: `An invitation email has been sent to ${newUser.email}.`,
      });

      setNewUser({
        email: "",
        full_name: "",
        role: "staff" as "admin" | "staff" | "compliance_manager" | "board_member",
      });
      setSelectedOrgId("");
      setNewOrgName("");
      setIsCreatingNewOrg(false);

      // Reload organizations if a new one was created
      if (createNewOrg) {
        const { data: allOrgs } = await supabase
          .from("organizations")
          .select("id, name")
          .order("name");
        if (allOrgs) {
          setOrganizations(allOrgs);
        }
      }

      await reloadUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating user",
        description: error.message || "Failed to create user",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleResendInvite = async (userId: string, email: string) => {
    try {
      setResendingInvite(userId);
      const redirectUrl = `${window.location.origin}/accept-invite`;
      
      const { error } = await supabase.functions.invoke("resend-invite", {
        body: { email, redirect_to: redirectUrl },
      });

      if (error) throw error;

      toast({
        title: "Invite resent",
        description: `A new invitation has been sent to ${email}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error resending invite",
        description: error.message || "Failed to resend invite",
      });
    } finally {
      setResendingInvite(null);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    try {
      // Call edge function to delete user from auth (cascades to profiles and roles)
      const { error } = await supabase.functions.invoke("delete-user", {
        body: { userId },
      });

      if (error) throw error;

      toast({
        title: "User deleted",
        description: `${email} has been removed.`,
      });

      await reloadUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting user",
        description: error.message,
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: editingUser.full_name,
          email: editingUser.email,
        })
        .eq("user_id", editingUser.user_id);

      if (profileError) throw profileError;

      // Update role
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role: editingUser.role })
        .eq("user_id", editingUser.user_id);

      if (roleError) throw roleError;

      toast({
        title: "User updated",
        description: `${editingUser.email} has been updated successfully.`,
      });

      setEditingUser(null);
      await reloadUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating user",
        description: error.message,
      });
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "master_admin":
        return "Master Admin";
      case "admin":
        return "Admin";
      case "staff":
        return "Staff";
      case "compliance_manager":
        return "Compliance Manager";
      case "board_member":
        return "Board Member";
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container max-w-6xl py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Standards
      </Button>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="standards">Standards Management</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
              <CardDescription>
                {isMasterAdmin 
                  ? "Add new users to any organization or create a new organization"
                  : `Add new staff members or compliance managers to your organization${adminOrgName ? ` (${adminOrgName})` : ""}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    placeholder="user@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={newUser.full_name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, full_name: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>

                {isMasterAdmin && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="organization">Organization</Label>
                    {!isCreatingNewOrg ? (
                      <div className="space-y-2">
                        <Select
                          value={selectedOrgId}
                          onValueChange={(value) => {
                            if (value === "__create_new__") {
                              setIsCreatingNewOrg(true);
                              setSelectedOrgId("");
                            } else {
                              setSelectedOrgId(value);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an organization" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="__create_new__" className="text-primary font-medium">
                              + Create New Organization
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            id="new_org_name"
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            placeholder="Enter new organization name"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsCreatingNewOrg(false);
                              setNewOrgName("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: "admin" | "staff" | "compliance_manager" | "board_member") =>
                      setNewUser({ ...newUser, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRoles().map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCreateUser}
                disabled={
                  creating ||
                  !newUser.email ||
                  !newUser.full_name ||
                  (isMasterAdmin && !isCreatingNewOrg && !selectedOrgId) ||
                  (isMasterAdmin && isCreatingNewOrg && !newOrgName.trim())
                }
                className="w-full"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending invite...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Users</CardTitle>
              <CardDescription>
                Manage users in your organization{adminOrgName && ` (${adminOrgName})`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleLabel(user.role)}</TableCell>
                        <TableCell>
                          {user.invite_status === "accepted" ? (
                            <Badge variant="default" className="bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30">
                              <Check className="mr-1 h-3 w-3" />
                              Accepted
                            </Badge>
                          ) : user.invite_status === "pending" ? (
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/30">
                              <Clock className="mr-1 h-3 w-3" />
                              Pending
                            </Badge>
                          ) : (
                            <Badge variant="outline">Unknown</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {user.invite_status === "pending" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleResendInvite(user.user_id, user.email)}
                                disabled={resendingInvite === user.user_id}
                                title="Resend invitation"
                              >
                                {resendingInvite === user.user_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {/* Master admins can edit/delete admins but not other master_admins */}
                            {/* Admins cannot edit/delete other admins or master_admins */}
                            {(isMasterAdmin ? user.role !== "master_admin" : (user.role !== "admin" && user.role !== "master_admin")) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingUser(user)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete {user.email}? This
                                        action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDeleteUser(user.user_id, user.email)
                                        }
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="standards">
          <Card>
            <CardHeader>
              <CardTitle>Standards Management</CardTitle>
              <CardDescription>
                Manage CSBG standards (Coming Soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Standards management features will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <AlertDialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit User</AlertDialogTitle>
            <AlertDialogDescription>
              Update user information
            </AlertDialogDescription>
          </AlertDialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-full-name">Full Name</Label>
                <Input
                  id="edit-full-name"
                  value={editingUser.full_name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, full_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value: "admin" | "staff" | "compliance_manager") =>
                    setEditingUser({ ...editingUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="compliance_manager">
                      Compliance Manager
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateUser}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
