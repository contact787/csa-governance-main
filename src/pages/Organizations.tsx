import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Building2, Edit, Trash2, Users, Search } from "lucide-react";
import { format } from "date-fns";

interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  user_count?: number;
}

interface OrgUser {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at: string;
}

export default function Organizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
  const [viewingUsersOrg, setViewingUsersOrg] = useState<Organization | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      // Load organizations
      const { data: orgs, error: orgsError } = await supabase
        .from("organizations")
        .select("*")
        .order("name", { ascending: true });

      if (orgsError) throw orgsError;

      // Load user counts for each organization
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("organization_id");

      if (profilesError) throw profilesError;

      // Count users per organization
      const userCounts: Record<string, number> = {};
      profiles?.forEach((profile) => {
        if (profile.organization_id) {
          userCounts[profile.organization_id] = (userCounts[profile.organization_id] || 0) + 1;
        }
      });

      const orgsWithCounts = orgs?.map((org) => ({
        ...org,
        user_count: userCounts[org.id] || 0,
      })) || [];

      setOrganizations(orgsWithCounts);
    } catch (error: any) {
      toast({
        title: "Error loading organizations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewUsers = async (org: Organization) => {
    setViewingUsersOrg(org);
    setLoadingUsers(true);
    setOrgUsers([]);

    try {
      // Get profiles for this organization
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, created_at")
        .eq("organization_id", org.id)
        .order("full_name", { ascending: true });

      if (profilesError) throw profilesError;

      // Get roles for these users
      const userIds = profiles?.map((p) => p.user_id) || [];
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      if (rolesError) throw rolesError;

      // Map roles to users
      const roleMap: Record<string, string> = {};
      roles?.forEach((r) => {
        roleMap[r.user_id] = r.role;
      });

      const usersWithRoles: OrgUser[] = (profiles || []).map((p) => ({
        ...p,
        role: roleMap[p.user_id] || null,
      }));

      setOrgUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "Error loading users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleEditOrg = (org: Organization) => {
    setEditingOrg(org);
    setEditName(org.name);
  };

  const handleSaveEdit = async () => {
    if (!editingOrg || !editName.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ name: editName.trim() })
        .eq("id", editingOrg.id);

      if (error) throw error;

      toast({ title: "Organization updated successfully" });
      setEditingOrg(null);
      await loadOrganizations();
    } catch (error: any) {
      toast({
        title: "Error updating organization",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!deletingOrg) return;

    setSaving(true);
    try {
      // First, get all users in this organization
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("organization_id", deletingOrg.id);

      if (profilesError) throw profilesError;

      const userIds = profiles?.map((p) => p.user_id) || [];

      // Delete user roles for these users
      if (userIds.length > 0) {
        const { error: rolesError } = await supabase
          .from("user_roles")
          .delete()
          .in("user_id", userIds);

        if (rolesError) throw rolesError;

        // Delete profiles
        const { error: deleteProfilesError } = await supabase
          .from("profiles")
          .delete()
          .eq("organization_id", deletingOrg.id);

        if (deleteProfilesError) throw deleteProfilesError;
      }

      // Delete the organization
      const { error: deleteOrgError } = await supabase
        .from("organizations")
        .delete()
        .eq("id", deletingOrg.id);

      if (deleteOrgError) throw deleteOrgError;

      toast({ 
        title: "Organization deleted",
        description: `${deletingOrg.name} and ${userIds.length} user(s) have been removed.`
      });
      setDeletingOrg(null);
      await loadOrganizations();
    } catch (error: any) {
      toast({
        title: "Error deleting organization",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          Organizations
        </h1>
        <p className="text-muted-foreground">
          Manage all organizations in the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>All Organizations ({organizations.length})</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrganizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No organizations match your search" : "No organizations found"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 hover:underline p-0 h-auto font-normal"
                        onClick={() => handleViewUsers(org)}
                      >
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {org.user_count} user{org.user_count !== 1 ? "s" : ""}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {format(new Date(org.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditOrg(org)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingOrg(org)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingOrg} onOpenChange={() => setEditingOrg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update the organization name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter organization name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOrg(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving || !editName.trim()}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingOrg} onOpenChange={() => setDeletingOrg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <strong>{deletingOrg?.name}</strong>?
              </p>
              <p className="text-destructive font-medium">
                This will permanently delete the organization and all {deletingOrg?.user_count || 0} user(s) associated with it.
              </p>
              <p>This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrg}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete Organization"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Users Dialog */}
      <Dialog open={!!viewingUsersOrg} onOpenChange={() => setViewingUsersOrg(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users in {viewingUsersOrg?.name}
            </DialogTitle>
            <DialogDescription>
              {orgUsers.length} user{orgUsers.length !== 1 ? "s" : ""} in this organization
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingUsers ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading users...
              </div>
            ) : orgUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found in this organization
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || "—"}
                      </TableCell>
                      <TableCell>{user.email || "—"}</TableCell>
                      <TableCell>
                        <span className="capitalize">{user.role?.replace("_", " ") || "—"}</span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingUsersOrg(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}