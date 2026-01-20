import { Button } from "@/components/ui/button";
import { Save, Plus, Upload, CheckCircle2, FileText, Send } from "lucide-react";

interface StandardFooterActionsProps {
  saving: boolean;
  onSave: () => void;
  onAddActivity: () => void;
  onUploadEvidence: () => void;
  showCompliantButton: boolean;
  onMarkCompliant: () => void;
  onGeneratePDF: () => void;
  addActivityLabel?: string;
  showSubmitButton?: boolean;
  onSubmit?: () => void;
}

export function StandardFooterActions({
  saving,
  onSave,
  onAddActivity,
  onUploadEvidence,
  showCompliantButton,
  onMarkCompliant,
  onGeneratePDF,
  addActivityLabel = "Add Activity",
  showSubmitButton = false,
  onSubmit,
}: StandardFooterActionsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
      <div className="container mx-auto flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={onSave} disabled={saving}>
          <Save className="mr-1 h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={onAddActivity}>
          <Plus className="mr-1 h-4 w-4" /> {addActivityLabel}
        </Button>
        <Button variant="outline" onClick={onUploadEvidence}>
          <Upload className="mr-1 h-4 w-4" /> Upload Evidence
        </Button>
        {showSubmitButton && onSubmit && (
          <Button onClick={onSubmit}>
            <Send className="mr-1 h-4 w-4" /> Submit for Review
          </Button>
        )}
        {showCompliantButton && (
          <Button onClick={onMarkCompliant} className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="mr-1 h-4 w-4" /> Mark as Compliant
          </Button>
        )}
        <Button variant="outline" onClick={onGeneratePDF}>
          <FileText className="mr-1 h-4 w-4" /> Generate PDF
        </Button>
      </div>
    </div>
  );
}
