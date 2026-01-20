import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { calculateDaysUntilDue } from "@/lib/dateUtils";
import {
  CheckSquare,
  User,
  Settings,
  FileText,
  LayoutDashboard,
  Users,
  BarChart3,
  Megaphone,
  FolderOpen,
  Link as LinkIcon,
  ExternalLink,
  Download,
  Mail,
  Building2,
  Activity,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { Badge } from "@/components/ui/badge";

interface Resource {
  id: string;
  name: string;
  type: "link" | "document";
  url: string;
}

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [isComplianceManager, setIsComplianceManager] = useState(false);
  const [isBoardMember, setIsBoardMember] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [organizationName, setOrganizationName] = useState<string>("");
  const [alertCount, setAlertCount] = useState(0);
  const [resources, setResources] = useState<Resource[]>([]);

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  useEffect(() => {
    loadUserInfo();
    loadResources();
  }, []);

  useEffect(() => {
    if (userRole) {
      loadAlertCount();
    }
  }, [userRole]);

  const loadResources = async () => {
    try {
      const { data, error } = await supabase
        .from("resources")
        .select("id, name, type, url")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources((data || []).map(r => ({
        ...r,
        type: r.type as "link" | "document"
      })));
    } catch (error) {
      console.error("Error loading resources:", error);
    }
  };

  const loadUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user roles (may have multiple)
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (roleData && roleData.length > 0) {
        // Check all roles for permissions
        const roles = roleData.map(r => r.role);
        const primaryRole = roles[0];
        setUserRole(primaryRole);
        setIsAdmin(roles.includes("admin") || roles.includes("master_admin"));
        setIsMasterAdmin(roles.includes("master_admin"));
        setIsComplianceManager(roles.includes("compliance_manager"));
        setIsBoardMember(roles.includes("board_member"));
      }

      // Get user name and organization
      const { data: profileData } = await supabase
        .from("profiles")
        .select(`
          full_name,
          organization:organizations(name)
        `)
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setUserName(profileData.full_name || "");
        setOrganizationName(profileData.organization?.name || "");
      }
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  const loadAlertCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: standards } = await supabase
        .from("organization_standards")
        .select(`
          *,
          standard:standards(*)
        `);

      if (!standards) return;

      const alerts = standards.filter((std) => {
        const daysUntilDue = calculateDaysUntilDue(std);
        if (daysUntilDue === null) return false;

        // Filter based on status and user role (admins, master_admins and board_members see everything)
        if (userRole !== "admin" && userRole !== "master_admin" && userRole !== "board_member") {
          if (std.status === "pending" && userRole !== "staff") return false;
          if (std.status === "submitted" && userRole !== "compliance_manager") return false;
        }

        return daysUntilDue < 0 || (daysUntilDue <= 30 && std.status !== "compliant");
      });

      setAlertCount(alerts.length);
    } catch (error) {
      console.error("Error loading alert count:", error);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {!collapsed && userName && (
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-sm font-semibold truncate">{userName}</span>
              {organizationName && (
                <span className="text-xs text-muted-foreground truncate">
                  {organizationName}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {!collapsed && <UserMenu />}
          <SidebarTrigger />
        </div>
      </div>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {!isBoardMember && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/standards"
                      onClick={handleLinkClick}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-accent text-accent-foreground font-bold"
                          : "hover:bg-muted font-normal"
                      }
                    >
                      <FileText className="h-4 w-4" />
                      {!collapsed && <span>Standards</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/"
                    end
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                      isActive
                        ? "bg-accent text-accent-foreground font-bold"
                        : "hover:bg-muted font-normal"
                    }
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {!collapsed && (
                      <div className="flex items-center gap-2 flex-1">
                        <span>Dashboard</span>
                        {alertCount > 0 && (
                          <Badge variant="destructive" className="ml-auto">
                            {alertCount}
                          </Badge>
                        )}
                      </div>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {isComplianceManager && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/compliance-review"
                      onClick={handleLinkClick}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-accent text-accent-foreground font-bold"
                          : "hover:bg-muted font-normal"
                      }
                    >
                      <CheckSquare className="h-4 w-4" />
                      {!collapsed && <span>Compliance Review</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/roma-reports"
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                      isActive
                        ? "bg-accent text-accent-foreground font-bold"
                        : "hover:bg-muted font-normal"
                    }
                  >
                    <BarChart3 className="h-4 w-4" />
                    {!collapsed && <span>ROMA Reports</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/inbox"
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                      isActive
                        ? "bg-accent text-accent-foreground font-bold"
                        : "hover:bg-muted font-normal"
                    }
                  >
                    <Mail className="h-4 w-4" />
                    {!collapsed && <span>Inbox</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/profile"
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                      isActive
                        ? "bg-accent text-accent-foreground font-bold"
                        : "hover:bg-muted font-normal"
                    }
                  >
                    <User className="h-4 w-4" />
                    {!collapsed && <span>Profile</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/management"
                      onClick={handleLinkClick}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-accent text-accent-foreground font-bold"
                          : "hover:bg-muted font-normal"
                      }
                    >
                      <Users className="h-4 w-4" />
                      {!collapsed && <span>Management</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/announcements"
                      onClick={handleLinkClick}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-accent text-accent-foreground font-bold"
                          : "hover:bg-muted font-normal"
                      }
                    >
                      <Megaphone className="h-4 w-4" />
                      {!collapsed && <span>Announcements</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/resources"
                      onClick={handleLinkClick}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-accent text-accent-foreground font-bold"
                          : "hover:bg-muted font-normal"
                      }
                    >
                      <FolderOpen className="h-4 w-4" />
                      {!collapsed && <span>Resource Tab</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isMasterAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/organizations"
                        onClick={handleLinkClick}
                        className={({ isActive }) =>
                          isActive
                            ? "bg-accent text-accent-foreground font-bold"
                            : "hover:bg-muted font-normal"
                        }
                      >
                        <Building2 className="h-4 w-4" />
                        {!collapsed && <span>Organizations</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/usage-panel"
                      onClick={handleLinkClick}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-accent text-accent-foreground font-bold"
                          : "hover:bg-muted font-normal"
                      }
                    >
                      <Activity className="h-4 w-4" />
                      {!collapsed && <span>Usage Panel</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Resources section for non-admin users */}
        {!isAdmin && resources.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Resources</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {resources.map((resource) => (
                  <SidebarMenuItem key={resource.id}>
                    <SidebarMenuButton asChild>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleLinkClick}
                        className="hover:bg-muted font-normal"
                      >
                        {resource.type === "link" ? (
                          <LinkIcon className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        {!collapsed && <span className="truncate">{resource.name}</span>}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
