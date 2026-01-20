import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const formSchema = z.object({
  name: z.string().min(1, "Report name is required"),
  identifiedProblem: z.string().min(1, "This field is required"),
  serviceActivity: z.string().min(1, "This field is required"),
  outcomeShortTerm: z.string().min(1, "Short Term is required"),
  outcomeIntermediateTerm: z.string().optional(),
  outcomeLongTerm: z.string().optional(),
  outcomeIndicatorShortTerm: z.string().min(1, "Short Term is required"),
  outcomeIndicatorIntermediateTerm: z.string().optional(),
  outcomeIndicatorLongTerm: z.string().optional(),
  actualResultsShortTerm: z.string().min(1, "Short Term is required"),
  actualResultsIntermediateTerm: z.string().optional(),
  actualResultsLongTerm: z.string().optional(),
  measurementTool: z.string().min(1, "This field is required"),
  dataSource: z.string().min(1, "This field is required"),
  frequencyDataCollection: z.string().min(1, "This field is required"),
});

type Report = {
  id: string;
  name: string;
  created_at: string;
  identified_problem: string;
  service_activity: string;
  outcome_short_term: string;
  outcome_intermediate_term: string | null;
  outcome_long_term: string | null;
  outcome_indicator_short_term: string;
  outcome_indicator_intermediate_term: string | null;
  outcome_indicator_long_term: string | null;
  actual_results_short_term: string;
  actual_results_intermediate_term: string | null;
  actual_results_long_term: string | null;
  measurement_tool: string;
  data_source: string;
  frequency_data_collection: string;
};

type FormData = z.infer<typeof formSchema>;

