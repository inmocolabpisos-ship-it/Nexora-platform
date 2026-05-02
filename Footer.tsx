import { Link } from "react-router-dom";

export default function Footer() {
  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const body = new URLSearchParams();
    formData.forEach((value, key) => body.append(key, value.toString()));
    try {
      await fetch("https://readdy.ai/api/form/d7cfjas5q56ra7tuf5v0", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      form.reset();
    } catch {
      // silently fail
    }
  };

  return (
    <footer className="bg-cream-100 border-t border-gold-200/60 text-charcoal-600">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <img
              src="https://static.readdy.ai/image/50e49e5b27cb755174d08442fb82be78/0382ce5f5531b6331d655d1fe255f2da.png"
              alt="NEXURA"
              className="h-14 w-auto object-contain mb-4"
            />
            <p className="text-sm text-charcoal-500 leading-relaxed font-body">
              NEXURA — The Luxury Stay Experience. Plataforma premium de alquiler vacacional con verificación de identidad certificada para SES HOSPEDAJE.
            </p>
            <div className="flex gap-3 mt-5">
              {["ri-instagram-line", "ri-facebook-line", "ri-twitter-x-line", "ri-linkedin-line"].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-gold-300 text-gold-600 hover:border-gold-500 hover:bg-gold-50 transition-colors cursor-pointer"
                >
                  <i className={`${icon} text-sm`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Links Plataforma */}
          <div>
            <h4 className="text-charcoal-800 font-semibold text-sm mb-4 tracking-widest uppercase font-body">Plataforma</h4>
            <ul className="space-y-3">
              {[
                { label: "Inicio", href: "/" },
                { label: "Propiedades", href: "/propiedades" },
                { label: "Barcos y Catamaranes", href: "/barcos" },
                { label: "Hostales", href: "/hostales" },
                { label: "Camping y Glamping", href: "/camping" },
                { label: "Registro Huéspedes", href: "/registro-huesped" },
                { label: "Registro Anfitriones", href: "/registro-anfitrion" },
                { label: "Inmobiliarias", href: "/inmobiliarias" },
                { label: "Panel Admin", href: "/admin" },
              ].map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className="text-sm text-charcoal-500 hover:text-gold-600 transition-colors cursor-pointer font-body">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-charcoal-800 font-semibold text-sm mb-4 tracking-widest uppercase font-body">Legal</h4>
            <ul className="space-y-3">
              {[
                { label: "Aviso Legal", seccion: "aviso-legal" },
                { label: "Política de Privacidad", seccion: "privacidad" },
                { label: "Términos y Condiciones", seccion: "terminos" },
                { label: "Protección de Datos (RGPD)", seccion: "privacidad" },
                { label: "Normativa SES HOSPEDAJE", seccion: "ses-hospedaje" },
                { label: "IVA — Servicios Adicionales", seccion: "iva-servicios" },
                { label: "Política de Cookies", seccion: "cookies" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={`/legal?seccion=${item.seccion}`}
                    className="text-sm text-charcoal-500 hover:text-gold-600 transition-colors cursor-pointer font-body"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 pt-4 border-t border-gold-200/60">
              <p className="text-xs text-charcoal-400 leading-relaxed font-body">
                NEXURA opera conforme al RD 933/2021 y la normativa SES HOSPEDAJE. Datos tratados según el RGPD (UE) 2016/679.
              </p>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-charcoal-800 font-semibold text-sm mb-4 tracking-widest uppercase font-body">Newsletter</h4>
            <p className="text-sm text-charcoal-500 mb-4 font-body">Recibe novedades y actualizaciones de la plataforma.</p>
            <form
              data-readdy-form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col gap-2"
            >
              <input
                type="email"
                name="email"
                placeholder="tu@email.com"
                required
                className="bg-white border border-gold-200 rounded-lg px-4 py-2.5 text-sm text-charcoal-800 placeholder-charcoal-400 focus:outline-none focus:border-gold-400 font-body"
              />
              <button
                type="submit"
                className="bg-gold-gradient hover:opacity-90 text-white text-sm font-semibold py-2.5 rounded-lg transition-opacity cursor-pointer whitespace-nowrap font-body"
              >
                Suscribirme
              </button>
            </form>
          </div>
        </div>

        {/* Aviso SES */}
        <div className="border-t border-gold-200/60 pt-8 mb-6">
          <div className="bg-white rounded-xl border border-gold-200 p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gold-100 text-gold-600 flex-shrink-0 mt-0.5">
                <i className="ri-government-line text-sm"></i>
              </div>
              <div>
                <p className="text-xs font-semibold text-gold-700 uppercase tracking-wide mb-2 font-body">
                  Aviso Legal — Obligación SES HOSPEDAJE (RD 933/2021)
                </p>
                <p className="text-xs text-charcoal-500 leading-relaxed font-body">
                  <strong className="text-charcoal-700">NEXURA actúa exclusivamente como plataforma intermediaria</strong> entre propietarios y huéspedes. La obligación de comunicar los datos de los viajeros a las autoridades competentes (Policía Nacional, Guardia Civil, Mossos d&apos;Esquadra o Ertzaintza) a través del sistema SES HOSPEDAJE recae <strong className="text-charcoal-700">exclusivamente sobre el propietario o arrendador del alojamiento</strong>, conforme al Real Decreto 933/2021, de 26 de octubre.
                </p>
                <p className="text-xs text-charcoal-400 leading-relaxed mt-2 font-body">
                  NEXURA no asume responsabilidad alguna por el incumplimiento de dicha obligación por parte del propietario. No obstante, NEXURA se reserva el derecho de <strong className="text-charcoal-500">solicitar al propietario justificante acreditativo</strong> del cumplimiento de esta obligación como condición para mantener la propiedad activa en la plataforma.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gold-200/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-charcoal-400 font-body">
            © 2026 NEXURA — The Luxury Stay Experience. Todos los derechos reservados. Plataforma certificada SES HOSPEDAJE.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-charcoal-400 font-body">Sistema operativo</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
