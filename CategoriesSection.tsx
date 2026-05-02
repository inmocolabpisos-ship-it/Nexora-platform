import { Link } from "react-router-dom";

const categories = [
  {
    title: "Propiedades",
    description: "Villas, áticos y fincas exclusivas verificadas por NEXURA",
    link: "/propiedades",
    icon: "ri-home-4-line",
    badge: "Más de 120 propiedades",
    stats: ["Villas", "Áticos", "Fincas", "Apartamentos"],
    color: "from-amber-50 to-orange-50",
    accent: "text-amber-600",
    border: "border-amber-100",
    badgeBg: "bg-amber-50 text-amber-700",
    img: "https://readdy.ai/api/search-image?query=luxury%20villa%20andalusia%20spain%20white%20architecture%20pool%20terrace%20sea%20view%20warm%20golden%20light%20minimalist%20elegant&width=800&height=500&seq=cat-prop-01&orientation=landscape",
  },
  {
    title: "Barcos & Catamaranes",
    description: "Alquila embarcaciones premium para navegar el Mediterráneo",
    link: "/barcos",
    icon: "ri-ship-line",
    badge: "Flota de 18 embarcaciones",
    stats: ["Catamaranes", "Veleros", "Yates", "Lanchas"],
    color: "from-sky-50 to-cyan-50",
    accent: "text-sky-600",
    border: "border-sky-100",
    badgeBg: "bg-sky-50 text-sky-700",
    img: "https://readdy.ai/api/search-image?query=luxury%20catamaran%20sailing%20mediterranean%20sea%20blue%20water%20clear%20sky%20white%20sails%20sunny%20day%20aerial%20view&width=800&height=500&seq=cat-barco-01&orientation=landscape",
  },
  {
    title: "Hostales",
    description: "Alojamientos con encanto, desayuno y atención personalizada",
    link: "/hostales",
    icon: "ri-building-2-line",
    badge: "6 alojamientos",
    stats: ["Hostales", "Pensiones", "Boutique", "Apartahoteles"],
    color: "from-rose-50 to-pink-50",
    accent: "text-rose-600",
    border: "border-rose-100",
    badgeBg: "bg-rose-50 text-rose-700",
    img: "https://readdy.ai/api/search-image?query=charming%20boutique%20hostal%20spain%20andalusia%20cozy%20interior%20warm%20lighting%20elegant%20reception%20lobby%20mediterranean%20style&width=800&height=500&seq=cat-hostal-01&orientation=landscape",
  },
  {
    title: "Camping & Glamping",
    description: "Naturaleza, aventura y confort en los mejores enclaves naturales",
    link: "/camping",
    icon: "ri-tent-line",
    badge: "4 campings",
    stats: ["Glamping", "Parcelas", "Bungalows", "Autocaravanas"],
    color: "from-emerald-50 to-green-50",
    accent: "text-emerald-600",
    border: "border-emerald-100",
    badgeBg: "bg-emerald-50 text-emerald-700",
    img: "https://readdy.ai/api/search-image?query=luxury%20glamping%20tent%20nature%20spain%20mountains%20forest%20sunset%20warm%20lights%20cozy%20outdoor%20camping%20premium%20setup&width=800&height=500&seq=cat-camp-01&orientation=landscape",
  },
];

export default function CategoriesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-amber-600 text-xs font-semibold tracking-widest uppercase">Explora NEXURA</span>
          <h2 className="text-3xl md:text-4xl font-light text-stone-900 mt-3">
            Todos los <strong className="font-semibold">alojamientos</strong>
          </h2>
          <p className="text-stone-500 text-sm mt-4 max-w-xl mx-auto leading-relaxed">
            Desde villas de lujo hasta glamping en la naturaleza — encuentra el alojamiento perfecto para cada experiencia
          </p>
        </div>

        {/* Grid de categorías */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.title}
              to={cat.link}
              className="group relative overflow-hidden rounded-2xl border border-stone-100 hover:-translate-y-1 transition-all duration-300 cursor-pointer block"
            >
              {/* Imagen de fondo */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                {/* Badge superior */}
                <div className="absolute top-4 left-4">
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm bg-white/90 text-stone-700`}>
                    {cat.badge}
                  </span>
                </div>

                {/* Icono */}
                <div className="absolute top-4 right-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full">
                    <i className={`${cat.icon} text-lg ${cat.accent}`}></i>
                  </div>
                </div>

                {/* Título sobre imagen */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-semibold text-xl">{cat.title}</h3>
                  <p className="text-white/80 text-xs mt-1">{cat.description}</p>
                </div>
              </div>

              {/* Footer de la card */}
              <div className="bg-white px-5 py-4 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {cat.stats.map((s) => (
                    <span key={s} className={`text-xs px-2.5 py-1 rounded-full font-medium ${cat.badgeBg}`}>
                      {s}
                    </span>
                  ))}
                </div>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full border ${cat.border} ${cat.accent} group-hover:bg-amber-50 transition-colors flex-shrink-0 ml-3`}>
                  <i className="ri-arrow-right-line text-sm"></i>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA inferior */}
        <div className="mt-12 text-center">
          <p className="text-stone-400 text-sm mb-4">¿No encuentras lo que buscas?</p>
          <a
            href="https://wa.me/34614976736?text=Hola%2C%20busco%20un%20alojamiento%20especial%20en%20NEXURA"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-stone-900 text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-whatsapp-line text-green-400"></i>
            Consulta personalizada por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
