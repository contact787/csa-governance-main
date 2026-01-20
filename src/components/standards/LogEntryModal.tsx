import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
  evidence?: { id: string; file_name: string; file_url: string }[];
}

interface LogEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<LogEntry, "id" | "evidence">, files: File[]) => Promise<void>;
  editingLog?: LogEntry | null;
  logConfig: LogFieldConfig;
  eventTypes?: string[];
}

export function LogEntryModal({
  open,
  onOpenChange,
  onSave,
  editingLog,
  logConfig,
  eventTypes = ["Meeting", "Review", "Assessment", "Training", "Other"],
}: LogEntryModalProps) {
  const [eventType, setEventType] = useState("");
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [participantCount, setParticipantCount] = useState("");
  const [geography, setGeography] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingLog) {
      setEventType(editingLog.event_type || "");
      setTitle(editingLog.title || "");
      setEventDate(editingLog.event_date ? new Date(editingLog.event_date) : undefined);
      setEndDate(editingLog.end_date ? new Date(editingLog.end_date) : undefined);
      setParticipantCount(editingLog.participant_count?.toString() || "");
      setGeography(editingLog.geography || "");
      setNotes(editingLog.notes || "");
    } else {
      resetForm();
    }
  }, [editingLog, open]);

  const resetForm = () => {
    setEventType("");
    setTitle("");
    setEventDate(undefined);
    setEndDate(undefined);
    setParticipantCount("");
    setGeography("");
    setNotes("");
    setFiles([]);
  };

  const handleSave = async () => {
    if (!title || !eventDate) return;

    setSaving(true);
    try {
      const data: any = {
        title,
        event_type: eventType || "Other",
        event_date: format(eventDate, "yyyy-MM-dd"),
      };

      if (logConfig.showEndDate && endDate) {
        data.end_date = format(endDate, "yyyy-MM-dd");
      }
      if (logConfig.showParticipantCount) {
        data.participant_count = parseInt(participantCount) || 0;
      }
      if (logConfig.showGeography) {
        data.geography = geography || null;
      }
      if (notes) {
        data.notes = notes;
      }

      await onSave(data, files);
      resetForm();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingLog ? "Edit Log Entry" : "Add Log Entry"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Event Type & Title Row */}
          <div className="grid grid-cols-2 gap-4">
            {logConfig.showEventType && (
              <div className="space-y-2">
                <Label>{logConfig.eventTypeLabel || "Event Type"}</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    {eventTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className={cn("space-y-2", !logConfig.showEventType && "col-span-2")}>
              <Label>{logConfig.titleLabel || "Title"} *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
              />
            </div>
          </div>

          {/* Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{logConfig.dateLabel || "Date"} *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !eventDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventDate ? format(eventDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border" align="start">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={setEventDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {logConfig.showEndDate && (
              <div className="space-y-2">
                <Label>End Date (if multi-day)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background border" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Participant Count & Geography Row */}
          {(logConfig.showParticipantCount || logConfig.showGeography) && (
            <div className="grid grid-cols-2 gap-4">
              {logConfig.showParticipantCount && (
                <div className="space-y-2">
                  <Label>{logConfig.participantCountLabel || "# Participants"}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={participantCount}
                    onChange={(e) => setParticipantCount(e.target.value)}
                    placeholder="0"
                  />
                </div>
              )}

              {logConfig.showGeography && (
                <div className="space-y-2">
                  <Label>{logConfig.geographyLabel || "Geography / Service Area"}</Label>
                  <Input
                    value={geography}
                    onChange={(e) => setGeography(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this entry"
              rows={3}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload Evidence Files</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="log-evidence-files"
              />
              <label htmlFor="log-evidence-files" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload files</p>
              </label>
            </div>
            {files.length > 0 && (
              <div className="space-y-2 mt-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !title || !eventDate}>
            {saving ? "Saving..." : editingLog ? "Update Entry" : "Add Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
