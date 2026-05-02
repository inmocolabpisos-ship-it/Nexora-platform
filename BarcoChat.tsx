import { useState, useRef, useEffect } from "react";

interface Mensaje {
  id: string;
  texto: string;
  autor: "usuario" | "nexura";
  hora: string;
}

const mensajesIniciales: Mensaje[] = [
  {
    id: "1",
    texto: "¡Hola! Soy el equipo de NEXURA. Estoy aquí para ayudarte con cualquier consulta sobre esta embarcación. ¿En qué puedo ayudarte?",
    autor: "nexura",
    hora: "09:00",
  },
];

export default function BarcoChat({ nombreBarco }: { nombreBarco: string }) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesIniciales);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (abierto) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes, abierto]);

  const ahora = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const enviar = async () => {
    if (!texto.trim() || enviando) return;
    const msgUsuario: Mensaje = {
      id: Date.now().toString(),
      texto: texto.trim(),
      autor: "usuario",
      hora: ahora(),
    };
    setMensajes((prev) => [...prev, msgUsuario]);
    setTexto("");
    setEnviando(true);

    await new Promise((r) => setTimeout(r, 1200));

    const respuestas = [
      `Gracias por tu consulta sobre ${nombreBarco}. Nuestro equipo te responderá en breve. También puedes contactarnos por WhatsApp al 614 976 736 para una respuesta inmediata.`,
      "¡Claro! Estaré encantado de ayudarte. ¿Tienes alguna fecha en mente para la reserva?",
      "Perfecto. El precio incluye patrón titulado, seguro a todo riesgo y combustible del primer depósito. ¿Necesitas más información?",
      "Podemos organizar catering a bordo, decoración especial o cualquier servicio adicional que necesites. ¡Cuéntanos!",
    ];
    const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];

    setMensajes((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        texto: respuesta,
        autor: "nexura",
        hora: ahora(),
      },
    ]);
    setEnviando(false);
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center bg-stone-900 text-white rounded-full cursor-pointer hover:bg-stone-700 transition-colors"
        aria-label="Chat"
      >
        <i className={`text-xl ${abierto ? "ri-close-line" : "ri-chat-3-line"}`}></i>
        {!abierto && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-xs flex items-center justify-center font-bold">1</span>
        )}
      </button>

      {/* Panel de chat */}
      {abierto && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white rounded-2xl border border-stone-200 flex flex-col overflow-hidden" style={{ height: "460px" }}>
          {/* Header */}
          <div className="bg-stone-900 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-amber-500 text-white flex-shrink-0">
              <i className="ri-sailboat-line text-sm"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold font-body truncate">NEXURA Náutica</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <p className="text-white/60 text-xs font-body">En línea · Respuesta rápida</p>
              </div>
            </div>
            <button onClick={() => setAbierto(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 cursor-pointer">
              <i className="ri-close-line text-sm"></i>
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50">
            {mensajes.map((m) => (
              <div key={m.id} className={`flex ${m.autor === "usuario" ? "justify-end" : "justify-start"}`}>
                {m.autor === "nexura" && (
                  <div className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-900 text-white text-xs flex-shrink-0 mr-2 mt-0.5">
                    <i className="ri-sailboat-line text-xs"></i>
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                  m.autor === "usuario"
                    ? "bg-stone-900 text-white rounded-br-sm"
                    : "bg-white text-stone-800 border border-stone-200 rounded-bl-sm"
                }`}>
                  <p className="text-xs leading-relaxed font-body">{m.texto}</p>
                  <p className={`text-xs mt-1 ${m.autor === "usuario" ? "text-white/50" : "text-stone-400"} font-body`}>{m.hora}</p>
                </div>
              </div>
            ))}
            {enviando && (
              <div className="flex justify-start">
                <div className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-900 text-white text-xs flex-shrink-0 mr-2 mt-0.5">
                  <i className="ri-sailboat-line text-xs"></i>
                </div>
                <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}></div>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-stone-100 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enviar()}
                placeholder="Escribe tu consulta..."
                className="flex-1 bg-stone-50 border border-stone-200 rounded-full px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 font-body"
              />
              <button
                onClick={enviar}
                disabled={!texto.trim() || enviando}
                className="w-9 h-9 flex items-center justify-center bg-stone-900 text-white rounded-full cursor-pointer hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <i className="ri-send-plane-fill text-sm"></i>
              </button>
            </div>
            <p className="text-xs text-stone-400 text-center mt-2 font-body">
              También en WhatsApp: <a href="https://wa.me/34614976736" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-medium">614 976 736</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
