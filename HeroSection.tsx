import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://readdy.ai/api/search-image?query=luxury%20villa%20swimming%20pool%20mediterranean%20architecture%20golden%20hour%20warm%20light%20elegant%20vacation%20rental%20property%20exterior%20stunning%20view&width=1920&height=1080&seq=hero001&orientation=landscape"
          alt="Luxury vacation rental"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full text-center px-6 md:px-10 max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white leading-tight mb-6 tracking-tight">
          Alquiler Vacacional
          <br />
          <span className="font-semibold italic text-gold-300">de Lujo</span>
        </h1>

        <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Regístrate como huésped o anfitrión con verificación de identidad segura. 
          Cumplimiento total con la normativa española de alojamientos turísticos.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/registro-huesped"
            className="w-full sm:w-auto px-8 py-4 bg-white/95 text-charcoal-900 font-semibold rounded-full hover:bg-white transition-all duration-200 cursor-pointer whitespace-nowrap text-sm tracking-wide font-body"
          >
            <i className="ri-user-line mr-2"></i>
            Registrarme como Huésped
          </Link>
          <Link
            to="/registro-anfitrion"
            className="w-full sm:w-auto px-8 py-4 bg-gold-gradient text-white font-semibold rounded-full hover:opacity-90 transition-all duration-200 cursor-pointer whitespace-nowrap text-sm tracking-wide font-body"
          >
            <i className="ri-home-4-line mr-2"></i>
            Registrarme como Anfitrión
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mt-16">
          {[
            { value: "2.400+", label: "Propiedades verificadas" },
            { value: "18.000+", label: "Huéspedes registrados" },
            { value: "100%", label: "Cumplimiento SES" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-white/60 text-xs mt-1 tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-white/50 text-xs tracking-widest uppercase">Descubrir</span>
        <i className="ri-arrow-down-line text-white/50 text-lg"></i>
      </div>
    </section>
  );
}
