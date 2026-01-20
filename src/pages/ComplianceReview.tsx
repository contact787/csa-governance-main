import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, FileText } from "lucide-react";

interface StandardReview {
  id: string;
  standard: {
    standard_id: string;
    title: string;
    information_to_collect: string;
  };
  submitted_by_profile: {
    full_name: string;
    email: string;
  };
  submitted_at: string;
  comments: string | null;
  documents: Array<{
    id: string;
    file_name: string;
    file_url: string;
    uploaded_at: string;
  }>;
}

export default function ComplianceReview() {
  const [standards, setStandards] = useState<StandardReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStandard, setSelectedStandard] = useState<string | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadSubmittedStandards();
  }, []);

  const loadSubmittedStandards = async () => {
    try {
      const { data: orgStandards, error } = await supabase
        .from("organization_standards")
        .select(`
          id,
          submitted_at,
          submitted_by,
          comments,
          standard:standards (
            standard_id,
            title,
            information_to_collect
          ),
          documents:standard_documents (
            id,
            file_name,
            file_url,
            uploaded_at
          )
        `)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      if (!orgStandards || orgStandards.length === 0) {
        setStandards([]);
        return;
      }

      // Buscar informações dos usuários que submeteram
      const userIds = orgStandards.map((s: any) => s.submitted_by).filter(Boolean);
      
      if (userIds.length === 0) {
        setStandards(orgStandards.map((standard: any) => ({
          ...standard,
          submitted_by_profile: { full_name: "Unknown", email: "N/A" }
        })) as any);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }

      // Combinar os dados
      const standardsWithProfiles = orgStandards.map((standard: any) => {
        const profile = profiles?.find((p) => p.user_id === standard.submitted_by);
        return {
          ...standard,
          submitted_by_profile: profile || {
            full_name: "Unknown",
            email: "N/A",
          },
        };
      });

      setStandards(standardsWithProfiles as any);
    } catch (error: any) {
      toast({
        title: "Error loading standards",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (standardId: string, newStatus: "compliant" | "not_compliant") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("organization_standards")
        .update({
          status: newStatus,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          comments: reviewComments || null,
        })
        .eq("id", standardId);

      if (error) throw error;

      toast({
        title: "Review submitted",
        description: `Standard marked as ${newStatus === "compliant" ? "Compliant" : "Not Compliant"}`,
      });

      setSelectedStandard(null);
      setReviewComments("");
      loadSubmittedStandards();
    } catch (error: any) {
      toast({
        title: "Error submitting review",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const downloadDocument = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("standard-documents")
        .download(fileUrl);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error downloading file",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Compliance Review</h1>
        <p className="text-muted-foreground">
          Review standards submitted by staff members
        </p>
      </div>

      {standards.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No standards pending review
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {standards.map((standard) => (
            <Card key={standard.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {standard.standard.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <span className="font-medium">ID:</span> {standard.standard.standard_id}
                    </CardDescription>
                    <CardDescription>
                      Submitted by: {standard.submitted_by_profile.full_name} ({standard.submitted_by_profile.email})
                    </CardDescription>
                    <CardDescription>
                      Submitted at: {new Date(standard.submitted_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Badge>Submitted</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Information to Collect</h3>
                  <p className="text-sm text-muted-foreground">
                    {standard.standard.information_to_collect}
                  </p>
                </div>

                {standard.documents.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Submitted Documents</h3>
                    <div className="space-y-2">
                      {standard.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{doc.file_name}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadDocument(doc.file_url, doc.file_name)}
                          >
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {standard.comments && (
                  <div>
                    <h3 className="font-semibold mb-2">Staff Comments</h3>
                    <p className="text-sm text-muted-foreground">{standard.comments}</p>
                  </div>
                )}

                {selectedStandard === standard.id ? (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Review Comments (Optional)
                      </label>
                      <Textarea
                        value={reviewComments}
                        onChange={(e) => setReviewComments(e.target.value)}
                        placeholder="Add comments about your review..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleReview(standard.id, "compliant")}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark as Compliant
                      </Button>
                      <Button
                        onClick={() => handleReview(standard.id, "not_compliant")}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Mark as Not Compliant
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedStandard(null);
                          setReviewComments("");
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setSelectedStandard(standard.id)}
                    className="w-full"
                  >
                    Review Standard
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
