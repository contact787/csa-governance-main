import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  CalendarIcon,
  AlertTriangle,
  Plus,
  Upload,
  FileText,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { StandardFooterActions } from "./StandardFooterActions";
import { LogEntryModal } from "./LogEntryModal";
import { LogEntryTable } from "./LogEntryTable";
import { LogViewModal } from "./LogViewModal";
import { EvidenceUploadModal } from "./EvidenceUploadModal";
import { StandardConfig, LogFieldConfig, DEPARTMENT_OPTIONS, FREQUENCY_OPTIONS } from "./configs";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Types
interface MethodEvidence {
  id: string;
  method_key: string;
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
}

interface ActivityLog {
  id: string;
  action_type: string;
  description: string;
  performed_by: string;
  performed_at: string;
  metadata: Record<string, any> | null;
  performer?: { full_name: string | null };
}

interface DocumentLog {
  id: string;
  title: string;
  event_type?: string;
  event_date: string;
  end_date?: string | null;
  participant_count?: number;
  geography?: string | null;
  notes?: string | null;
  created_at?: string;
  evidence?: { id: string; file_name: string; file_url: string; file_size?: number }[];
}

interface OrganizationMember {
  id: string;
  user_id: string;
  full_name: string | null;
}

const statusColors = {
  compliant: "bg-green-500",
  pending: "bg-yellow-500",
  submitted: "bg-blue-500",
  not_compliant: "bg-red-500",
};

// Default log config if not provided
const DEFAULT_LOG_CONFIG: LogFieldConfig = {
  showEventType: false,
  showEndDate: false,
  showParticipantCount: false,
  showGeography: false,
  titleLabel: "Title",
  dateLabel: "Date",
};

interface GenericStandardDetailProps {
  config: StandardConfig;
}

