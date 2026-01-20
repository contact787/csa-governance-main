import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Megaphone, Globe, Building } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_global: boolean;
  organization_id: string | null;
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAnnouncements();
    checkMasterAdmin();
  }, []);

  const checkMasterAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (roles) {
      setIsMasterAdmin(roles.some(r => r.role === "master_admin"));
    }
  };

  const loadAnnouncements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading announcements",
        description: error.message,
      });
    }
  };

  const createAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        variant: "destructive",
        title: "Required fields",
        description: "Please fill in the title and content of the announcement.",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get user's organization and name
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id, full_name")
        .eq("user_id", user.id)
        .single();

      // Master admin announcements are always global
      const isGlobal = isMasterAdmin;

      const { error } = await supabase.from("announcements").insert({
        title: title.trim(),
        content: content.trim(),
        created_by: user.id,
        creator_name: profile?.full_name || "Unknown",
        organization_id: isGlobal ? null : profile?.organization_id,
        is_global: isGlobal,
      });

      if (error) throw error;

      toast({
        title: "Announcement created",
        description: isGlobal 
          ? "The announcement will be displayed to all users."
          : "The announcement will be displayed to users in your organization.",
      });

      setTitle("");
      setContent("");
      loadAnnouncements();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating announcement",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Announcement deleted",
        description: "The announcement was successfully removed.",
      });

      loadAnnouncements();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting announcement",
        description: error.message,
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Megaphone className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Announcements</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Announcement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Announcement title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write the announcement content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>
          {isMasterAdmin && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" />
              All your announcements are global and visible to all organizations.
            </p>
          )}
          <Button onClick={createAnnouncement} disabled={loading}>
            {loading ? "Creating..." : "Create Announcement"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              You haven't created any announcements yet.
            </p>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{announcement.title}</h3>
                        {announcement.is_global ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            <Globe className="h-3 w-3" />
                            Global
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            <Building className="h-3 w-3" />
                            Organization
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(announcement.created_at), "MM/dd/yyyy HH:mm")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAnnouncement(announcement.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
