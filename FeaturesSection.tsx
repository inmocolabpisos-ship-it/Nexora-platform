export default function FeaturesSection() {
  const features = [
    {
      icon: "ri-shield-check-line",
      title: "Verificación de Identidad",
      desc: "Captura de DNI frontal, trasero y selfie en tiempo real desde tu móvil o PC. Proceso 100% seguro y encriptado.",
      color: "bg-gold-100 text-gold-700",
    },
    {
      icon: "ri-award-line",
      title: "Cumplimiento SES HOSPEDAJE",
      desc: "Toda la documentación recopilada cumple con los requisitos del Sistema de Entrada de Solicitudes de Hospedaje.",
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      icon: "ri-camera-line",
      title: "Captura con Cámara Real",
      desc: "Usa la cámara de tu smartphone o webcam para fotografiar documentos y hacer tu selfie de verificación.",
      color: "bg-rose-50 text-rose-700",
    },
    {
      icon: "ri-admin-line",
      title: "Panel de Administración",
      desc: "Los administradores pueden revisar, verificar y gestionar toda la documentación de huéspedes y anfitriones.",
      color: "bg-stone-100 text-stone-700",
    },
    {
      icon: "ri-lock-password-line",
      title: "Datos Protegidos",
      desc: "Almacenamiento seguro conforme al RGPD. Tus datos personales y documentos están completamente protegidos.",
      color: "bg-sky-50 text-sky-700",
    },
    {
      icon: "ri-star-line",
      title: "Experiencia Premium",
      desc: "Diseño luxury inspirado en las mejores plataformas del mundo para una experiencia de usuario excepcional.",
      color: "bg-gold-100 text-gold-700",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="text-center mb-16">
          <span className="text-gold-600 text-xs font-semibold tracking-widest uppercase font-body">Por qué elegirnos</span>
          <h2 className="text-3xl md:text-4xl font-light text-charcoal-900 mt-3 mb-4">
            La plataforma más <strong className="font-semibold">segura y completa</strong>
          </h2>
          <p className="text-charcoal-500 max-w-xl mx-auto text-sm leading-relaxed font-body">
            Diseñada para cumplir con toda la normativa española de alojamientos turísticos, con la mejor experiencia de usuario.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-7 rounded-2xl border border-gold-100 hover:border-gold-300 transition-all duration-300 group bg-white"
            >
              <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${f.color} mb-5`}>
                <i className={`${f.icon} text-xl`}></i>
              </div>
              <h3 className="text-charcoal-900 font-semibold text-base mb-2 font-body">{f.title}</h3>
              <p className="text-charcoal-500 text-sm leading-relaxed font-body">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