export default function GenericStandardDetail({ config }: GenericStandardDetailProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const orgStandardId = searchParams.get("id");

  // Data state
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);

  // Form state
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [frequency, setFrequency] = useState<string>(config.defaultFrequency);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [otherMethodDescription, setOtherMethodDescription] = useState("");
  const [responsiblePersonId, setResponsiblePersonId] = useState<string>("");
  const [complianceOwnerDepartment, setComplianceOwnerDepartment] = useState<string>("");
  const [verificationMethodNotes, setVerificationMethodNotes] = useState("");
  const [complianceNotes, setComplianceNotes] = useState("");

  // Related data
  const [methodEvidence, setMethodEvidence] = useState<MethodEvidence[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [documentLogs, setDocumentLogs] = useState<DocumentLog[]>([]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DocumentLog | null>(null);
  const [viewingLog, setViewingLog] = useState<DocumentLog | null>(null);
  const [viewLogModalOpen, setViewLogModalOpen] = useState(false);
  const [evidenceUploadModalOpen, setEvidenceUploadModalOpen] = useState(false);

  // Get log config from standard config or use default
  const logConfig = config.logConfig || DEFAULT_LOG_CONFIG;
  const eventTypes = logConfig.eventTypes || ["Meeting", "Review", "Assessment", "Training", "Other"];

  const canEdit = userRole === "staff" || userRole === "admin" || userRole === "master_admin";
  const isAdmin = userRole === "admin" || userRole === "master_admin";
  const canEditComplianceNotes = userRole === "admin" || userRole === "compliance_manager" || userRole === "master_admin";

  useEffect(() => {
    if (!orgStandardId) return;
    loadAllData();
    checkUserRole();
  }, [orgStandardId]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setUserRole(data?.role ?? null);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAllData = async () => {
    try {
      await Promise.all([
        loadDetail(),
        loadMethodEvidence(),
        loadActivityLogs(),
        loadOrganizationMembers(),
        loadSelectedMethods(),
        loadDocumentLogs(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async () => {
    const { data, error } = await supabase
      .from("organization_standards")
      .select(`
        id,
        status,
        due_date,
        frequency,
        responsible_person_id,
        compliance_owner_department,
        verification_method_notes,
        compliance_notes,
        updated_at,
        standard:standards (
          standard_id,
          title,
          information_to_collect,
          responsible_role,
          compliance_owner,
          frequency,
          verification_method
        ),
        responsible_person:profiles!organization_standards_responsible_person_id_fkey (
          id,
          full_name
        )
      `)
      .eq("id", orgStandardId)
      .maybeSingle();

    if (error) {
      toast({ title: "Error loading standard", description: error.message, variant: "destructive" });
      return;
    }

    if (data) {
      setDetail(data);
      if (data.due_date) {
        const [year, month, day] = data.due_date.split("-").map(Number);
        setDueDate(new Date(year, month - 1, day));
      }
      setFrequency(data.frequency || config.defaultFrequency);
      setResponsiblePersonId(data.responsible_person_id || "");
      setComplianceOwnerDepartment(data.compliance_owner_department || "");
      setVerificationMethodNotes(data.verification_method_notes || "");
      setComplianceNotes(data.compliance_notes || "");
    }
  };

  const loadSelectedMethods = async () => {
    const { data } = await supabase
      .from("participation_methods")
      .select("method_key, other_description")
      .eq("organization_standard_id", orgStandardId);

    if (data) {
      setSelectedMethods(data.map((m) => m.method_key));
      const otherMethod = data.find((m) => m.method_key === "other");
      if (otherMethod) {
        setOtherMethodDescription(otherMethod.other_description || "");
      }
    }
  };

  const loadDocumentLogs = async () => {
    const { data } = await supabase
      .from("participation_logs")
      .select(`
        *,
        evidence:participation_log_evidence (*)
      `)
      .eq("organization_standard_id", orgStandardId)
      .order("event_date", { ascending: false });

    if (data) {
      setDocumentLogs(data as any[]);
    }
  };

  const loadMethodEvidence = async () => {
    const { data } = await supabase
      .from("method_evidence")
      .select("*")
      .eq("organization_standard_id", orgStandardId)
      .order("uploaded_at", { ascending: false });

    if (data) {
      setMethodEvidence(data as MethodEvidence[]);
    }
  };

  const loadActivityLogs = async () => {
    const { data } = await supabase
      .from("standard_activity_logs")
      .select("*")
      .eq("organization_standard_id", orgStandardId)
      .order("performed_at", { ascending: false })
      .limit(50);

    if (data) {
      const performerIds = [...new Set(data.map((d) => d.performed_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", performerIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

      const logsWithPerformers = data.map((log) => ({
        ...log,
        performer: { full_name: profileMap.get(log.performed_by) || null },
      }));

      setActivityLogs(logsWithPerformers as ActivityLog[]);
    }
  };

  const loadOrganizationMembers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: orgId } = await supabase.rpc("get_user_organization_id", { _user_id: user.id });
    if (!orgId) return;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, user_id")
      .eq("organization_id", orgId);

    if (!profiles) return;

    const { data: staffRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "staff");

    const staffUserIds = new Set(staffRoles?.map((r) => r.user_id) || []);
    const staffMembers = profiles.filter((p) => staffUserIds.has(p.user_id));
    setOrganizationMembers(staffMembers);
  };

  const logActivity = async (actionType: string, description: string, metadata?: Record<string, any>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("standard_activity_logs").insert({
      organization_standard_id: orgStandardId,
      action_type: actionType,
      description,
      performed_by: user.id,
      metadata,
    });
  };

  const handleMethodToggle = async (methodKey: string, checked: boolean) => {
    if (checked) {
      setSelectedMethods([...selectedMethods, methodKey]);
      await supabase.from("participation_methods").insert({
        organization_standard_id: orgStandardId,
        method_key: methodKey,
      });
      await logActivity("edit", `Added method: ${methodKey}`);
    } else {
      setSelectedMethods(selectedMethods.filter((m) => m !== methodKey));
      await supabase
        .from("participation_methods")
        .delete()
        .eq("organization_standard_id", orgStandardId)
        .eq("method_key", methodKey);
      await logActivity("edit", `Removed method: ${methodKey}`);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("organization_standards")
        .update({
          due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
          frequency,
          responsible_person_id: responsiblePersonId || null,
          compliance_owner_department: complianceOwnerDepartment || null,
          verification_method_notes: verificationMethodNotes || null,
          compliance_notes: complianceNotes || null,
          updated_by: user.id,
        })
        .eq("id", orgStandardId);

      if (error) throw error;

      if (selectedMethods.includes("other")) {
        await supabase
          .from("participation_methods")
          .update({ other_description: otherMethodDescription })
          .eq("organization_standard_id", orgStandardId)
          .eq("method_key", "other");
      }

      await logActivity("edit", "Saved changes to standard configuration");
      toast({ title: "Changes saved successfully" });
      await loadDetail();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadMethodEvidence = async (methodKey: string, files: FileList) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const storagePath = `${user.id}/${Date.now()}_${file.name}`;
        await supabase.storage.from("standard-documents").upload(storagePath, file);
        await supabase.from("method_evidence").insert({
          organization_standard_id: orgStandardId,
          method_key: methodKey,
          file_url: storagePath,
          file_name: file.name,
          file_size: file.size,
          uploaded_by: user.id,
        });
      }

      await logActivity("upload", `Uploaded evidence for ${methodKey}`);
      toast({ title: "Evidence uploaded" });
      await loadMethodEvidence();
      await loadActivityLogs();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteMethodEvidence = async (evidenceId: string, fileUrl: string) => {
    try {
      await supabase.storage.from("standard-documents").remove([fileUrl]);
      await supabase.from("method_evidence").delete().eq("id", evidenceId);

      await logActivity("edit", "Deleted evidence file");
      toast({ title: "Evidence deleted" });
      await loadMethodEvidence();
      await loadActivityLogs();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updates: any = { status: newStatus };
      if (newStatus === "submitted") {
        updates.submitted_by = user.id;
        updates.submitted_at = new Date().toISOString();
      }
      if (newStatus === "compliant" || newStatus === "not_compliant") {
        updates.reviewed_by = user.id;
        updates.reviewed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("organization_standards")
        .update(updates)
        .eq("id", orgStandardId);

      if (error) throw error;

      await logActivity("status_change", `Status changed to ${newStatus}`);
      toast({ title: "Status updated" });
      await loadDetail();
      await loadActivityLogs();
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    }
  };

  const handleSaveLog = async (data: any, files: File[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (editingLog) {
        // Update existing log
        const { error } = await supabase
          .from("participation_logs")
          .update({
            title: data.title,
            event_type: data.event_type,
            event_date: data.event_date,
            end_date: data.end_date || null,
            participant_count: data.participant_count || 0,
            geography: data.geography || null,
            notes: data.notes || null,
          })
          .eq("id", editingLog.id);

        if (error) throw error;
        await logActivity("edit", `Updated log entry: ${data.title}`);
      } else {
        // Create new log
        const { data: newLog, error } = await supabase
          .from("participation_logs")
          .insert({
            organization_standard_id: orgStandardId,
            title: data.title,
            event_type: data.event_type,
            event_date: data.event_date,
            end_date: data.end_date || null,
            participant_count: data.participant_count || 0,
            geography: data.geography || null,
            notes: data.notes || null,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Upload files if any
        if (files.length > 0 && newLog) {
          for (const file of files) {
            const storagePath = `${user.id}/${Date.now()}_${file.name}`;
            await supabase.storage.from("standard-documents").upload(storagePath, file);
            await supabase.from("participation_log_evidence").insert({
              participation_log_id: newLog.id,
              file_url: storagePath,
              file_name: file.name,
              file_size: file.size,
              uploaded_by: user.id,
            });
          }
        }

        await logActivity("create", `Added log entry: ${data.title}`);
      }

      toast({ title: editingLog ? "Log updated" : "Log entry added" });
      await loadDocumentLogs();
      await loadActivityLogs();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      // First delete associated evidence
      const { data: evidence } = await supabase
        .from("participation_log_evidence")
        .select("file_url")
        .eq("participation_log_id", logId);

      if (evidence) {
        const fileUrls = evidence.map((e) => e.file_url);
        if (fileUrls.length > 0) {
          await supabase.storage.from("standard-documents").remove(fileUrls);
        }
        await supabase.from("participation_log_evidence").delete().eq("participation_log_id", logId);
      }

      // Delete the log
      const { error } = await supabase.from("participation_logs").delete().eq("id", logId);
      if (error) throw error;

      await logActivity("delete", "Deleted log entry");
      toast({ title: "Log deleted" });
      await loadDocumentLogs();
      await loadActivityLogs();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  const generateEvidencePacket = async () => {
    try {
      toast({ title: "Generating PDF...", description: "Please wait while we generate your evidence packet." });
      
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      
      let yPos = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      
      const checkNewPage = (height: number = 20) => {
        if (yPos + height > 270) {
          doc.addPage();
          yPos = 20;
        }
      };
      
      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(`Standard ${config.id} - Evidence Packet`, margin, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(config.title, margin, yPos, { maxWidth: contentWidth });
      yPos += 15;
      
      // Status
      doc.setFontSize(10);
      doc.text(`Status: ${detail?.status?.toUpperCase()}`, margin, yPos);
      yPos += 6;
      doc.text(`Generated: ${format(new Date(), "MM/dd/yyyy 'at' h:mm a")}`, margin, yPos);
      yPos += 15;
      
      // Due Date & Frequency
      checkNewPage();
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Due Date & Frequency", margin, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Due Date: ${dueDate ? format(dueDate, "MM/dd/yyyy") : "Not set"}`, margin, yPos);
      yPos += 6;
      doc.text(`Frequency: ${frequency}`, margin, yPos);
      yPos += 12;
      
      // Methods
      checkNewPage();
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Methods Used", margin, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      if (selectedMethods.length > 0) {
        selectedMethods.forEach((methodKey) => {
          const method = config.methods.find((m) => m.key === methodKey);
          if (method) {
            checkNewPage();
            doc.text(`• ${method.label}`, margin + 4, yPos);
            yPos += 6;
          }
        });
      } else {
        doc.text("No methods selected", margin, yPos);
        yPos += 6;
      }
      yPos += 8;
      
      // Evidence
      checkNewPage(30);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Evidence Files", margin, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      if (methodEvidence.length > 0) {
        const evidenceByMethod = methodEvidence.reduce((acc, ev) => {
          if (!acc[ev.method_key]) acc[ev.method_key] = [];
          acc[ev.method_key].push(ev);
          return acc;
        }, {} as Record<string, MethodEvidence[]>);
        
        Object.entries(evidenceByMethod).forEach(([methodKey, evidence]) => {
          const tab = config.evidenceTabs.find((t) => t.key === methodKey);
          checkNewPage(20);
          doc.setFont("helvetica", "bold");
          doc.text(`${tab?.label || methodKey}:`, margin, yPos);
          yPos += 6;
          doc.setFont("helvetica", "normal");
          evidence.forEach((ev) => {
            checkNewPage();
            doc.text(`   • ${ev.file_name}`, margin, yPos);
            yPos += 5;
          });
          yPos += 4;
        });
      } else {
        doc.text("No evidence files uploaded", margin, yPos);
        yPos += 6;
      }
      yPos += 8;
      
      // Compliance Notes
      if (complianceNotes) {
        checkNewPage(30);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Compliance Notes", margin, yPos);
        yPos += 8;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const noteLines = doc.splitTextToSize(complianceNotes, contentWidth);
        noteLines.forEach((line: string) => {
          checkNewPage();
          doc.text(line, margin, yPos);
          yPos += 5;
        });
      }
      
      doc.save(`Standard_${config.id}_Evidence_Packet.pdf`);
      toast({ title: "PDF Generated", description: "Your evidence packet has been downloaded." });
    } catch (e: any) {
      toast({ title: "Failed to generate PDF", description: e.message, variant: "destructive" });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getAuditFlagStatus = (flagKey: string): boolean => {
    // Check evidence uploads
    if (flagKey.includes("uploaded") || flagKey.includes("documented") || flagKey.includes("exists")) {
      return methodEvidence.length > 0;
    }
    // Check board-related
    if (flagKey.includes("board")) {
      const boardEvidence = methodEvidence.filter(e => 
        e.method_key.includes("board") || e.method_key.includes("minutes")
      );
      return boardEvidence.length > 0;
    }
    // Check time-based
    if (flagKey.includes("within") || flagKey.includes("annual") || flagKey.includes("year")) {
      return dueDate ? new Date() <= dueDate : false;
    }
    // Default check based on any evidence
    return methodEvidence.length > 0 || selectedMethods.length > 0;
  };

  if (loading) return <div className="container mx-auto p-8">Loading...</div>;
  if (!detail) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground mb-4">Standard not found</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOverdue = dueDate && new Date() > dueDate;

  return (
    <div className="container mx-auto p-4 md:p-8 pb-32">
      {/* Back Button */}
      <Button variant="outline" className="mb-6" onClick={() => navigate(`/standards?category=${config.category}`)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      {/* PAGE HEADER */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl md:text-3xl font-bold">
            Standard {config.id} – {config.title}
          </h1>
          <Badge className={statusColors[detail.status as keyof typeof statusColors]}>{detail.status}</Badge>
        </div>
        <p className="text-muted-foreground mb-4">{config.description}</p>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => {
              setEditingLog(null);
              setLogModalOpen(true);
            }}>
              <Plus className="mr-1 h-4 w-4" /> Add Log Entry
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEvidenceUploadModalOpen(true)}>
              <Upload className="mr-1 h-4 w-4" /> Upload Evidence
            </Button>
            <Button size="sm" variant="outline" onClick={generateEvidencePacket}>
              <FileText className="mr-1 h-4 w-4" /> Generate Evidence Packet
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {/* SECTION 1 - Due Date */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Due Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="space-y-2">
                <Label>Next Review Due</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!isAdmin}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background border" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="text-sm text-muted-foreground">
                Frequency Default: <span className="font-medium">{config.defaultFrequency} (Recommended)</span>
              </div>
            </div>
            {isOverdue && (
              <div className="mt-4 flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  No required activity has been logged within the required period.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 2 - Information To Collect */}
        <Card>
          <CardHeader>
            <CardTitle>Information To Collect</CardTitle>
            <CardDescription>Required Documentation</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {config.informationToCollect.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* SECTION 3 - Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Methods Used</CardTitle>
            <CardDescription>
              Select all applicable methods for demonstrating compliance with this standard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {config.methods.map((method) => (
                <div key={method.key} className="flex items-start space-x-3">
                  <Checkbox
                    id={method.key}
                    checked={selectedMethods.includes(method.key)}
                    onCheckedChange={(checked) => handleMethodToggle(method.key, !!checked)}
                    disabled={!canEdit}
                  />
                  <Label htmlFor={method.key} className="text-sm font-normal cursor-pointer">
                    {method.label}
                  </Label>
                </div>
              ))}
            </div>
            {selectedMethods.includes("other") && (
              <div className="mt-4">
                <Label>Describe other method</Label>
                <Input
                  value={otherMethodDescription}
                  onChange={(e) => setOtherMethodDescription(e.target.value)}
                  placeholder="Enter description"
                  disabled={!canEdit}
                  className="mt-1"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 4 - Responsibility */}
        <Card>
          <CardHeader>
            <CardTitle>Responsibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Primary Responsible Person</Label>
                <Select
                  value={responsiblePersonId}
                  onValueChange={setResponsiblePersonId}
                  disabled={!isAdmin}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Staff Member" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    {organizationMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name || "Unnamed"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Compliance Owner (Department)</Label>
                <Select
                  value={complianceOwnerDepartment}
                  onValueChange={setComplianceOwnerDepartment}
                  disabled={!isAdmin}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 5 - Frequency & Verification */}
        <Card>
          <CardHeader>
            <CardTitle>Frequency & Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency} disabled={!isAdmin}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    {FREQUENCY_OPTIONS.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Default: {config.defaultFrequency} (Recommended)</p>
              </div>
              <div className="space-y-2">
                <Label>Verification Method</Label>
                <Textarea
                  value={verificationMethodNotes}
                  onChange={(e) => setVerificationMethodNotes(e.target.value)}
                  placeholder="Describe how staff verify compliance (review logs, minutes, policies, reports)."
                  rows={3}
                  disabled={!isAdmin}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 6 - Activity / Evidence Log */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Activity / Evidence Log</CardTitle>
              <CardDescription>
                Record each required instance. Logs may be added individually or via bulk upload.
              </CardDescription>
            </div>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => {
                setEditingLog(null);
                setLogModalOpen(true);
              }}>
                <Plus className="mr-1 h-4 w-4" /> Add Log Entry
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <LogEntryTable
              logs={documentLogs}
              onView={(log) => {
                setViewingLog(log);
                setViewLogModalOpen(true);
              }}
              onEdit={(log) => {
                setEditingLog(log);
                setLogModalOpen(true);
              }}
              onDelete={handleDeleteLog}
              canEdit={canEdit}
              logConfig={logConfig}
            />
          </CardContent>
        </Card>

        {/* SECTION 7 - Evidence Upload (Tabbed) */}
        <Card>
          <CardHeader>
            <CardTitle>Evidence Upload</CardTitle>
            <CardDescription>Upload evidence organized by category.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={config.evidenceTabs[0]?.key} className="w-full">
              <ScrollArea className="w-full pb-2">
                <TabsList className="inline-flex h-auto flex-wrap gap-1 justify-start mb-4 w-auto min-w-full">
                  {config.evidenceTabs.map((tab) => (
                    <TabsTrigger key={tab.key} value={tab.key} className="text-xs md:text-sm whitespace-nowrap">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>

              {config.evidenceTabs.map((tab) => {
                const tabEvidence = methodEvidence.filter((e) => e.method_key === tab.key);
                return (
                  <TabsContent key={tab.key} value={tab.key}>
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                        "hover:border-primary/50"
                      )}
                    >
                      <input
                        type="file"
                        id={`upload-${tab.key}`}
                        className="hidden"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            handleUploadMethodEvidence(tab.key, e.target.files);
                          }
                        }}
                        disabled={!canEdit}
                      />
                      <label
                        htmlFor={`upload-${tab.key}`}
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Drag & Drop or Click to Upload
                        </span>
                      </label>
                    </div>

                    {tabEvidence.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {tabEvidence.map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-center justify-between p-2 bg-muted rounded"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">{ev.file_name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({formatFileSize(ev.file_size)})
                              </span>
                            </div>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMethodEvidence(ev.id, ev.file_url)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
            <input type="file" id={`evidence-upload-${config.id}`} className="hidden" multiple />
          </CardContent>
        </Card>

        {/* SECTION 9 - Compliance Notes & Audit Flags */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Notes & Audit Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={complianceNotes}
                  onChange={(e) => setComplianceNotes(e.target.value)}
                  placeholder="Add compliance notes..."
                  rows={4}
                  disabled={!canEditComplianceNotes}
                />
              </div>
              <div className="space-y-2">
                <Label>Automated Audit Flags</Label>
                <div className="space-y-2 mt-2">
                  {config.auditFlags.map((flag) => {
                    const passed = getAuditFlagStatus(flag.key);
                    return (
                      <div key={flag.key} className="flex items-center gap-2">
                        {passed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={cn("text-sm", !passed && "text-red-500")}>
                          {flag.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 10 - Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>Chronological log of all actions for this standard.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {activityLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No activity recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 text-sm border-b pb-2">
                      <span className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.performed_at), "MM/dd/yy HH:mm")}
                      </span>
                      <span className="font-medium">{log.performer?.full_name || "Unknown"}</span>
                      <span>{log.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 11 - Footer Actions */}
      <StandardFooterActions
        saving={saving}
        onSave={handleSaveChanges}
        onAddActivity={() => {
          setEditingLog(null);
          setLogModalOpen(true);
        }}
        onUploadEvidence={() => setEvidenceUploadModalOpen(true)}
        showSubmitButton={canEdit && detail.status === "pending"}
        onSubmit={() => handleStatusChange("submitted")}
        showCompliantButton={(userRole === "compliance_manager" || isAdmin) && detail.status === "submitted"}
        onMarkCompliant={() => handleStatusChange("compliant")}
        onGeneratePDF={generateEvidencePacket}
        addActivityLabel="Add Log Entry"
      />

      {/* Log Entry Modal */}
      <LogEntryModal
        open={logModalOpen}
        onOpenChange={setLogModalOpen}
        onSave={handleSaveLog}
        editingLog={editingLog}
        logConfig={logConfig}
        eventTypes={eventTypes}
      />

      {/* Log View Modal */}
      <LogViewModal
        open={viewLogModalOpen}
        onOpenChange={setViewLogModalOpen}
        log={viewingLog}
        logConfig={logConfig}
      />

      {/* Evidence Upload Modal */}
      <EvidenceUploadModal
        open={evidenceUploadModalOpen}
        onOpenChange={setEvidenceUploadModalOpen}
        evidenceTabs={config.evidenceTabs}
        onUpload={handleUploadMethodEvidence}
      />
    </div>
  );
}
