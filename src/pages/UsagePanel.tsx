import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { History, AlertTriangle, AlertCircle, Info, CheckCircle, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoginHistoryEntry {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  organization_id: string | null;
  organization_name: string | null;
  login_at: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  error_message: string | null;
}

interface SystemAlert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  source: string | null;
  user_id: string | null;
  organization_id: string | null;
  metadata: unknown;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export default function UsagePanel() {
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertFilter, setAlertFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    checkUserRole();
  }, []);

  useEffect(() => {
    if (isMasterAdmin !== undefined) {
      loadData();
    }
  }, [isMasterAdmin]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (roles) {
        const roleList = roles.map(r => r.role);
        setIsMasterAdmin(roleList.includes("master_admin"));
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadLoginHistory(), loadSystemAlerts()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLoginHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("login_history")
        .select("*")
        .order("login_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLoginHistory(data || []);
    } catch (error) {
      console.error("Error loading login history:", error);
    }
  };

  const loadSystemAlerts = async () => {
    if (!isMasterAdmin) return;
    
    try {
      const { data, error } = await supabase
        .from("system_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setSystemAlerts((data || []) as SystemAlert[]);
    } catch (error) {
      console.error("Error loading system alerts:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast({
      title: "Data refreshed",
      description: "The usage data has been updated.",
    });
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("system_alerts")
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        })
        .eq("id", alertId);

      if (error) throw error;

      toast({
        title: "Alert resolved",
        description: "The alert has been marked as resolved.",
      });

      loadSystemAlerts();
    } catch (error) {
      console.error("Error resolving alert:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to resolve the alert.",
      });
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertBadgeVariant = (type: string) => {
    switch (type) {
      case "error":
        return "destructive" as const;
      case "warning":
        return "secondary" as const;
      case "info":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  const filteredAlerts = alertFilter === "all" 
    ? systemAlerts 
    : alertFilter === "unresolved"
      ? systemAlerts.filter(a => !a.resolved_at)
      : systemAlerts.filter(a => a.alert_type === alertFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usage Panel</h1>
          <p className="text-muted-foreground">
            {isMasterAdmin 
              ? "Monitor system usage, alerts, and login history across all organizations."
              : "View login history for your organization."}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="login-history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="login-history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Login History
          </TabsTrigger>
          {isMasterAdmin && (
            <TabsTrigger value="system-alerts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              System Alerts
              {systemAlerts.filter(a => !a.resolved_at).length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {systemAlerts.filter(a => !a.resolved_at).length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="login-history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
              <CardDescription>
                {isMasterAdmin 
                  ? "Recent login attempts across all organizations"
                  : "Recent login attempts from your organization"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loginHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No login history available yet.</p>
                  <p className="text-sm">Login events will appear here as users sign in.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        {isMasterAdmin && <TableHead>Organization</TableHead>}
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loginHistory.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{entry.user_name || "Unknown"}</p>
                              <p className="text-sm text-muted-foreground">{entry.user_email}</p>
                            </div>
                          </TableCell>
                          {isMasterAdmin && (
                            <TableCell>{entry.organization_name || "N/A"}</TableCell>
                          )}
                          <TableCell>
                            {format(new Date(entry.login_at), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            {entry.success ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Success
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {entry.ip_address || "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isMasterAdmin && (
          <TabsContent value="system-alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>System Alerts</CardTitle>
                    <CardDescription>
                      Errors, warnings, and important notifications
                    </CardDescription>
                  </div>
                  <Select value={alertFilter} onValueChange={setAlertFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter alerts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Alerts</SelectItem>
                      <SelectItem value="unresolved">Unresolved</SelectItem>
                      <SelectItem value="error">Errors</SelectItem>
                      <SelectItem value="warning">Warnings</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                    <p>No alerts to display.</p>
                    <p className="text-sm">System alerts will appear here when issues are detected.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border ${
                          alert.resolved_at ? "bg-muted/50" : "bg-background"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            {getAlertIcon(alert.alert_type)}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{alert.title}</h4>
                                <Badge variant={getAlertBadgeVariant(alert.alert_type)}>
                                  {alert.alert_type}
                                </Badge>
                                {alert.source && (
                                  <Badge variant="outline">{alert.source}</Badge>
                                )}
                                {alert.resolved_at && (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    Resolved
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{alert.message}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(alert.created_at), "MMM dd, yyyy HH:mm")}
                              </p>
                            </div>
                          </div>
                          {!alert.resolved_at && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveAlert(alert.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}