import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Link as LinkIcon, FileText, Trash2, ExternalLink, Download } from "lucide-react";

interface Resource {
  id: string;
  name: string;
  type: "link" | "document";
  url: string;
  file_size: number | null;
  created_at: string;
}

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resourceType, setResourceType] = useState<"link" | "document">("link");
  const [resourceName, setResourceName] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (profile?.organization_id) {
        setOrganizationId(profile.organization_id);
      }

      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources((data || []).map(r => ({
        ...r,
        type: r.type as "link" | "document"
      })));
    } catch (error) {
      console.error("Error loading resources:", error);
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!resourceName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    if (!organizationId) {
      toast.error("Organization not found");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);

    try {
      let url = resourceUrl;
      let fileSize = null;

      if (resourceType === "document") {
        if (!selectedFile) {
          toast.error("Please select a file");
          setUploading(false);
          return;
        }

        const filePath = `${organizationId}/${Date.now()}_${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("resources")
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("resources")
          .getPublicUrl(filePath);

        url = urlData.publicUrl;
        fileSize = selectedFile.size;
      } else {
        if (!resourceUrl.trim()) {
          toast.error("Please enter a URL");
          setUploading(false);
          return;
        }
      }

      const { error } = await supabase.from("resources").insert({
        organization_id: organizationId,
        name: resourceName.trim(),
        type: resourceType,
        url,
        file_size: fileSize,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Resource added successfully");
      setDialogOpen(false);
      setResourceName("");
      setResourceUrl("");
      setSelectedFile(null);
      setResourceType("link");
      loadResources();
    } catch (error) {
      console.error("Error adding resource:", error);
      toast.error("Failed to add resource");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resource: Resource) => {
    try {
      if (resource.type === "document" && resource.url) {
        // Extract file path from URL
        const urlParts = resource.url.split("/resources/");
        if (urlParts[1]) {
          await supabase.storage.from("resources").remove([urlParts[1]]);
        }
      }

      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", resource.id);

      if (error) throw error;

      toast.success("Resource deleted");
      loadResources();
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Resource Tab</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Resource</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Resource Type</Label>
                <Select
                  value={resourceType}
                  onValueChange={(v) => setResourceType(v as "link" | "document")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Enter resource name"
                  value={resourceName}
                  onChange={(e) => setResourceName(e.target.value)}
                />
              </div>

              {resourceType === "link" ? (
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    placeholder="https://example.com"
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>File</Label>
                  <Input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? "Adding..." : "Add Resource"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : resources.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No resources yet. Add links or documents for your team.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <Card key={resource.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {resource.type === "link" ? (
                    <LinkIcon className="h-5 w-5 text-primary" />
                  ) : (
                    <FileText className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <p className="font-medium">{resource.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {resource.type === "link" ? resource.url : formatFileSize(resource.file_size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(resource.url, "_blank")}
                  >
                    {resource.type === "link" ? (
                      <ExternalLink className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(resource)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
