export default function SesSection() {
  return (
    <section className="py-24 bg-charcoal-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <img
          src="https://readdy.ai/api/search-image?query=abstract%20luxury%20pattern%20gold%20geometric%20texture%20elegant%20background%20minimal&width=1920&height=600&seq=pattern001&orientation=landscape"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-gold-400 text-xs font-semibold tracking-widest uppercase font-body">Normativa oficial</span>
            <h2 className="text-3xl md:text-4xl font-light text-cream-100 mt-3 mb-6 leading-tight">
              Cumplimiento total con
              <br />
              <strong className="font-bold text-gold-300">SES HOSPEDAJE</strong>
            </h2>
            <p className="text-charcoal-300 text-sm leading-relaxed mb-6 font-body">
              Nuestra plataforma está diseñada para cumplir con el Real Decreto 933/2021 que obliga a los establecimientos de hospedaje a registrar los datos de sus huéspedes y comunicarlos a las Fuerzas y Cuerpos de Seguridad del Estado.
            </p>
            <ul className="space-y-3">
              {[
                "Recogida de datos personales completos",
                "Fotografía del documento de identidad (DNI/Pasaporte)",
                "Verificación biométrica mediante selfie",
                "Exportación de datos para comunicación a autoridades",
                "Almacenamiento seguro conforme al RGPD",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-charcoal-200 text-sm font-body">
                  <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                    <i className="ri-check-line text-gold-400"></i>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "ri-government-line", title: "Autoridades", desc: "Datos listos para comunicar a Policía Nacional y Guardia Civil" },
              { icon: "ri-database-2-line", title: "Base de Datos", desc: "Almacenamiento seguro y encriptado de toda la documentación" },
              { icon: "ri-time-line", title: "Tiempo Real", desc: "Registro y verificación inmediata en el momento del check-in" },
              { icon: "ri-download-cloud-line", title: "Exportación", desc: "Descarga de informes en formato compatible con SES HOSPEDAJE" },
            ].map((item) => (
              <div key={item.title} className="bg-charcoal-700 rounded-2xl p-5 border border-charcoal-600">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gold-500/20 text-gold-400 mb-4">
                  <i className={`${item.icon} text-lg`}></i>
                </div>
                <h4 className="text-cream-100 font-semibold text-sm mb-1 font-body">{item.title}</h4>
                <p className="text-charcoal-300 text-xs leading-relaxed font-body">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
