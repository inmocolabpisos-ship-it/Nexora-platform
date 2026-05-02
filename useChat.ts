import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_tipo: "huesped" | "anfitrion" | "admin";
  sender_nombre: string | null;
  contenido: string;
  leido_huesped: boolean;
  leido_anfitrion: boolean;
  leido_admin: boolean;
  bloqueado: boolean;
  razon_bloqueo: string | null;
  created_at: string;
};

export type ChatConversation = {
  id: string;
  huesped_id: string | null;
  anfitrion_id: string | null;
  huesped_nombre: string | null;
  anfitrion_nombre: string | null;
  propiedad_id: string | null;
  propiedad_nombre: string | null;
  ultimo_mensaje: string | null;
  ultimo_mensaje_at: string;
  huesped_no_leidos: number;
  anfitrion_no_leidos: number;
  admin_no_leidos: number;
  estado: "activa" | "archivada" | "bloqueada";
  created_at: string;
};

// Patrones para detectar datos personales
const BLOCKED_PATTERNS = [
  /(\+?[\d\s\-().]{9,})/g,                          // teléfonos
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, // emails
  /(?:whatsapp|telegram|instagram|facebook|twitter|tiktok|snapchat|signal|skype|discord|wechat|line)\s*[:@]?\s*[\w.@+\-]+/gi, // redes sociales
  /(?:mi\s+(?:tel[eé]fono|m[oó]vil|n[uú]mero|email|correo|whatsapp|telegram|instagram)|(?:tel[eé]fono|m[oó]vil|n[uú]mero|email|correo|whatsapp|telegram|instagram)\s*(?:es|:))\s*[\w.@+\-\s]+/gi,
];

export function filterPersonalData(text: string): { filtered: string; hasBlocked: boolean } {
  let filtered = text;
  let hasBlocked = false;

  BLOCKED_PATTERNS.forEach((pattern) => {
    if (pattern.test(filtered)) {
      hasBlocked = true;
      filtered = filtered.replace(pattern, "[DATO BLOQUEADO]");
    }
    pattern.lastIndex = 0;
  });

  return { filtered, hasBlocked };
}

export function useChat(conversationId: string | null, userTipo: "huesped" | "anfitrion" | "admin") {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages((data as ChatMessage[]) || []);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new as ChatMessage];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? (payload.new as ChatMessage) : m))
          );
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages]);

  const sendMessage = useCallback(
    async (
      text: string,
      senderId: string | null,
      senderNombre: string | null
    ): Promise<{ blocked: boolean; error: string | null }> => {
      if (!conversationId || !text.trim()) return { blocked: false, error: "Mensaje vacío" };

      const { filtered, hasBlocked } = filterPersonalData(text.trim());

      setSending(true);
      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        sender_id: senderId,
        sender_tipo: userTipo,
        sender_nombre: senderNombre,
        contenido: filtered,
        bloqueado: hasBlocked,
        razon_bloqueo: hasBlocked ? "Datos personales detectados y bloqueados automáticamente" : null,
        leido_huesped: userTipo === "huesped",
        leido_anfitrion: userTipo === "anfitrion",
        leido_admin: userTipo === "admin",
      });

      if (!error) {
        // Update conversation last message
        await supabase
          .from("chat_conversations")
          .update({
            ultimo_mensaje: hasBlocked ? "[Mensaje con datos bloqueados]" : filtered.slice(0, 100),
            ultimo_mensaje_at: new Date().toISOString(),
            huesped_no_leidos: userTipo !== "huesped" ? supabase.rpc : undefined,
          })
          .eq("id", conversationId);
      }

      setSending(false);
      return { blocked: hasBlocked, error: error?.message || null };
    },
    [conversationId, userTipo]
  );

  const markAsRead = useCallback(async () => {
    if (!conversationId) return;
    const field = userTipo === "huesped" ? "leido_huesped" : userTipo === "anfitrion" ? "leido_anfitrion" : "leido_admin";
    await supabase
      .from("chat_messages")
      .update({ [field]: true })
      .eq("conversation_id", conversationId)
      .eq(field, false);

    const noLeidosField = userTipo === "huesped" ? "huesped_no_leidos" : userTipo === "anfitrion" ? "anfitrion_no_leidos" : "admin_no_leidos";
    await supabase
      .from("chat_conversations")
      .update({ [noLeidosField]: 0 })
      .eq("id", conversationId);
  }, [conversationId, userTipo]);

  return { messages, loading, sending, sendMessage, markAsRead, refetch: fetchMessages };
}

export function useConversations(
  userId: string | null | undefined,
  userTipo: "huesped" | "anfitrion" | "admin"
) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!userId && userTipo !== "admin") return;
    setLoading(true);

    let query = supabase
      .from("chat_conversations")
      .select("*")
      .order("ultimo_mensaje_at", { ascending: false });

    if (userTipo === "huesped") {
      query = query.eq("huesped_id", userId!);
    } else if (userTipo === "anfitrion") {
      query = query.eq("anfitrion_id", userId!);
    }
    // admin gets all

    const { data } = await query;
    setConversations((data as ChatConversation[]) || []);
    setLoading(false);
  }, [userId, userTipo]);

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel(`conversations:${userTipo}:${userId || "admin"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_conversations" },
        () => { fetchConversations(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchConversations, userId, userTipo]);

  const createConversation = useCallback(
    async (params: {
      huesped_id: string;
      anfitrion_id: string;
      huesped_nombre: string;
      anfitrion_nombre: string;
      propiedad_id?: string;
      propiedad_nombre?: string;
    }): Promise<string | null> => {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("huesped_id", params.huesped_id)
        .eq("anfitrion_id", params.anfitrion_id)
        .maybeSingle();

      if (existing) return existing.id;

      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({ ...params, estado: "activa" })
        .select("id")
        .maybeSingle();

      if (error || !data) return null;
      return data.id;
    },
    []
  );

  return { conversations, loading, refetch: fetchConversations, createConversation };
}
