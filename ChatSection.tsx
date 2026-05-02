import { useState } from "react";
import { useConversations } from "@/hooks/useChat";
import ChatList from "@/components/feature/ChatList";
import ChatWindow from "@/components/feature/ChatWindow";
import { supabase } from "@/lib/supabase";

interface ChatSectionProps {
  adminUser: { id?: string; email?: string; user_metadata?: { full_name?: string } } | null;
}

export default function ChatSection({ adminUser }: ChatSectionProps) {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const { conversations, loading } = useConversations(null, "admin");

  const selectedConv = conversations.find((c) => c.id === selectedConvId) || null;
  const adminNombre = adminUser?.user_metadata?.full_name || adminUser?.email || "Admin";

  const handleBlockConversation = async (convId: string) => {
    await supabase
      .from("chat_conversations")
      .update({ estado: "bloqueada" })
      .eq("id", convId);
  };

  const handleUnblockConversation = async (convId: string) => {
    await supabase
      .from("chat_conversations")
      .update({ estado: "activa" })
      .eq("id", convId);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-stone-900 mb-1">Chat</h2>
        <p className="text-stone-500 text-sm">Supervisa y participa en todas las conversaciones de la plataforma</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
        <div className="flex h-full">
          {/* Conversations list */}
          <div className={`w-80 flex-shrink-0 border-r border-stone-100 flex flex-col ${selectedConvId ? "hidden lg:flex" : "flex"}`}>
            {/* Stats bar */}
            <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="text-xs text-stone-600 font-medium">{conversations.filter(c => c.estado === "activa").length} activas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <span className="text-xs text-stone-600 font-medium">{conversations.filter(c => c.estado === "bloqueada").length} bloqueadas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <span className="text-xs text-stone-600 font-medium">
                  {conversations.reduce((acc, c) => acc + (c.admin_no_leidos || 0), 0)} sin leer
                </span>
              </div>
            </div>
            <ChatList
              conversations={conversations}
              loading={loading}
              selectedId={selectedConvId}
              onSelect={(conv) => setSelectedConvId(conv.id)}
              currentUserTipo="admin"
            />
          </div>

          {/* Chat window */}
          <div className={`flex-1 flex flex-col ${!selectedConvId ? "hidden lg:flex" : "flex"}`}>
            {selectedConv ? (
              <div className="flex flex-col h-full">
                {/* Admin controls bar */}
                <div className="px-4 py-2 bg-stone-50 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      selectedConv.estado === "activa" ? "bg-emerald-100 text-emerald-700" :
                      selectedConv.estado === "bloqueada" ? "bg-red-100 text-red-700" :
                      "bg-stone-100 text-stone-600"
                    }`}>
                      {selectedConv.estado === "activa" ? "Activa" : selectedConv.estado === "bloqueada" ? "Bloqueada" : "Archivada"}
                    </span>
                    <span className="text-xs text-stone-400">
                      Iniciada {new Date(selectedConv.created_at).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedConv.estado === "activa" ? (
                      <button
                        onClick={() => handleBlockConversation(selectedConv.id)}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-forbid-line"></i> Bloquear chat
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnblockConversation(selectedConv.id)}
                        className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:border-emerald-300 px-3 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-check-line"></i> Desbloquear
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedConvId(null)}
                      className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-200 transition-colors cursor-pointer text-stone-500"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatWindow
                    conversation={selectedConv}
                    currentUserId={adminUser?.id || null}
                    currentUserNombre={adminNombre}
                    currentUserTipo="admin"
                    onBack={() => setSelectedConvId(null)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-stone-100 mb-4">
                  <i className="ri-chat-3-line text-3xl text-stone-400"></i>
                </div>
                <h3 className="text-stone-700 font-semibold mb-2">Selecciona una conversación</h3>
                <p className="text-stone-400 text-sm max-w-xs">
                  Elige una conversación de la lista para ver los mensajes y participar como administrador.
                </p>
                <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4 max-w-sm text-left">
                  <div className="flex items-start gap-2">
                    <i className="ri-shield-check-line text-amber-600 mt-0.5 flex-shrink-0"></i>
                    <div>
                      <p className="text-xs font-semibold text-amber-800 mb-1">Moderación automática activa</p>
                      <p className="text-xs text-amber-700">
                        Los mensajes con teléfonos, emails o redes sociales son bloqueados automáticamente para proteger a los usuarios.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
