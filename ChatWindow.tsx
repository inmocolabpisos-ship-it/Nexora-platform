import { useState, useEffect, useRef } from "react";
import { useChat, ChatConversation } from "@/hooks/useChat";

interface ChatWindowProps {
  conversation: ChatConversation;
  currentUserId: string | null;
  currentUserNombre: string | null;
  currentUserTipo: "huesped" | "anfitrion" | "admin";
  onBack?: () => void;
}

export default function ChatWindow({
  conversation,
  currentUserId,
  currentUserNombre,
  currentUserTipo,
  onBack,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState("");
  const [blockedWarning, setBlockedWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, loading, sending, sendMessage, markAsRead } = useChat(
    conversation.id,
    currentUserTipo
  );

  useEffect(() => {
    markAsRead();
  }, [conversation.id, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    setInputText("");
    setBlockedWarning(false);

    const { blocked } = await sendMessage(text, currentUserId, currentUserNombre);
    if (blocked) {
      setBlockedWarning(true);
      setTimeout(() => setBlockedWarning(false), 5000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherName =
    currentUserTipo === "huesped"
      ? conversation.anfitrion_nombre || "Anfitrión"
      : currentUserTipo === "anfitrion"
      ? conversation.huesped_nombre || "Huésped"
      : `${conversation.huesped_nombre || "Huésped"} ↔ ${conversation.anfitrion_nombre || "Anfitrión"}`;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  const isMine = (senderId: string | null, senderTipo: string) => {
    if (currentUserTipo === "admin") return senderTipo === "admin";
    return senderId === currentUserId;
  };

  const senderColor = (tipo: string) => {
    if (tipo === "admin") return "bg-amber-500";
    if (tipo === "anfitrion") return "bg-stone-700";
    return "bg-stone-400";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 bg-white flex-shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors cursor-pointer text-stone-500 flex-shrink-0"
          >
            <i className="ri-arrow-left-line"></i>
          </button>
        )}
        <div className="w-9 h-9 flex items-center justify-center rounded-full bg-stone-900 text-white text-sm font-bold flex-shrink-0">
          {otherName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-900 truncate">{otherName}</p>
          {conversation.propiedad_nombre && (
            <p className="text-xs text-stone-400 truncate">
              <i className="ri-home-line mr-1"></i>{conversation.propiedad_nombre}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span className="text-xs text-stone-400">En línea</span>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2 flex-shrink-0">
        <i className="ri-shield-check-line text-amber-600 text-sm flex-shrink-0"></i>
        <p className="text-xs text-amber-700">
          Por seguridad, los datos personales (teléfonos, emails, redes sociales) son bloqueados automáticamente.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-stone-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <i className="ri-loader-4-line animate-spin text-2xl text-stone-300"></i>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-stone-100 mb-3">
              <i className="ri-chat-3-line text-2xl text-stone-400"></i>
            </div>
            <p className="text-stone-500 text-sm font-medium">Inicia la conversación</p>
            <p className="text-stone-400 text-xs mt-1">Los mensajes son privados y seguros</p>
          </div>
        ) : (
          messages.map((msg) => {
            const mine = isMine(msg.sender_id, msg.sender_tipo);
            return (
              <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-end gap-2 max-w-[75%] ${mine ? "flex-row-reverse" : "flex-row"}`}>
                  {!mine && (
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0 ${senderColor(msg.sender_tipo)}`}>
                      {(msg.sender_nombre || msg.sender_tipo).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                    {!mine && (
                      <span className="text-xs text-stone-400 mb-1 px-1">
                        {msg.sender_nombre || msg.sender_tipo}
                        {msg.sender_tipo === "admin" && (
                          <span className="ml-1 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-xs font-medium">Admin</span>
                        )}
                      </span>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        mine
                          ? "bg-stone-900 text-white rounded-br-sm"
                          : "bg-white text-stone-800 border border-stone-100 rounded-bl-sm"
                      } ${msg.bloqueado ? "opacity-70" : ""}`}
                    >
                      {msg.contenido}
                      {msg.bloqueado && (
                        <div className={`flex items-center gap-1 mt-1.5 text-xs ${mine ? "text-stone-300" : "text-amber-600"}`}>
                          <i className="ri-shield-line"></i>
                          <span>Datos personales bloqueados</span>
                        </div>
                      )}
                    </div>
                    <span className={`text-xs text-stone-400 mt-1 px-1 ${mine ? "text-right" : "text-left"}`}>
                      {formatTime(msg.created_at)}
                      {mine && (
                        <i className={`ml-1 ${
                          (currentUserTipo === "huesped" && msg.leido_anfitrion) ||
                          (currentUserTipo === "anfitrion" && msg.leido_huesped)
                            ? "ri-check-double-line text-emerald-500"
                            : "ri-check-line"
                        }`}></i>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Blocked warning */}
      {blockedWarning && (
        <div className="mx-4 mb-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <i className="ri-shield-check-line text-amber-600 flex-shrink-0"></i>
          <p className="text-xs text-amber-700">
            Tu mensaje contenía datos personales que han sido bloqueados automáticamente por seguridad.
          </p>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-stone-100 bg-white flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            className="flex-1 resize-none bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors max-h-32 overflow-y-auto"
            style={{ minHeight: "42px" }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-900 text-white hover:bg-stone-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {sending ? (
              <i className="ri-loader-4-line animate-spin text-sm"></i>
            ) : (
              <i className="ri-send-plane-fill text-sm"></i>
            )}
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-1.5 text-center">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  );
}
