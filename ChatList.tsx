import { ChatConversation } from "@/hooks/useChat";

interface ChatListProps {
  conversations: ChatConversation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (conv: ChatConversation) => void;
  currentUserTipo: "huesped" | "anfitrion" | "admin";
  onNewChat?: () => void;
}

export default function ChatList({
  conversations,
  loading,
  selectedId,
  onSelect,
  currentUserTipo,
  onNewChat,
}: ChatListProps) {
  const getOtherName = (conv: ChatConversation) => {
    if (currentUserTipo === "huesped") return conv.anfitrion_nombre || "Anfitrión";
    if (currentUserTipo === "anfitrion") return conv.huesped_nombre || "Huésped";
    return `${conv.huesped_nombre || "Huésped"} ↔ ${conv.anfitrion_nombre || "Anfitrión"}`;
  };

  const getUnread = (conv: ChatConversation) => {
    if (currentUserTipo === "huesped") return conv.huesped_no_leidos;
    if (currentUserTipo === "anfitrion") return conv.anfitrion_no_leidos;
    return conv.admin_no_leidos;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return d.toLocaleDateString("es-ES", { weekday: "short" });
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Mensajes</h3>
          <p className="text-xs text-stone-400 mt-0.5">{conversations.length} conversación{conversations.length !== 1 ? "es" : ""}</p>
        </div>
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors cursor-pointer"
            title="Nueva conversación"
          >
            <i className="ri-add-line text-sm"></i>
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <i className="ri-loader-4-line animate-spin text-xl text-stone-300"></i>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-stone-100 mb-3">
              <i className="ri-chat-3-line text-xl text-stone-400"></i>
            </div>
            <p className="text-stone-500 text-sm font-medium">Sin conversaciones</p>
            <p className="text-stone-400 text-xs mt-1">
              {currentUserTipo === "huesped"
                ? "Contacta con un anfitrión desde la página de la propiedad"
                : "Las conversaciones aparecerán aquí"}
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const unread = getUnread(conv);
            const isSelected = conv.id === selectedId;
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-stone-50 hover:bg-stone-50 transition-colors cursor-pointer text-left ${
                  isSelected ? "bg-stone-100" : ""
                }`}
              >
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-900 text-white text-sm font-bold flex-shrink-0 relative">
                  {getOtherName(conv).charAt(0).toUpperCase()}
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-sm truncate ${unread > 0 ? "font-semibold text-stone-900" : "font-medium text-stone-700"}`}>
                      {getOtherName(conv)}
                    </span>
                    <span className="text-xs text-stone-400 flex-shrink-0 ml-2">
                      {formatTime(conv.ultimo_mensaje_at)}
                    </span>
                  </div>
                  {conv.propiedad_nombre && (
                    <p className="text-xs text-stone-400 truncate mb-0.5">
                      <i className="ri-home-line mr-0.5"></i>{conv.propiedad_nombre}
                    </p>
                  )}
                  <p className={`text-xs truncate ${unread > 0 ? "text-stone-600 font-medium" : "text-stone-400"}`}>
                    {conv.ultimo_mensaje || "Sin mensajes aún"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
