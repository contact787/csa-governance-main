import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OrganizationSummary {
  id: string;
  name: string;
  totalStandards: number;
  compliantCount: number;
  submittedCount: number;
  pendingCount: number;
  overdueCount: number;
  complianceRate: number;
  userCount: number;
  lastActivity: string | null;
}

interface GlobalStats {
  totalOrganizations: number;
  totalUsers: number;
  totalStandards: number;
  overallComplianceRate: number;
  totalOverdue: number;
  totalCompliant: number;
  totalSubmitted: number;
  totalPending: number;
}

export default function MasterAdminDashboard() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [orgComplianceData, setOrgComplianceData] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch all organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from("organizations")
        .select("id, name, created_at")
        .order("name");

      if (orgsError) throw orgsError;

      // Fetch all organization standards with organization info
      const { data: standardsData, error: standardsError } = await supabase
        .from("organization_standards")
        .select(`
          id,
          status,
          organization_id,
          due_date,
          frequency,
          updated_at
        `);

      if (standardsError) throw standardsError;

      // Fetch user counts per organization
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("organization_id");

      if (profilesError) throw profilesError;

      // Calculate per-organization stats
      const orgSummaries: OrganizationSummary[] = (orgsData || []).map((org) => {
        const orgStandards = (standardsData || []).filter((s) => s.organization_id === org.id);
        const userCount = (profilesData || []).filter((p) => p.organization_id === org.id).length;

        const compliantCount = orgStandards.filter((s) => s.status === "compliant").length;
        const submittedCount = orgStandards.filter((s) => s.status === "submitted").length;
        const pendingCount = orgStandards.filter((s) => s.status === "pending").length;

        // Calculate overdue
        const now = new Date();
        const overdueCount = orgStandards.filter((s) => {
          if (!s.due_date || s.status === "compliant") return false;
          return new Date(s.due_date) < now;
        }).length;

        // Last activity
        const lastUpdated = orgStandards
          .map((s) => s.updated_at)
          .filter(Boolean)
          .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

        return {
          id: org.id,
          name: org.name,
          totalStandards: orgStandards.length,
          compliantCount,
          submittedCount,
          pendingCount,
          overdueCount,
          complianceRate: orgStandards.length > 0 ? Math.round((compliantCount / orgStandards.length) * 100) : 0,
          userCount,
          lastActivity: lastUpdated || null,
        };
      });

      setOrganizations(orgSummaries);

      // Calculate global stats
      const totalStandards = standardsData?.length || 0;
      const totalCompliant = standardsData?.filter((s) => s.status === "compliant").length || 0;
      const totalSubmitted = standardsData?.filter((s) => s.status === "submitted").length || 0;
      const totalPending = standardsData?.filter((s) => s.status === "pending").length || 0;
      const now = new Date();
      const totalOverdue =
        standardsData?.filter((s) => {
          if (!s.due_date || s.status === "compliant") return false;
          return new Date(s.due_date) < now;
        }).length || 0;

      setGlobalStats({
        totalOrganizations: orgsData?.length || 0,
        totalUsers: profilesData?.length || 0,
        totalStandards,
        overallComplianceRate: totalStandards > 0 ? Math.round((totalCompliant / totalStandards) * 100) : 0,
        totalOverdue,
        totalCompliant,
        totalSubmitted,
        totalPending,
      });

      // Status distribution for pie chart
      const statusData = [
        { name: "Compliant", value: totalCompliant, color: "hsl(142, 76%, 36%)" },
        { name: "Submitted", value: totalSubmitted, color: "hsl(221, 83%, 53%)" },
        { name: "Pending", value: totalPending, color: "hsl(25, 95%, 53%)" },
      ].filter((item) => item.value > 0);

      setStatusDistribution(statusData);

      // Top organizations by compliance for bar chart
      const topOrgs = [...orgSummaries]
        .filter((o) => o.totalStandards > 0)
        .sort((a, b) => b.complianceRate - a.complianceRate)
        .slice(0, 8)
        .map((org) => ({
          name: org.name.length > 15 ? org.name.substring(0, 15) + "..." : org.name,
          fullName: org.name,
          compliance: org.complianceRate,
          overdue: org.overdueCount,
        }));

      setOrgComplianceData(topOrgs);
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

  return (
    <div className="container mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Master Admin Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Consolidated overview of all organizations and compliance status
        </p>
      </div>

      {/* Global KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{globalStats?.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground mt-1">Active organizations</p>
            <Button
              variant="link"
              className="px-0 mt-2 text-primary"
              onClick={() => navigate("/organizations")}
            >
              Manage organizations →
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{globalStats?.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all organizations</p>
            <Button
              variant="link"
              className="px-0 mt-2 text-blue-500"
              onClick={() => navigate("/management")}
            >
              Manage users →
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{globalStats?.overallComplianceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {globalStats?.totalCompliant} of {globalStats?.totalStandards} standards
            </p>
            <Progress value={globalStats?.overallComplianceRate || 0} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Overdue</CardTitle>
            <AlertCircle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{globalStats?.totalOverdue}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all organizations</p>
            {globalStats?.totalOverdue && globalStats.totalOverdue > 0 ? (
              <Badge variant="destructive" className="mt-2">
                Requires attention
              </Badge>
            ) : (
              <Badge variant="outline" className="mt-2 text-green-500 border-green-500">
                All on track
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Global Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Global Status Distribution
            </CardTitle>
            <CardDescription>All standards across all organizations</CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistribution.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No standards data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Organization Compliance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Compliance by Organization
            </CardTitle>
            <CardDescription>Top organizations by compliance rate</CardDescription>
          </CardHeader>
          <CardContent>
            {orgComplianceData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No organization data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={orgComplianceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              Compliance: {data.compliance}%
                            </p>
                            {data.overdue > 0 && (
                              <p className="text-sm text-destructive">
                                Overdue: {data.overdue}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="compliance" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Organizations Overview
          </CardTitle>
          <CardDescription>Detailed compliance status for each organization</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead className="text-center">Users</TableHead>
                <TableHead className="text-center">Standards</TableHead>
                <TableHead className="text-center">Compliant</TableHead>
                <TableHead className="text-center">Submitted</TableHead>
                <TableHead className="text-center">Pending</TableHead>
                <TableHead className="text-center">Overdue</TableHead>
                <TableHead className="text-center">Compliance</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No organizations found
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => (
                  <TableRow key={org.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {org.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{org.userCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{org.totalStandards}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600 font-medium">{org.compliantCount}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-blue-600 font-medium">{org.submittedCount}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-orange-500 font-medium">{org.pendingCount}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {org.overdueCount > 0 ? (
                        <Badge variant="destructive">{org.overdueCount}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={org.complianceRate} className="w-16 h-2" />
                        <span
                          className={`text-sm font-medium ${
                            org.complianceRate >= 80
                              ? "text-green-600"
                              : org.complianceRate >= 50
                              ? "text-yellow-600"
                              : "text-destructive"
                          }`}
                        >
                          {org.complianceRate}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {org.lastActivity ? (
                        <span className="text-sm text-muted-foreground">
                          {new Date(org.lastActivity).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No activity</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Compliant Standards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{globalStats?.totalCompliant}</div>
            <p className="text-xs text-muted-foreground">
              {globalStats?.totalStandards
                ? ((globalStats.totalCompliant / globalStats.totalStandards) * 100).toFixed(1)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Awaiting Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{globalStats?.totalSubmitted}</div>
            <p className="text-xs text-muted-foreground">Submitted for approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500" />
              Pending Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{globalStats?.totalPending}</div>
            <p className="text-xs text-muted-foreground">Needs submission</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
