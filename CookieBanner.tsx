import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("nexura_cookies_accepted");
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("nexura_cookies_accepted", "all");
    setVisible(false);
  };

  const handleEssential = () => {
    localStorage.setItem("nexura_cookies_accepted", "essential");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:p-4 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto">
        <div className="bg-white border border-stone-200 rounded-2xl shadow-lg px-4 py-3 md:px-5 md:py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Icono */}
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600 flex-shrink-0">
            <i className="ri-settings-3-line text-base"></i>
          </div>

          {/* Texto */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-stone-700 leading-relaxed font-body">
              <strong className="text-stone-900">Usamos cookies</strong> para mejorar tu experiencia.
              Las esenciales son necesarias para el funcionamiento de la plataforma.{" "}
              <Link
                to="/legal?seccion=cookies"
                className="text-amber-600 hover:underline font-medium whitespace-nowrap"
              >
                Política de cookies
              </Link>
            </p>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleEssential}
              className="px-3 py-1.5 text-xs font-medium text-stone-600 border border-stone-200 rounded-full hover:bg-stone-50 transition-colors cursor-pointer whitespace-nowrap font-body"
            >
              Solo esenciales
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-1.5 text-xs font-semibold bg-stone-900 text-white rounded-full hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap font-body"
            >
              Aceptar todas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
