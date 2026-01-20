import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Send, ArrowLeft } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { encryptMessage, decryptMessage, decryptMessages } from "@/lib/encryption";
import { cn } from "@/lib/utils";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface ConversationPreview {
  user: UserProfile;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function Inbox() {
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadUsers();
      loadConversations();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (selectedUser && currentUserId) {
      loadMessages(selectedUser.user_id);
      markMessagesAsRead(selectedUser.user_id);

      // Subscribe to realtime messages
      const channel = supabase
        .channel('inbox-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${currentUserId}`,
          },
          async (payload) => {
            if (payload.new.sender_id === selectedUser.user_id) {
              const decryptedContent = await decryptMessage(payload.new.content);
              setMessages(prev => [...prev, { ...payload.new, content: decryptedContent } as Message]);
              markMessagesAsRead(selectedUser.user_id);
            }
            loadConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedUser, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orgId } = await supabase.rpc("get_user_organization_id", { _user_id: user.id });
      
      // Use secure messaging_profiles view (no email exposure)
      const { data, error } = await supabase
        .from("messaging_profiles")
        .select("user_id, full_name, avatar_url")
        .eq("organization_id", orgId)
        .neq("user_id", user.id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({ title: "Error loading users", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    if (!currentUserId) return;

    try {
      // Get organization ID
      const { data: orgId } = await supabase.rpc("get_user_organization_id", { _user_id: currentUserId });

      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique partner IDs
      const partnerIds = new Set<string>();
      for (const msg of messagesData || []) {
        const partnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        partnerIds.add(partnerId);
      }

      // Fetch profiles for all partners
      let partnerProfiles: UserProfile[] = [];
      if (partnerIds.size > 0) {
        // Use secure messaging_profiles view (no email exposure)
        const { data: profilesData } = await supabase
          .from("messaging_profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", Array.from(partnerIds));
        partnerProfiles = profilesData || [];
      }

      // Group messages by conversation partner
      const conversationMap = new Map<string, { messages: Message[], user: UserProfile | null }>();
      
      for (const msg of messagesData || []) {
        const partnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        if (!conversationMap.has(partnerId)) {
          const user = partnerProfiles.find(u => u.user_id === partnerId);
          conversationMap.set(partnerId, { messages: [], user: user || null });
        }
        conversationMap.get(partnerId)!.messages.push(msg);
      }

      // Build conversation previews with batch decryption
      const previews: ConversationPreview[] = [];
      const lastMessages: string[] = [];
      const conversationData: { partnerId: string; data: { messages: Message[], user: UserProfile | null } }[] = [];
      
      for (const [partnerId, data] of conversationMap) {
        if (!data.user) continue;
        conversationData.push({ partnerId, data });
        lastMessages.push(data.messages[0].content);
      }

      // Batch decrypt all last messages at once
      const decryptedLastMessages = await decryptMessages(lastMessages);

      for (let i = 0; i < conversationData.length; i++) {
        const { data } = conversationData[i];
        const unreadCount = data.messages.filter(
          m => m.receiver_id === currentUserId && !m.read_at
        ).length;

        previews.push({
          user: data.user!,
          lastMessage: decryptedLastMessages[i],
          lastMessageTime: data.messages[0].created_at,
          unreadCount,
        });
      }

      // Sort by most recent
      previews.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
      setConversations(previews);
    } catch (error: any) {
      console.error("Error loading conversations:", error);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Batch decrypt all messages
      const encryptedContents = (data || []).map(msg => msg.content);
      const decryptedContents = await decryptMessages(encryptedContents);
      
      const decryptedMessages = (data || []).map((msg, index) => ({
        ...msg,
        content: decryptedContents[index],
      }));

      setMessages(decryptedMessages);
    } catch (error: any) {
      toast({ title: "Error loading messages", description: error.message, variant: "destructive" });
    }
  };

  const markMessagesAsRead = async (senderId: string) => {
    if (!currentUserId) return;

    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("sender_id", senderId)
      .eq("receiver_id", currentUserId)
      .is("read_at", null);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUserId) return;

    setSending(true);
    try {
      const { data: orgId } = await supabase.rpc("get_user_organization_id", { _user_id: currentUserId });
      
      const encryptedContent = await encryptMessage(newMessage.trim());
      
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedUser.user_id,
          organization_id: orgId,
          content: encryptedContent,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state with decrypted content
      setMessages(prev => [...prev, { ...data, content: newMessage.trim() }]);
      setNewMessage("");
      loadConversations();
    } catch (error: any) {
      toast({ title: "Error sending message", description: error.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return "Yesterday";
    }
    return format(date, "dd/MM/yyyy");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Merge conversations with users who have no messages yet
  const allContacts = [...conversations];
  const conversationUserIds = new Set(conversations.map(c => c.user.user_id));
  
  for (const user of filteredUsers) {
    if (!conversationUserIds.has(user.user_id)) {
      allContacts.push({
        user,
        lastMessage: "",
        lastMessageTime: "",
        unreadCount: 0,
      });
    }
  }

  // Filter by search
  const displayContacts = searchQuery
    ? allContacts.filter(c => 
        c.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allContacts;

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Contacts List */}
      <div className={cn(
        "w-full md:w-80 border-r flex flex-col",
        selectedUser && "hidden md:flex"
      )}>
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold mb-4">Inbox</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {displayContacts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No users found
            </div>
          ) : (
            displayContacts.map((contact) => (
              <div
                key={contact.user.user_id}
                onClick={() => setSelectedUser(contact.user)}
                className={cn(
                  "flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b",
                  selectedUser?.user_id === contact.user.user_id && "bg-muted"
                )}
              >
                <Avatar>
                  <AvatarImage src={contact.user.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(contact.user.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">
                      {contact.user.full_name || "Unknown"}
                    </span>
                    {contact.lastMessageTime && (
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(contact.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  {contact.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {contact.lastMessage}
                    </p>
                  )}
                </div>
                {contact.unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {contact.unreadCount}
                  </span>
                )}
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        !selectedUser && "hidden md:flex"
      )}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSelectedUser(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar>
                <AvatarImage src={selectedUser.avatar_url || undefined} />
                <AvatarFallback>{getInitials(selectedUser.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">
                  {selectedUser.full_name || "Unknown"}
                </h2>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender_id === currentUserId ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg px-4 py-2",
                          msg.sender_id === currentUserId
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="break-words">{msg.content}</p>
                        <p className={cn(
                          "text-xs mt-1",
                          msg.sender_id === currentUserId
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}>
                          {format(new Date(msg.created_at), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                  className="flex-1"
                />
                <Button type="submit" disabled={sending || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
