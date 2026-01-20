import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogFieldConfig } from "./configs";

interface LogEntry {
  id: string;
  title: string;
  event_type?: string;
  event_date: string;
  end_date?: string | null;
  participant_count?: number;
  geography?: string | null;
  notes?: string | null;
  evidence?: { id: string; file_name: string; file_url: string; file_size?: number }[];
}

interface LogViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: LogEntry | null;
  logConfig: LogFieldConfig;
}

export function LogViewModal({ open, onOpenChange, log, logConfig }: LogViewModalProps) {
  const { toast } = useToast();

  if (!log) return null;

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("standard-documents")
        .download(fileUrl);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: "Download failed", description: e.message, variant: "destructive" });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {log.title}
            <Badge variant="outline">{log.event_type || "Log Entry"}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{logConfig.dateLabel || "Date"}</p>
              <p className="font-medium">{format(new Date(log.event_date), "MMMM d, yyyy")}</p>
            </div>
            {logConfig.showEndDate && log.end_date && (
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">{format(new Date(log.end_date), "MMMM d, yyyy")}</p>
              </div>
            )}
          </div>

          {/* Participant Count & Geography */}
          {(logConfig.showParticipantCount || logConfig.showGeography) && (
            <div className="grid grid-cols-2 gap-4">
              {logConfig.showParticipantCount && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {logConfig.participantCountLabel || "# Participants"}
                  </p>
                  <p className="font-medium">{log.participant_count ?? 0}</p>
                </div>
              )}
              {logConfig.showGeography && log.geography && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {logConfig.geographyLabel || "Geography / Service Area"}
                  </p>
                  <p className="font-medium">{log.geography}</p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {log.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm whitespace-pre-wrap">{log.notes}</p>
            </div>
          )}

          {/* Evidence Files */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Evidence Files</p>
            {log.evidence && log.evidence.length > 0 ? (
              <div className="space-y-2">
                {log.evidence.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file.file_url, file.file_name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No evidence files attached</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
