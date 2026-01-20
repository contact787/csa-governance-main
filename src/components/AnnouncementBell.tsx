import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_global: boolean;
  created_by: string;
  creator_name: string | null;
}

export function AnnouncementBell() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      loadAnnouncements();
    }
  }, [isAdmin]);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (roles) {
      const userRoles = roles.map(r => r.role);
      setIsAdmin(userRoles.includes("admin") || userRoles.includes("master_admin"));
    }
  };

  const loadAnnouncements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all visible announcements (creator_name is stored directly in the table)
      const { data: announcementsData, error: announcementsError } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (announcementsError) throw announcementsError;

      // Load read announcements
      const { data: readsData } = await supabase
        .from("announcement_reads")
        .select("announcement_id")
        .eq("user_id", user.id);

      const readIds = new Set(readsData?.map(r => r.announcement_id) || []);
      const unreadAnnouncements = (announcementsData || []).filter(a => !readIds.has(a.id));

      setAnnouncements(announcementsData || []);
      setUnreadCount(unreadAnnouncements.length);
    } catch (error) {
      console.error("Error loading announcements:", error);
    }
  };

  const markAsRead = async (announcementId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("announcement_reads").insert({
        announcement_id: announcementId,
        user_id: user.id,
      });

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      // Ignore duplicate key errors
      console.error("Error marking as read:", error);
    }
  };

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    
    if (isOpen && unreadCount > 0) {
      // Mark all as read when opening
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: readsData } = await supabase
        .from("announcement_reads")
        .select("announcement_id")
        .eq("user_id", user.id);

      const readIds = new Set(readsData?.map(r => r.announcement_id) || []);
      
      for (const announcement of announcements) {
        if (!readIds.has(announcement.id)) {
          await markAsRead(announcement.id);
        }
      }
      
      setUnreadCount(0);
    }
  };

  // Don't render for admins
  if (isAdmin) return null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-semibold">Announcements</h4>
        </div>
        <ScrollArea className="h-[300px]">
          {announcements.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
              No announcements available.
            </div>
          ) : (
            <div className="divide-y">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="p-3 hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-medium text-sm">{announcement.title}</h5>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(announcement.created_at), "dd/MM")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    By: {announcement.creator_name || "Unknown"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
