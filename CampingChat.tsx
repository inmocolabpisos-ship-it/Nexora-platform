import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  text: string;
  sender: "user" | "host";
  time: string;
}

const QUICK_QUESTIONS = [
  "¿Admitís mascotas?",
  "¿Hay piscina?",
  "¿Cuándo abre la temporada?",
  "¿Hay bungalows disponibles?",
];

export default function CampingChat({ nombreCamping }: { nombreCamping: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `¡Hola! Bienvenido a ${nombreCamping}. ¿En qué podemos ayudarte?`,
      sender: "host",
      time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);
    const userMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      await supabase.functions.invoke("whatsapp-notify", {
        body: { tipo: "chat_camping", pagina: `Camping: ${nombreCamping}`, propiedad: nombreCamping, mensaje: text.trim() },
      });
    } catch { /* silent */ }

    setTimeout(() => {
      const replies = [
        "¡Gracias por tu mensaje! Te respondemos en breve.",
        "Hemos recibido tu consulta. Nuestro equipo te contactará pronto.",
        "¡Perfecto! Estamos revisando tu pregunta y te respondemos enseguida.",
        "Gracias por contactarnos. Para reservas urgentes puedes llamarnos directamente.",
      ];
      const hostMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: replies[Math.floor(Math.random() * replies.length)],
        sender: "host",
        time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, hostMsg]);
      if (!open) setUnread((n) => n + 1);
      setSending(false);
    }, 1200);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 flex items-center justify-center rounded-full bg-emerald-700 text-white cursor-pointer hover:bg-emerald-600 transition-colors"
        aria-label="Chat con el camping"
      >
        <i className="ri-message-3-line text-xl"></i>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl border border-stone-200 flex flex-col overflow-hidden" style={{ maxHeight: "480px" }}>
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-700 text-white">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-500 flex-shrink-0">
              <i className="ri-tent-line text-sm"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate font-body">{nombreCamping}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-300"></div>
                <p className="text-xs text-white/70 font-body">En línea</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 cursor-pointer text-white/80">
              <i className="ri-close-line"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50" style={{ minHeight: 0 }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                  msg.sender === "user" ? "bg-emerald-700 text-white rounded-br-sm" : "bg-white border border-stone-200 text-stone-800 rounded-bl-sm"
                }`}>
                  <p className="text-xs leading-relaxed font-body">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === "user" ? "text-white/50" : "text-stone-400"} font-body`}>{msg.time}</p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-white border-t border-stone-100 flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1.5 rounded-full hover:bg-emerald-100 hover:text-emerald-700 transition-colors cursor-pointer font-body whitespace-nowrap">
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-3 bg-white border-t border-stone-100">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded-full px-3 py-2 focus:outline-none focus:border-stone-400 font-body"
            />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || sending}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-700 text-white cursor-pointer hover:bg-emerald-600 transition-colors disabled:opacity-40">
              <i className="ri-send-plane-fill text-xs"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
