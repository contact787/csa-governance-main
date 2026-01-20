import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  TrendingUp,
  Upload,
  Download,
  AlertTriangle,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Calendar,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateDaysUntilDue } from "@/lib/dateUtils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import MasterAdminDashboard from "@/components/dashboard/MasterAdminDashboard";

interface OrganizationStandard {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  due_date: string | null;
  frequency: string | null;
  standard: {
    id: string;
    standard_id: string;
    title: string;
    category: string;
    responsible_role: string;
    frequency: string;
  };
}

interface Evidence {
  id: string;
  file_name: string;
  uploaded_at: string;
  uploaded_by: string;
  organization_standard_id: string;
  standard_title?: string;
  submitter_name?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [standards, setStandards] = useState<OrganizationStandard[]>([]);
  const [recentEvidences, setRecentEvidences] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [complianceTrend, setComplianceTrend] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    checkUserRole();
  }, []);

  useEffect(() => {
    // Only load operational data if not master_admin
    if (userRole !== null && userRole !== "master_admin") {
      loadData();
    } else if (userRole !== null) {
      setLoading(false);
    }
  }, [userRole]);

  const checkUserRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setUserRole(roleData?.role || null);
    } else {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const { data: standardsData, error: standardsError } = await supabase
        .from("organization_standards")
        .select(
          `
          id,
          status,
          created_at,
          updated_at,
          submitted_at,
          due_date,
          frequency,
          standard:standards (
            id,
            standard_id,
            title,
            category,
            responsible_role,
            frequency
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (standardsError) throw standardsError;

      const { data: evidencesData, error: evidencesError } = await supabase
        .from("standard_documents")
        .select(
          `
          id, 
          file_name, 
          uploaded_at, 
          uploaded_by, 
          organization_standard_id,
          organization_standards!inner(
            standard:standards(title)
          )
        `,
        )
        .order("uploaded_at", { ascending: false })
        .limit(10);

      if (evidencesError) throw evidencesError;

      // Get submitter names
      const enrichedEvidences = await Promise.all(
        (evidencesData || []).map(async (evidence: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("user_id", evidence.uploaded_by)
            .single();

          return {
            ...evidence,
            submitter_name: profile?.full_name || profile?.email || "Unknown",
            standard_title: evidence.organization_standards?.standard?.title || "Unknown Standard",
          };
        }),
      );

      setStandards(standardsData as OrganizationStandard[]);
      setRecentEvidences(enrichedEvidences as Evidence[]);

      // Calculate status data
      calculateStatusData(standardsData as OrganizationStandard[]);

      // Generate compliance trend data (mock for now - últimos 12 meses)
      generateComplianceTrend(standardsData as OrganizationStandard[]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStatusData = (stds: OrganizationStandard[]) => {
    const compliant = stds.filter((s) => s.status === "compliant").length;
    const submitted = stds.filter((s) => s.status === "submitted").length;
    const pending = stds.filter((s) => s.status === "pending").length;

    const data = [
      { name: "Compliant", value: compliant, color: "hsl(142, 76%, 36%)" },
      { name: "Submitted", value: submitted, color: "hsl(221, 83%, 53%)" },
      { name: "Pending", value: pending, color: "hsl(25, 95%, 53%)" },
    ].filter((item) => item.value > 0);

    setStatusData(data);
  };

  const generateComplianceTrend = (standards: OrganizationStandard[]) => {
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });

      // Calculate compliance rate for this month (simulated based on submission dates)
      const standardsUpToDate = standards.filter((s) => {
        const createdDate = new Date(s.created_at);
        return createdDate <= date;
      });

      const compliantCount = standardsUpToDate.filter((s) => s.status === "compliant").length;
      const rate = standardsUpToDate.length > 0 ? Math.round((compliantCount / standardsUpToDate.length) * 100) : 0;

      months.push({
        month: monthName,
        compliance: rate,
        submissions: Math.floor(Math.random() * 15) + 5, // Mock data
      });
    }

    setComplianceTrend(months);
  };

  const filteredStandards = standards;

  const totalStandards = filteredStandards.length;
  const compliantCount = filteredStandards.filter((s) => s.status === "compliant").length;
  const compliancePercentage = totalStandards > 0 ? Math.round((compliantCount / totalStandards) * 100) : 0;

  // Calculate overdue items (past due date)
  const overdueCount = filteredStandards.filter((s) => {
    const daysUntilDue = calculateDaysUntilDue(s);
    return daysUntilDue !== null && daysUntilDue < 0;
  }).length;

  // Calculate items due soon (less than 30 days)
  const dueSoonCount = filteredStandards.filter((s) => {
    const daysUntilDue = calculateDaysUntilDue(s);
    return daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 30;
  }).length;

  // Get alerts for items needing attention (filtered by status and user role)
  const getAlerts = () => {
    return filteredStandards
      .map((std) => {
        const daysUntilDue = calculateDaysUntilDue(std);

        if (daysUntilDue === null) return null;

        // Filter based on status and user role (admins and board_members see everything)
        if (userRole !== "admin" && userRole !== "board_member") {
          if (std.status === "pending" && userRole !== "staff") return null;
          if (std.status === "submitted" && userRole !== "compliance_manager") return null;
        }

        if (daysUntilDue < 0) {
          // Overdue
          return { ...std, alertType: "overdue", daysOverdue: Math.abs(daysUntilDue) };
        } else if (daysUntilDue <= 1) {
          // Due in 1 day or less
          return { ...std, alertType: "1-day", daysLeft: daysUntilDue };
        } else if (daysUntilDue <= 7) {
          // Due in next 7 days
          return { ...std, alertType: "7-days", daysLeft: daysUntilDue };
        } else if (daysUntilDue <= 30) {
          // Due in next 30 days
          return { ...std, alertType: "30-days", daysLeft: daysUntilDue };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 10);
  };

  const alerts = getAlerts();

  // Generate insights
  const generateInsights = () => {
    const insights = [];

    // Critical deadlines
    const criticalCount = filteredStandards.filter((s) => {
      const days = calculateDaysUntilDue(s);
      return days !== null && days >= 0 && days <= 7;
    }).length;

    if (criticalCount > 0) {
      insights.push({
        type: "warning",
        message: `Your organization has ${criticalCount} standard${criticalCount > 1 ? "s" : ""} approaching critical deadlines this week.`,
        icon: AlertTriangle,
      });
    }

    // Pending vs submitted
    const pendingCount = filteredStandards.filter((s) => s.status === "pending").length;
    const submittedCount = filteredStandards.filter((s) => s.status === "submitted").length;
    if (pendingCount > submittedCount * 2) {
      insights.push({
        type: "warning",
        message: `${pendingCount} standards are pending submission. Consider taking action.`,
        icon: ArrowDownRight,
      });
    }

    // Recent activity
    const recentSubmissions = recentEvidences.length;
    if (recentSubmissions > 20) {
      insights.push({
        type: "positive",
        message: `High activity detected: ${recentSubmissions} evidence submissions in the last 30 days.`,
        icon: ArrowUpRight,
      });
    } else if (recentSubmissions < 5) {
      insights.push({
        type: "warning",
        message: `Low activity: Only ${recentSubmissions} evidence submissions in the last 30 days.`,
        icon: Clock,
      });
    }

    // Overdue standards
    if (overdueCount > 5) {
      insights.push({
        type: "negative",
        message: `${overdueCount} standards are currently overdue. Immediate action required.`,
        icon: AlertCircle,
      });
    }

    return insights.slice(0, 4);
  };

  const insights = generateInsights();

  const handleExportReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Render Master Admin consolidated view
  if (userRole === "master_admin") {
    return <MasterAdminDashboard />;
  }

  return (
    <div id="dashboard-content" className="container mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Compliance OS Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Overview of current status, upcoming deadlines, and evidence activity
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{compliancePercentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {compliantCount} of {totalStandards} standards compliant
            </p>
            <Progress value={compliancePercentage} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Overdue</CardTitle>
            <AlertCircle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{overdueCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Standards past due date</p>
            <Button
              variant="link"
              className="px-0 mt-2 text-destructive"
              onClick={() => navigate("/standards?status=overdue")}
            >
              View overdue items →
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Clock className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${dueSoonCount > 0 ? "text-orange-500" : "text-muted-foreground"}`}>
              {dueSoonCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Within next 30 days</p>
            {dueSoonCount > 0 && (
              <Badge variant="outline" className="mt-2 border-orange-500 text-orange-500">
                Attention needed
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evidence Submitted</CardTitle>
            <FileText className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{recentEvidences.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>Active submissions</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Panel */}
      {insights.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {insights.map((insight, idx) => (
            <Card
              key={idx}
              className={`${
                insight.type === "positive"
                  ? "border-l-4 border-l-green-500"
                  : insight.type === "negative"
                    ? "border-l-4 border-l-red-500"
                    : "border-l-4 border-l-yellow-500"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      insight.type === "positive"
                        ? "bg-green-500/10"
                        : insight.type === "negative"
                          ? "bg-red-500/10"
                          : "bg-yellow-500/10"
                    }`}
                  >
                    <insight.icon
                      className={`h-4 w-4 ${
                        insight.type === "positive"
                          ? "text-green-500"
                          : insight.type === "negative"
                            ? "text-red-500"
                            : "text-yellow-500"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{insight.message}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Standards by Status
            </CardTitle>
            <CardDescription>Distribution of standards by compliance status</CardDescription>
          </CardHeader>
          <CardContent>
            {totalStandards === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No standards data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.value} standards ({((data.value / totalStandards) * 100).toFixed(1)}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Compliance Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Compliance Trends
            </CardTitle>
            <CardDescription>Last 12 months performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={complianceTrend}>
                <defs>
                  <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="compliance"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorCompliance)"
                  name="Compliance %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Deadlines
          </CardTitle>
          <CardDescription>Standards due within 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No upcoming deadlines. Everything is on track!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 8).map((alert: any) => {
                const isOverdue = alert.alertType === "overdue";
                const is1Day = alert.alertType === "1-day";

                return (
                  <div
                    key={alert.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/standard-detail?id=${alert.id}`)}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        isOverdue ? "bg-destructive/10" : is1Day ? "bg-orange-500/10" : "bg-yellow-500/10"
                      }`}
                    >
                      <Clock
                        className={`h-4 w-4 ${
                          isOverdue ? "text-destructive" : is1Day ? "text-orange-500" : "text-yellow-500"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {alert.standard.standard_id} - {alert.standard.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {alert.standard.category} • {alert.frequency || alert.standard.frequency}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={alert.status === "compliant" ? "default" : "secondary"}>{alert.status}</Badge>
                      <Badge variant={isOverdue ? "destructive" : "outline"}>
                        {isOverdue ? `${alert.daysOverdue}d overdue` : `${alert.daysLeft}d left`}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Evidence Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Evidence Submissions
          </CardTitle>
          <CardDescription>Latest uploaded documents and their review status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Standard</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvidences.slice(0, 8).map((evidence) => (
                <TableRow key={evidence.id} className="hover:bg-accent/50">
                  <TableCell className="font-medium">{evidence.standard_title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {evidence.submitter_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(evidence.uploaded_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">{evidence.file_name}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/standard-detail?id=${evidence.organization_standard_id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {userRole !== "compliance_manager" && (
            <Button
              variant="outline"
              onClick={() => navigate("/standards")}
              className="flex items-center gap-2 h-auto py-4"
            >
              <Upload className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Submit Evidence</div>
                <div className="text-xs text-muted-foreground">Upload documents</div>
              </div>
            </Button>
          )}
          {userRole === "compliance_manager" && (
            <Button
              variant="outline"
              onClick={() => navigate("/compliance-review")}
              className="flex items-center gap-2 h-auto py-4"
            >
              <CheckCircle2 className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Review Pending</div>
                <div className="text-xs text-muted-foreground">Approve submissions</div>
              </div>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate("/roma-reports")}
            className="flex items-center gap-2 h-auto py-4"
          >
            <BarChart3 className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">ROMA Report</div>
              <div className="text-xs text-muted-foreground">Create new report</div>
            </div>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/standards?status=overdue")}
            className="flex items-center gap-2 h-auto py-4"
          >
            <AlertCircle className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">View Overdue</div>
              <div className="text-xs text-muted-foreground">Check overdue items</div>
            </div>
          </Button>
          <Button variant="outline" onClick={handleExportReport} className="flex items-center gap-2 h-auto py-4">
            <Download className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Export Report</div>
              <div className="text-xs text-muted-foreground">Download data</div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