const RomaReports = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      identifiedProblem: "",
      serviceActivity: "",
      outcomeShortTerm: "",
      outcomeIntermediateTerm: "",
      outcomeLongTerm: "",
      outcomeIndicatorShortTerm: "",
      outcomeIndicatorIntermediateTerm: "",
      outcomeIndicatorLongTerm: "",
      actualResultsShortTerm: "",
      actualResultsIntermediateTerm: "",
      actualResultsLongTerm: "",
      measurementTool: "",
      dataSource: "",
      frequencyDataCollection: "",
    },
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const { data, error } = await supabase
      .from("roma_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading reports:", error);
      toast.error("Error loading reports");
    } else {
      setReports(data || []);
    }
  };

  const generatePDF = (reportData: Omit<FormData, "name">) => {
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const contentWidth = pageWidth - 2 * margin;

      // Title
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("ROMA Report - Results-Oriented Management and Accountability", margin, 15);

      // Date
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generated: ${new Date().toLocaleDateString("en-US")}`, margin, 22);

      // Table headers
      const headers = [
        "Identified Problem, Need, Situation",
        "Service or Activity (Output)\nIdentify the timeframe. Identify the # of clients served or the # of units offered",
        "Outcome\n(General statement of results expected)",
        "Outcome Indicator\nProjected # and % of clients who will achieve each outcome",
        "Actual Results\nActual # and % of clients who achieve each outcome",
        "Measurement Tool",
        "Data Source, Collection Procedure, Personnel",
        "Frequency of Data Collection and Reporting",
      ];

      const colWidth = contentWidth / headers.length;
      let yPosition = 30;

      // Draw header row with dynamic height
      const headerHeight = 15;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPosition, contentWidth, headerHeight, "F");
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");

      headers.forEach((header, index) => {
        const xPos = margin + index * colWidth;
        pdf.rect(margin + index * colWidth, yPosition, colWidth, headerHeight, "S");
        const lines = pdf.splitTextToSize(header, colWidth - 2);
        pdf.text(lines, xPos + 1, yPosition + 3);
      });

      yPosition += headerHeight;

      // Draw category row (Planning, Intervention, Benefit, Accountability)
      const categories = [
        "(1) Planning",
        "(2) Intervention",
        "(3) Benefit",
        "(4) Benefit",
        "(5) Benefit",
        "(6) Accountability",
        "(7) Accountability",
        "(8) Accountability",
      ];

      const categoryHeight = 8;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPosition, contentWidth, categoryHeight, "F");
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");

      categories.forEach((category, index) => {
        const xPos = margin + index * colWidth;
        pdf.rect(margin + index * colWidth, yPosition, colWidth, categoryHeight, "S");
        pdf.text(category, xPos + 1, yPosition + 5);
      });

      yPosition += categoryHeight;

      // Determine if we need multiple rows
      const hasIntermediateOrLong =
        reportData.outcomeIntermediateTerm ||
        reportData.outcomeLongTerm ||
        reportData.outcomeIndicatorIntermediateTerm ||
        reportData.outcomeIndicatorLongTerm ||
        reportData.actualResultsIntermediateTerm ||
        reportData.actualResultsLongTerm;

      const rowHeight = 20;
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");

      // Row 1: Short Term (remove prefix if only one row)
      const row1Data = [
        reportData.identifiedProblem,
        reportData.serviceActivity,
        hasIntermediateOrLong ? `Short Term: ${reportData.outcomeShortTerm}` : reportData.outcomeShortTerm,
        hasIntermediateOrLong ? `Short Term: ${reportData.outcomeIndicatorShortTerm}` : reportData.outcomeIndicatorShortTerm,
        hasIntermediateOrLong ? `Short Term: ${reportData.actualResultsShortTerm}` : reportData.actualResultsShortTerm,
        reportData.measurementTool,
        reportData.dataSource,
        reportData.frequencyDataCollection,
      ];

      row1Data.forEach((text, index) => {
        const xPos = margin + index * colWidth;
        pdf.rect(xPos, yPosition, colWidth, rowHeight, "S");
        const lines = pdf.splitTextToSize(text, colWidth - 2);
        pdf.text(lines, xPos + 1, yPosition + 3);
      });

      if (hasIntermediateOrLong) {
        yPosition += rowHeight;

        // Row 2: Intermediate Term
        const row2Data = [
          "",
          "",
          reportData.outcomeIntermediateTerm ? `Intermediate Term: ${reportData.outcomeIntermediateTerm}` : "",
          reportData.outcomeIndicatorIntermediateTerm
            ? `Intermediate Term: ${reportData.outcomeIndicatorIntermediateTerm}`
            : "",
          reportData.actualResultsIntermediateTerm
            ? `Intermediate Term: ${reportData.actualResultsIntermediateTerm}`
            : "",
          "",
          "",
          "",
        ];

        row2Data.forEach((text, index) => {
          const xPos = margin + index * colWidth;
          pdf.rect(xPos, yPosition, colWidth, rowHeight, "S");
          if (text) {
            const lines = pdf.splitTextToSize(text, colWidth - 2);
            pdf.text(lines, xPos + 1, yPosition + 3);
          }
        });

        yPosition += rowHeight;

        // Row 3: Long Term
        const row3Data = [
          "",
          "",
          reportData.outcomeLongTerm ? `Long Term: ${reportData.outcomeLongTerm}` : "",
          reportData.outcomeIndicatorLongTerm ? `Long Term: ${reportData.outcomeIndicatorLongTerm}` : "",
          reportData.actualResultsLongTerm ? `Long Term: ${reportData.actualResultsLongTerm}` : "",
          "",
          "",
          "",
        ];

        row3Data.forEach((text, index) => {
          const xPos = margin + index * colWidth;
          pdf.rect(xPos, yPosition, colWidth, rowHeight, "S");
          if (text) {
            const lines = pdf.splitTextToSize(text, colWidth - 2);
            pdf.text(lines, xPos + 1, yPosition + 3);
          }
        });
      }

      return pdf;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to generate reports");
        return;
      }

      // Get user's organization_id
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile?.organization_id) {
        toast.error("Unable to determine your organization");
        return;
      }

      const { name, ...reportData } = data;

      const { error } = await supabase.from("roma_reports").insert({
        name,
        user_id: user.id,
        organization_id: profile.organization_id,
        identified_problem: reportData.identifiedProblem,
        service_activity: reportData.serviceActivity,
        outcome_short_term: reportData.outcomeShortTerm,
        outcome_intermediate_term: reportData.outcomeIntermediateTerm || null,
        outcome_long_term: reportData.outcomeLongTerm || null,
        outcome_indicator_short_term: reportData.outcomeIndicatorShortTerm,
        outcome_indicator_intermediate_term: reportData.outcomeIndicatorIntermediateTerm || null,
        outcome_indicator_long_term: reportData.outcomeIndicatorLongTerm || null,
        actual_results_short_term: reportData.actualResultsShortTerm,
        actual_results_intermediate_term: reportData.actualResultsIntermediateTerm || null,
        actual_results_long_term: reportData.actualResultsLongTerm || null,
        measurement_tool: reportData.measurementTool,
        data_source: reportData.dataSource,
        frequency_data_collection: reportData.frequencyDataCollection,
      });

      if (error) throw error;

      toast.success("Report generated successfully!");
      form.reset();
      loadReports();
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Error generating report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = (report: Report) => {
    try {
      const pdf = generatePDF({
        identifiedProblem: report.identified_problem,
        serviceActivity: report.service_activity,
        outcomeShortTerm: report.outcome_short_term,
        outcomeIntermediateTerm: report.outcome_intermediate_term || "",
        outcomeLongTerm: report.outcome_long_term || "",
        outcomeIndicatorShortTerm: report.outcome_indicator_short_term,
        outcomeIndicatorIntermediateTerm: report.outcome_indicator_intermediate_term || "",
        outcomeIndicatorLongTerm: report.outcome_indicator_long_term || "",
        actualResultsShortTerm: report.actual_results_short_term,
        actualResultsIntermediateTerm: report.actual_results_intermediate_term || "",
        actualResultsLongTerm: report.actual_results_long_term || "",
        measurementTool: report.measurement_tool,
        dataSource: report.data_source,
        frequencyDataCollection: report.frequency_data_collection,
      });
      pdf.save(`${report.name}-${new Date(report.created_at).toISOString().split("T")[0]}.pdf`);
      toast.success("Report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Error downloading report. Please try again.");
    }
  };

  const handlePreview = (report: Report) => {
    setSelectedReport(report);
    setIsPreviewOpen(true);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            ROMA - Indicators & Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Results-Oriented Management and Accountability
          </p>
        </div>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="create">Create ROMA Report</TabsTrigger>
          <TabsTrigger value="reports">Generated Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Create ROMA Report
              </CardTitle>
              <CardDescription>
                Fill out the form below to generate a ROMA report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter report name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              <FormField
                control={form.control}
                name="identifiedProblem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identified Problem, Need, Situation</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Describe the identified problem, need, or situation" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceActivity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div>Service or Activity (Output)</div>
                      <div className="text-xs font-normal text-muted-foreground mt-1">
                        Identify the timeframe. Identify the # of clients served or the # of units offered
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe the service or activity, timeframe, and number of clients served"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>
                  <div>Outcome</div>
                  <div className="text-xs font-normal text-muted-foreground mt-1">
                    General statement of results expected
                  </div>
                </FormLabel>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="outcomeShortTerm"
                    render={({ field }) => (
                      <FormItem>
                        <div className="text-sm font-normal text-foreground">Short Term *</div>
                        <FormControl>
                          <Input {...field} placeholder="Short term outcome" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="outcomeIntermediateTerm"
                    render={({ field }) => (
                      <FormItem>
                        <div className="text-sm font-normal text-foreground">Intermediate Term</div>
                        <FormControl>
                          <Input {...field} placeholder="Intermediate term outcome (optional)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="outcomeLongTerm"
                    render={({ field }) => (
                      <FormItem>
                        <div className="text-sm font-normal text-foreground">Long Term</div>
                        <FormControl>
                          <Input {...field} placeholder="Long term outcome (optional)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <FormLabel>
                  <div>Outcome Indicator</div>
                  <div className="text-xs font-normal text-muted-foreground mt-1">
                    Projected # and % of clients who will achieve each outcome
                  </div>
                </FormLabel>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="outcomeIndicatorShortTerm"
                    render={({ field }) => (
                      <FormItem>
                        <div className="text-sm font-normal text-foreground">Short Term *</div>
                        <FormControl>
                          <Input {...field} placeholder="Short term indicator" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="outcomeIndicatorIntermediateTerm"
                    render={({ field }) => (
                      <FormItem>
                        <div className="text-sm font-normal text-foreground">Intermediate Term</div>
                        <FormControl>
                          <Input {...field} placeholder="Intermediate term indicator (optional)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="outcomeIndicatorLongTerm"
                    render={({ field }) => (
                      <FormItem>
                        <div className="text-sm font-normal text-foreground">Long Term</div>
                        <FormControl>
                          <Input {...field} placeholder="Long term indicator (optional)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <FormLabel>
                  <div>Actual Results</div>
                  <div className="text-xs font-normal text-muted-foreground mt-1">
                    Actual # and % of clients who achieve each outcome
                  </div>
                </FormLabel>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="actualResultsShortTerm"
                    render={({ field }) => (
                      <FormItem>
                        <div className="text-sm font-normal text-foreground">Short Term *</div>
                        <FormControl>
                          <Input {...field} placeholder="Short term results" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="actualResultsIntermediateTerm"
                    render={({ field }) => (
                      <FormItem>
                        <div className="text-sm font-normal text-foreground">Intermediate Term</div>
                        <FormControl>
                          <Input {...field} placeholder="Intermediate term results (optional)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="actualResultsLongTerm"
                    render={({ field }) => (
                      <FormItem>
                        <div className="text-sm font-normal text-foreground">Long Term</div>
                        <FormControl>
                          <Input {...field} placeholder="Long term results (optional)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="measurementTool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Measurement Tool</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Describe the measurement tool used" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Source, Collection Procedure, Personnel</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe data source, collection procedure, and responsible personnel"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequencyDataCollection"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency of Data Collection and Reporting</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe the frequency of data collection and reporting"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

                  <Button type="submit" disabled={isGenerating} size="lg" className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    {isGenerating ? "Generating..." : "Generate"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated Reports
              </CardTitle>
              <CardDescription>
                View and download your ROMA reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reports.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No reports generated yet
                  </p>
                ) : (
                  reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{report.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(report)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(report)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          {selectedReport && (
            <div className="space-y-4">
              {/* Header exactly like PDF */}
              <div className="space-y-2">
                <h2 className="text-lg font-bold">
                  ROMA Report - Results-Oriented Management and Accountability
                </h2>
                <p className="text-sm">
                  Generated: {new Date(selectedReport.created_at).toLocaleDateString("en-US")}
                </p>
                <p className="text-sm font-semibold">Report: {selectedReport.name}</p>
              </div>

              {/* Table exactly like PDF */}
              <div className="overflow-x-auto border rounded">
                <Table>
                  <TableHeader>
                    {/* Main headers row */}
                    <TableRow className="bg-muted/50">
                      <TableHead className="border text-[10px] font-bold p-2 align-top w-[12.5%]">
                        Identified Problem, Need, Situation
                      </TableHead>
                      <TableHead className="border text-[10px] font-bold p-2 align-top w-[12.5%]">
                        Service or Activity (Output)<br/>
                        <span className="font-normal">Identify the timeframe. Identify the # of clients served or the # of units offered</span>
                      </TableHead>
                      <TableHead className="border text-[10px] font-bold p-2 align-top w-[12.5%]">
                        Outcome<br/>
                        <span className="font-normal">(General statement of results expected)</span>
                      </TableHead>
                      <TableHead className="border text-[10px] font-bold p-2 align-top w-[12.5%]">
                        Outcome Indicator<br/>
                        <span className="font-normal">Projected # and % of clients who will achieve each outcome</span>
                      </TableHead>
                      <TableHead className="border text-[10px] font-bold p-2 align-top w-[12.5%]">
                        Actual Results<br/>
                        <span className="font-normal">Actual # and % of clients who achieve each outcome</span>
                      </TableHead>
                      <TableHead className="border text-[10px] font-bold p-2 align-top w-[12.5%]">
                        Measurement Tool
                      </TableHead>
                      <TableHead className="border text-[10px] font-bold p-2 align-top w-[12.5%]">
                        Data Source, Collection Procedure, Personnel
                      </TableHead>
                      <TableHead className="border text-[10px] font-bold p-2 align-top w-[12.5%]">
                        Frequency of Data Collection and Reporting
                      </TableHead>
                    </TableRow>
                    {/* Categories row */}
                    <TableRow className="bg-muted/50">
                      <TableHead className="border text-[10px] p-2">(1) Planning</TableHead>
                      <TableHead className="border text-[10px] p-2">(2) Intervention</TableHead>
                      <TableHead className="border text-[10px] p-2">(3) Benefit</TableHead>
                      <TableHead className="border text-[10px] p-2">(4) Benefit</TableHead>
                      <TableHead className="border text-[10px] p-2">(5) Benefit</TableHead>
                      <TableHead className="border text-[10px] p-2">(6) Accountability</TableHead>
                      <TableHead className="border text-[10px] p-2">(7) Accountability</TableHead>
                      <TableHead className="border text-[10px] p-2">(8) Accountability</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Row 1: First row with all data or Short Term */}
                    <TableRow>
                      <TableCell className="border text-[10px] p-2 align-top">
                        {selectedReport.identified_problem}
                      </TableCell>
                      <TableCell className="border text-[10px] p-2 align-top">
                        {selectedReport.service_activity}
                      </TableCell>
                      <TableCell className="border text-[10px] p-2 align-top">
                        {(selectedReport.outcome_intermediate_term || selectedReport.outcome_long_term) && (
                          <span className="font-semibold">Short Term: </span>
                        )}
                        {selectedReport.outcome_short_term}
                      </TableCell>
                      <TableCell className="border text-[10px] p-2 align-top">
                        {(selectedReport.outcome_indicator_intermediate_term || selectedReport.outcome_indicator_long_term) && (
                          <span className="font-semibold">Short Term: </span>
                        )}
                        {selectedReport.outcome_indicator_short_term}
                      </TableCell>
                      <TableCell className="border text-[10px] p-2 align-top">
                        {(selectedReport.actual_results_intermediate_term || selectedReport.actual_results_long_term) && (
                          <span className="font-semibold">Short Term: </span>
                        )}
                        {selectedReport.actual_results_short_term}
                      </TableCell>
                      <TableCell className="border text-[10px] p-2 align-top">
                        {selectedReport.measurement_tool}
                      </TableCell>
                      <TableCell className="border text-[10px] p-2 align-top">
                        {selectedReport.data_source}
                      </TableCell>
                      <TableCell className="border text-[10px] p-2 align-top">
                        {selectedReport.frequency_data_collection}
                      </TableCell>
                    </TableRow>
                    
                    {/* Row 2: Intermediate Term (if exists) */}
                    {(selectedReport.outcome_intermediate_term || 
                      selectedReport.outcome_indicator_intermediate_term || 
                      selectedReport.actual_results_intermediate_term) && (
                      <TableRow>
                        <TableCell className="border text-[10px] p-2"></TableCell>
                        <TableCell className="border text-[10px] p-2"></TableCell>
                        <TableCell className="border text-[10px] p-2 align-top">
                          {selectedReport.outcome_intermediate_term && (
                            <>
                              <span className="font-semibold">Intermediate Term: </span>
                              {selectedReport.outcome_intermediate_term}
                            </>
                          )}
                        </TableCell>
                        <TableCell className="border text-[10px] p-2 align-top">
                          {selectedReport.outcome_indicator_intermediate_term && (
                            <>
                              <span className="font-semibold">Intermediate Term: </span>
                              {selectedReport.outcome_indicator_intermediate_term}
                            </>
                          )}
                        </TableCell>
                        <TableCell className="border text-[10px] p-2 align-top">
                          {selectedReport.actual_results_intermediate_term && (
                            <>
                              <span className="font-semibold">Intermediate Term: </span>
                              {selectedReport.actual_results_intermediate_term}
                            </>
                          )}
                        </TableCell>
                        <TableCell className="border text-[10px] p-2"></TableCell>
                        <TableCell className="border text-[10px] p-2"></TableCell>
                        <TableCell className="border text-[10px] p-2"></TableCell>
                      </TableRow>
                    )}
                    
                    {/* Row 3: Long Term (if exists) */}
                    {(selectedReport.outcome_long_term || 
                      selectedReport.outcome_indicator_long_term || 
                      selectedReport.actual_results_long_term) && (
                      <TableRow>
                        <TableCell className="border text-[10px] p-2"></TableCell>
                        <TableCell className="border text-[10px] p-2"></TableCell>
                        <TableCell className="border text-[10px] p-2 align-top">
                          {selectedReport.outcome_long_term && (
                            <>
                              <span className="font-semibold">Long Term: </span>
                              {selectedReport.outcome_long_term}
                            </>
                          )}
                        </TableCell>
                        <TableCell className="border text-[10px] p-2 align-top">
                          {selectedReport.outcome_indicator_long_term && (
                            <>
                              <span className="font-semibold">Long Term: </span>
                              {selectedReport.outcome_indicator_long_term}
                            </>
                          )}
                        </TableCell>
                        <TableCell className="border text-[10px] p-2 align-top">
                          {selectedReport.actual_results_long_term && (
                            <>
                              <span className="font-semibold">Long Term: </span>
                              {selectedReport.actual_results_long_term}
                            </>
                          )}
                        </TableCell>
                        <TableCell className="border text-[10px] p-2"></TableCell>
                        <TableCell className="border text-[10px] p-2"></TableCell>
                        <TableCell className="border text-[10px] p-2"></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RomaReports;
