export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "María García",
      role: "Huésped verificada",
      location: "Madrid, España",
      text: "El proceso de registro fue increíblemente sencillo. En menos de 5 minutos tenía mi identidad verificada y podía reservar mi villa en Ibiza. La plataforma transmite mucha confianza.",
      avatar: "https://readdy.ai/api/search-image?query=professional%20woman%20portrait%20smiling%20confident%2035%20years%20old%20spanish%20natural%20light%20clean%20background&width=80&height=80&seq=avatar001&orientation=squarish",
      rating: 5,
    },
    {
      name: "Carlos Martínez",
      role: "Anfitrión certificado",
      location: "Marbella, Málaga",
      text: "Como anfitrión, me da mucha tranquilidad saber que todos mis huéspedes están verificados. El panel de administración es muy intuitivo y el cumplimiento con SES HOSPEDAJE es automático.",
      avatar: "https://readdy.ai/api/search-image?query=professional%20man%20portrait%20smiling%20confident%2045%20years%20old%20spanish%20natural%20light%20clean%20background&width=80&height=80&seq=avatar002&orientation=squarish",
      rating: 5,
    },
    {
      name: "Ana Rodríguez",
      role: "Huésped verificada",
      location: "Barcelona, España",
      text: "Nunca había visto una plataforma tan elegante y segura. La captura del DNI con la cámara del móvil fue muy fácil. Totalmente recomendable para viajes de lujo.",
      avatar: "https://readdy.ai/api/search-image?query=professional%20woman%20portrait%20smiling%20elegant%2028%20years%20old%20spanish%20natural%20light%20clean%20background&width=80&height=80&seq=avatar003&orientation=squarish",
      rating: 5,
    },
  ];

  return (
    <section className="py-24 bg-cream-50">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="text-center mb-16">
          <span className="text-gold-600 text-xs font-semibold tracking-widest uppercase font-body">Testimonios</span>
          <h2 className="text-3xl md:text-4xl font-light text-charcoal-900 mt-3 mb-4">
            Lo que dicen nuestros <strong className="font-semibold">miembros</strong>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl p-7 border border-gold-100">
              <div className="flex gap-1 mb-5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <i key={i} className="ri-star-fill text-gold-500 text-sm"></i>
                ))}
              </div>
              <p className="text-charcoal-600 text-sm leading-relaxed mb-6 italic font-body">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-11 h-11 rounded-full object-cover object-top"
                />
                <div>
                  <div className="text-charcoal-900 font-semibold text-sm font-body">{t.name}</div>
                  <div className="text-charcoal-400 text-xs font-body">{t.role} · {t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
