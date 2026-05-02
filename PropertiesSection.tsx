import { Link } from "react-router-dom";

export default function PropertiesSection() {
  const properties = [
    {
      title: "Villa Mediterránea",
      location: "Ibiza, Baleares",
      price: "€850/noche",
      beds: 5,
      baths: 4,
      guests: 10,
      tag: "Verificado",
      img: "https://readdy.ai/api/search-image?query=luxury%20mediterranean%20villa%20ibiza%20white%20architecture%20infinity%20pool%20sea%20view%20sunset%20golden%20hour%20exterior&width=600&height=400&seq=prop001&orientation=landscape",
    },
    {
      title: "Ático de Lujo",
      location: "Marbella, Málaga",
      price: "€420/noche",
      beds: 3,
      baths: 2,
      guests: 6,
      tag: "Premium",
      img: "https://readdy.ai/api/search-image?query=luxury%20penthouse%20apartment%20marbella%20terrace%20sea%20view%20modern%20interior%20design%20elegant%20living%20room&width=600&height=400&seq=prop002&orientation=landscape",
    },
    {
      title: "Finca Rural Exclusiva",
      location: "Ronda, Málaga",
      price: "€680/noche",
      beds: 6,
      baths: 5,
      guests: 12,
      tag: "Exclusivo",
      img: "https://readdy.ai/api/search-image?query=exclusive%20rural%20finca%20andalusia%20spain%20countryside%20luxury%20pool%20olive%20trees%20warm%20sunset%20architecture&width=600&height=400&seq=prop003&orientation=landscape",
    },
  ];

  return (
    <section className="py-24 bg-cream-100">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-amber-600 text-xs font-semibold tracking-widest uppercase">Propiedades destacadas</span>
            <h2 className="text-3xl md:text-4xl font-light text-stone-900 mt-3">
              Alojamientos <strong className="font-semibold">verificados</strong>
            </h2>
          </div>
          <Link to="/propiedades" className="text-gold-600 text-sm font-medium flex items-center gap-1 hover:text-gold-800 transition-colors cursor-pointer whitespace-nowrap font-body">
            Ver todos <i className="ri-arrow-right-line"></i>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-product-shop>
          {properties.map((p) => (
            <div key={p.title} className="bg-white rounded-2xl overflow-hidden border border-gold-100 group cursor-pointer hover:-translate-y-0.5 transition-transform duration-200">
              <div className="relative overflow-hidden h-52">
                <img
                  src={p.img}
                  alt={p.title}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 backdrop-blur-sm text-charcoal-800 text-xs font-semibold px-3 py-1 rounded-full font-body">
                    {p.tag}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <button className="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full text-stone-600 hover:text-rose-500 transition-colors cursor-pointer">
                    <i className="ri-heart-line text-sm"></i>
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-charcoal-900 font-semibold text-sm font-body">{p.title}</h3>
                  <span className="text-gold-600 font-bold text-sm whitespace-nowrap ml-2 font-body">{p.price}</span>
                </div>
                <div className="flex items-center gap-1 text-charcoal-400 text-xs mb-4 font-body">
                  <i className="ri-map-pin-line"></i>
                  {p.location}
                </div>
                <div className="flex items-center gap-4 text-charcoal-500 text-xs border-t border-gold-100 pt-4 font-body">
                  <span className="flex items-center gap-1"><i className="ri-hotel-bed-line"></i> {p.beds} hab.</span>
                  <span className="flex items-center gap-1"><i className="ri-drop-line"></i> {p.baths} baños</span>
                  <span className="flex items-center gap-1"><i className="ri-group-line"></i> {p.guests} huésp.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
