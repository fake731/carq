import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Send, Image as ImageIcon, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Conversation {
  id: string;
  full_name: string;
  role: string;
  lastMessage?: string;
  lastTime?: string;
  unread: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string | null;
  receiver_id: string | null;
  created_at: string;
  read: boolean | null;
  images: string[] | null;
}

const ChatPage = () => {
  const { user, isAuthenticated, loading, hasPermission } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadConversations();

    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === user.id || msg.receiver_id === user.id) {
          if (selectedChat && (msg.sender_id === selectedChat || msg.receiver_id === selectedChat)) {
            setMessages(prev => [...prev, msg]);
          }
          loadConversations();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;
    setLoadingChats(true);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id);

    const { data: allMessages } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const convos: Conversation[] = [];

    (profiles || []).forEach(p => {
      const msgs = (allMessages || []).filter(
        m => (m.sender_id === p.id && m.receiver_id === user.id) || (m.sender_id === user.id && m.receiver_id === p.id)
      );
      const lastMsg = msgs[0];
      const unread = msgs.filter(m => m.sender_id === p.id && !m.read).length;

      if (user.role === "admin" || msgs.length > 0 || p.role === "admin" || (user.role === "customer" && p.role === "garage")) {
        convos.push({
          id: p.id,
          full_name: p.full_name,
          role: p.role,
          lastMessage: lastMsg?.content,
          lastTime: lastMsg?.created_at,
          unread,
        });
      }
    });

    convos.sort((a, b) => {
      if (a.unread && !b.unread) return -1;
      if (!a.unread && b.unread) return 1;
      if (a.lastTime && b.lastTime) return new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime();
      return 0;
    });

    setConversations(convos);
    setLoadingChats(false);
  };

  const loadMessages = async (contactId: string) => {
    if (!user) return;
    setSelectedChat(contactId);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    setMessages(data || []);

    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", contactId)
      .eq("receiver_id", user.id)
      .eq("read", false);

    loadConversations();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;
    if (!hasPermission("send_message")) {
      toast.error("ليس لديك صلاحية إرسال الرسائل");
      return;
    }
    setSending(true);

    await supabase.from("messages").insert({
      content: newMessage.trim(),
      sender_id: user.id,
      receiver_id: selectedChat,
    });

    await supabase.from("notifications").insert({
      recipient_id: selectedChat,
      sender_id: user.id,
      title: `رسالة من ${user.full_name}`,
      message: newMessage.trim().slice(0, 100),
      type: "message",
    });

    setNewMessage("");
    setSending(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat || !user) return;
    if (!hasPermission("upload_photos")) {
      toast.error("ليس لديك صلاحية رفع الصور");
      return;
    }

    const path = `chat/${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("car-images").upload(path, file);
    if (error) { toast.error("فشل رفع الصورة"); return; }

    const { data: { publicUrl } } = supabase.storage.from("car-images").getPublicUrl(path);

    await supabase.from("messages").insert({
      content: "صورة",
      sender_id: user.id,
      receiver_id: selectedChat,
      images: [publicUrl],
    });

    toast.success("تم إرسال الصورة");
  };

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/تسجيل-الدخول" replace />;

  const selectedContact = conversations.find(c => c.id === selectedChat);

  return (
    <DashboardLayout title="المحادثات">
      <div className="ios-card overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className={`${selectedChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-l border-border`}>
            <div className="p-4 border-b border-border">
              <h3 className="font-bold text-foreground text-lg">المحادثات</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingChats ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-center text-muted-foreground py-12 text-sm">لا توجد محادثات</p>
              ) : conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => loadMessages(c.id)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-surface-2 transition-colors border-b border-border/30 ${
                    selectedChat === c.id ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">{c.full_name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground font-bold text-sm truncate">{c.full_name}</span>
                      {c.unread > 0 && (
                        <span className="w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMessage || "لا توجد رسائل"}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                      c.role === "admin" ? "bg-destructive/10 text-destructive" :
                      c.role === "garage" ? "bg-neon-orange/10 text-neon-orange" :
                      "bg-primary/10 text-primary"
                    }`}>
                      {c.role === "admin" ? "مطور" : c.role === "garage" ? "كراج" : "عميل"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${selectedChat ? "flex" : "hidden md:flex"} flex-col flex-1`}>
            {selectedChat ? (
              <>
                <div className="p-4 border-b border-border flex items-center gap-3 bg-card/50 backdrop-blur-xl">
                  <button onClick={() => setSelectedChat(null)} className="md:hidden text-muted-foreground">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">{selectedContact?.full_name[0]}</span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">{selectedContact?.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedContact?.role === "admin" ? "مطور" : selectedContact?.role === "garage" ? "كراج" : "عميل"}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(msg => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          isMine
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-surface-2 text-foreground rounded-bl-md"
                        }`}>
                          {msg.images && msg.images.length > 0 && (
                            <div className="mb-2">
                              {msg.images.map((img, i) => (
                                <img key={i} src={img} alt="" className="rounded-xl max-w-full max-h-48 object-cover" />
                              ))}
                            </div>
                          )}
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={`text-[9px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                            {new Date(msg.created_at).toLocaleTimeString("ar-OM", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-border bg-card/50 backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <label className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center cursor-pointer hover:bg-surface-3 transition-colors shrink-0">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder="اكتب رسالة..."
                      className="flex-1 bg-surface-2 border border-border rounded-full px-4 py-2.5 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">اختر محادثة للبدء</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
