import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
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
  created_at?: string;
  evidence?: { id: string; file_name: string; file_url: string }[];
}

interface LogEntryTableProps {
  logs: LogEntry[];
  onView: (log: LogEntry) => void;
  onEdit: (log: LogEntry) => void;
  onDelete: (logId: string) => void;
  canEdit: boolean;
  logConfig: LogFieldConfig;
  emptyMessage?: string;
}

export function LogEntryTable({
  logs,
  onView,
  onEdit,
  onDelete,
  canEdit,
  logConfig,
  emptyMessage = "No log entries yet. Click \"Add Log Entry\" to create one.",
}: LogEntryTableProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {logConfig.showEventType && <TableHead>Type</TableHead>}
            <TableHead>Title</TableHead>
            <TableHead>Date</TableHead>
            {logConfig.showParticipantCount && (
              <TableHead className="text-center"># Participants</TableHead>
            )}
            <TableHead className="text-center">Evidence</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const hasEvidence = log.evidence && log.evidence.length > 0;
            return (
              <TableRow key={log.id}>
                {logConfig.showEventType && (
                  <TableCell className="font-medium">{log.event_type || "-"}</TableCell>
                )}
                <TableCell>{log.title}</TableCell>
                <TableCell>
                  {format(new Date(log.event_date), "MM/dd/yy")}
                  {log.end_date && ` - ${format(new Date(log.end_date), "MM/dd/yy")}`}
                </TableCell>
                {logConfig.showParticipantCount && (
                  <TableCell className="text-center">{log.participant_count ?? "-"}</TableCell>
                )}
                <TableCell className="text-center">
                  {hasEvidence ? (
                    <div className="flex items-center justify-center gap-1">
                      <FileText className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{log.evidence!.length}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={hasEvidence ? "default" : "secondary"}>
                    {hasEvidence ? "Complete" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onView(log)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(log)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(log.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
