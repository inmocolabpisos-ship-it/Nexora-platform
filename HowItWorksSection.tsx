import { Link } from "react-router-dom";

export default function HowItWorksSection() {
  const stepsGuest = [
    { num: "01", title: "Completa tus datos", desc: "Rellena el formulario con tu información personal: nombre, DNI, fecha de nacimiento y contacto." },
    { num: "02", title: "Fotografía tu DNI", desc: "Usa la cámara de tu dispositivo para capturar la parte frontal y trasera de tu documento de identidad." },
    { num: "03", title: "Hazte un selfie", desc: "Tómate una foto en tiempo real para verificar que eres el titular del documento." },
    { num: "04", title: "Verificación completada", desc: "El equipo de administración revisará tu documentación y recibirás confirmación en breve." },
  ];

  return (
    <section className="py-24 bg-cream-100">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="text-center mb-16">
          <span className="text-gold-600 text-xs font-semibold tracking-widest uppercase font-body">Proceso simple</span>
          <h2 className="text-3xl md:text-4xl font-light text-charcoal-900 mt-3 mb-4">
            Regístrate en <strong className="font-semibold">4 pasos</strong>
          </h2>
          <p className="text-charcoal-500 max-w-xl mx-auto text-sm leading-relaxed font-body">
            El proceso de registro es rápido, seguro y completamente digital. Sin papeleos ni desplazamientos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stepsGuest.map((step, i) => (
            <div key={step.num} className="relative">
              {i < stepsGuest.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gold-200 z-0" style={{ width: "calc(100% - 2rem)" }}></div>
              )}
              <div className="relative z-10 bg-white rounded-2xl p-6 border border-gold-100">
                <div className="text-4xl font-bold text-gold-200 mb-4">{step.num}</div>
                <h3 className="text-charcoal-900 font-semibold text-sm mb-2 font-body">{step.title}</h3>
                <p className="text-charcoal-500 text-xs leading-relaxed font-body">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Two columns CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative overflow-hidden rounded-3xl">
            <img
              src="https://readdy.ai/api/search-image?query=happy%20traveler%20tourist%20woman%20checking%20into%20luxury%20hotel%20reception%20smiling%20elegant%20interior%20warm%20lighting%20professional%20photography&width=700&height=420&seq=guest001&orientation=landscape"
              alt="Huésped registrándose"
              className="w-full h-64 object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-7">
              <span className="text-gold-300 text-xs font-semibold tracking-widest uppercase font-body">Para Huéspedes</span>
              <h3 className="text-white text-xl font-semibold mt-1 mb-3">Viaja con total tranquilidad</h3>
              <Link
                to="/registro-huesped"
                className="inline-flex items-center gap-2 bg-white text-charcoal-900 text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-cream-100 transition-colors cursor-pointer whitespace-nowrap font-body"
              >
                Registrarme como Huésped
                <i className="ri-arrow-right-line"></i>
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl">
            <img
              src="https://readdy.ai/api/search-image?query=luxury%20villa%20host%20owner%20standing%20at%20beautiful%20property%20entrance%20mediterranean%20architecture%20elegant%20professional%20real%20estate&width=700&height=420&seq=host001&orientation=landscape"
              alt="Anfitrión con su propiedad"
              className="w-full h-64 object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-7">
              <span className="text-gold-300 text-xs font-semibold tracking-widest uppercase font-body">Para Anfitriones</span>
              <h3 className="text-white text-xl font-semibold mt-1 mb-3">Alquila con seguridad y legalidad</h3>
              <Link
                to="/registro-anfitrion"
                className="inline-flex items-center gap-2 bg-gold-gradient text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap font-body"
              >
                Registrarme como Anfitrión
                <i className="ri-arrow-right-line"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
