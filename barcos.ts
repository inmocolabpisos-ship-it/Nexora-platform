export interface Barco {
  id: string;
  nombre: string;
  tipo: "velero" | "catamarán" | "lancha" | "yate" | "barco_motor";
  descripcion: string;
  eslora: number;
  capacidad: number;
  cabinas: number;
  banos: number;
  precio_dia: number;
  precio_medio_dia: number;
  ubicacion: string;
  puerto: string;
  lat: number;
  lng: number;
  fotos: string[];
  caracteristicas: string[];
  incluye: string[];
  disponible: boolean;
  tripulacion: boolean;
  rating: number;
  num_resenas: number;
}

export const barcosData: Barco[] = [
  {
    id: "cat-001",
    nombre: "Catamarán Nexura Azul",
    tipo: "catamarán",
    descripcion: "Espectacular catamarán de 14 metros ideal para grupos y familias. Navega por las aguas cristalinas del Mediterráneo con total comodidad. Equipado con todo lo necesario para una experiencia de lujo en alta mar.",
    eslora: 14,
    capacidad: 12,
    cabinas: 4,
    banos: 2,
    precio_dia: 1200,
    precio_medio_dia: 650,
    ubicacion: "Marbella, Málaga",
    puerto: "Puerto Banús",
    lat: 36.4867,
    lng: -4.9534,
    fotos: [
      "https://readdy.ai/api/search-image?query=luxury%20catamaran%20sailing%20mediterranean%20sea%20blue%20water%20white%20hull%20elegant%20yacht%20charter%20vacation&width=1200&height=800&seq=cat001a&orientation=landscape",
      "https://readdy.ai/api/search-image?query=catamaran%20interior%20luxury%20cabin%20bedroom%20white%20elegant%20nautical%20decor&width=800&height=600&seq=cat001b&orientation=landscape",
      "https://readdy.ai/api/search-image?query=catamaran%20deck%20sunbathing%20area%20luxury%20yacht%20charter%20mediterranean&width=800&height=600&seq=cat001c&orientation=landscape",
      "https://readdy.ai/api/search-image?query=catamaran%20cockpit%20helm%20navigation%20sailing%20luxury&width=800&height=600&seq=cat001d&orientation=landscape",
      "https://readdy.ai/api/search-image?query=catamaran%20saloon%20dining%20area%20luxury%20interior%20white%20wood&width=800&height=600&seq=cat001e&orientation=landscape",
    ],
    caracteristicas: ["GPS y carta náutica", "Motor auxiliar 2x55CV", "Equipo de snorkel", "Kayak a bordo", "Barbacoa de gas", "Altavoces Bluetooth", "Nevera 200L", "Ducha de agua dulce"],
    incluye: ["Patrón titulado", "Seguro a todo riesgo", "Combustible primer depósito", "Toallas de playa", "Bebidas de bienvenida"],
    disponible: true,
    tripulacion: true,
    rating: 4.9,
    num_resenas: 47,
  },
  {
    id: "vel-001",
    nombre: "Velero Tramontana",
    tipo: "velero",
    descripcion: "Elegante velero de 12 metros perfecto para amantes de la vela. Experiencia auténtica de navegación a vela con todas las comodidades modernas. Ideal para parejas y grupos pequeños que buscan aventura y tranquilidad.",
    eslora: 12,
    capacidad: 8,
    cabinas: 3,
    banos: 1,
    precio_dia: 850,
    precio_medio_dia: 480,
    ubicacion: "Estepona, Málaga",
    puerto: "Puerto de Estepona",
    lat: 36.4267,
    lng: -5.1467,
    fotos: [
      "https://readdy.ai/api/search-image?query=elegant%20sailing%20yacht%20sailboat%20white%20sails%20mediterranean%20sea%20blue%20sky%20luxury%20charter&width=1200&height=800&seq=vel001a&orientation=landscape",
      "https://readdy.ai/api/search-image?query=sailboat%20interior%20cabin%20luxury%20wood%20finish%20nautical%20elegant&width=800&height=600&seq=vel001b&orientation=landscape",
      "https://readdy.ai/api/search-image?query=sailing%20yacht%20deck%20cockpit%20helm%20wheel%20mediterranean&width=800&height=600&seq=vel001c&orientation=landscape",
      "https://readdy.ai/api/search-image?query=sailboat%20sunset%20golden%20hour%20mediterranean%20sea%20sailing&width=800&height=600&seq=vel001d&orientation=landscape",
    ],
    caracteristicas: ["Velas nuevas 2024", "Autopiloto", "VHF marino", "Equipo de buceo", "Nevera 120L", "Altavoces Bluetooth", "Ancla eléctrica"],
    incluye: ["Patrón titulado", "Seguro a todo riesgo", "Combustible", "Snacks y bebidas"],
    disponible: true,
    tripulacion: true,
    rating: 4.8,
    num_resenas: 32,
  },
  {
    id: "yate-001",
    nombre: "Yate Dorado Premium",
    tipo: "yate",
    descripcion: "Yate de motor de 18 metros con acabados de primera calidad. La máxima expresión del lujo náutico en la Costa del Sol. Perfecto para eventos privados, celebraciones y escapadas exclusivas.",
    eslora: 18,
    capacidad: 16,
    cabinas: 5,
    banos: 3,
    precio_dia: 2800,
    precio_medio_dia: 1500,
    ubicacion: "Marbella, Málaga",
    puerto: "Puerto Banús",
    lat: 36.4867,
    lng: -4.9534,
    fotos: [
      "https://readdy.ai/api/search-image?query=luxury%20motor%20yacht%20white%20gold%20trim%20mediterranean%20sea%20puerto%20banus%20marbella%20elegant&width=1200&height=800&seq=yate001a&orientation=landscape",
      "https://readdy.ai/api/search-image?query=luxury%20yacht%20interior%20salon%20living%20room%20white%20gold%20elegant%20nautical&width=800&height=600&seq=yate001b&orientation=landscape",
      "https://readdy.ai/api/search-image?query=yacht%20master%20cabin%20bedroom%20luxury%20white%20gold%20elegant&width=800&height=600&seq=yate001c&orientation=landscape",
      "https://readdy.ai/api/search-image?query=yacht%20sundeck%20jacuzzi%20luxury%20outdoor%20area%20mediterranean&width=800&height=600&seq=yate001d&orientation=landscape",
      "https://readdy.ai/api/search-image?query=yacht%20dining%20table%20luxury%20outdoor%20deck%20mediterranean%20sunset&width=800&height=600&seq=yate001e&orientation=landscape",
    ],
    caracteristicas: ["Jacuzzi en cubierta", "Cocina profesional", "Sistema de sonido premium", "Jet ski incluido", "Tender 3.5m", "Aire acondicionado", "TV satélite", "Wifi a bordo"],
    incluye: ["Patrón + marinero", "Seguro a todo riesgo", "Combustible", "Catering a bordo", "Bebidas premium", "Toallas y amenities"],
    disponible: true,
    tripulacion: true,
    rating: 5.0,
    num_resenas: 18,
  },
  {
    id: "cat-002",
    nombre: "Catamarán Sol y Mar",
    tipo: "catamarán",
    descripcion: "Catamarán moderno de 12 metros, ideal para excursiones de día y escapadas de fin de semana. Amplia cubierta para tomar el sol y disfrutar del mar Mediterráneo.",
    eslora: 12,
    capacidad: 10,
    cabinas: 3,
    banos: 2,
    precio_dia: 950,
    precio_medio_dia: 520,
    ubicacion: "Fuengirola, Málaga",
    puerto: "Puerto de Fuengirola",
    lat: 36.5397,
    lng: -4.6247,
    fotos: [
      "https://readdy.ai/api/search-image?query=modern%20catamaran%20sailing%20blue%20mediterranean%20sea%20sunshine%20white%20hull%20charter&width=1200&height=800&seq=cat002a&orientation=landscape",
      "https://readdy.ai/api/search-image?query=catamaran%20deck%20lounge%20area%20sunbathing%20cushions%20mediterranean&width=800&height=600&seq=cat002b&orientation=landscape",
      "https://readdy.ai/api/search-image?query=catamaran%20kitchen%20galley%20interior%20modern%20white&width=800&height=600&seq=cat002c&orientation=landscape",
    ],
    caracteristicas: ["Trampolín delantero", "Equipo de snorkel", "Nevera 150L", "Altavoces Bluetooth", "Ducha exterior", "Ancla eléctrica"],
    incluye: ["Patrón titulado", "Seguro a todo riesgo", "Combustible", "Bebidas de bienvenida"],
    disponible: true,
    tripulacion: true,
    rating: 4.7,
    num_resenas: 29,
  },
  {
    id: "lan-001",
    nombre: "Lancha Nexura Speed",
    tipo: "lancha",
    descripcion: "Lancha deportiva de 9 metros para excursiones rápidas y emocionantes. Perfecta para grupos pequeños que quieren explorar calas y playas de difícil acceso.",
    eslora: 9,
    capacidad: 8,
    cabinas: 0,
    banos: 1,
    precio_dia: 580,
    precio_medio_dia: 320,
    ubicacion: "Nerja, Málaga",
    puerto: "Puerto de Nerja",
    lat: 36.7467,
    lng: -3.8767,
    fotos: [
      "https://readdy.ai/api/search-image?query=fast%20speedboat%20motorboat%20blue%20sea%20mediterranean%20coast%20excursion%20charter&width=1200&height=800&seq=lan001a&orientation=landscape",
      "https://readdy.ai/api/search-image?query=speedboat%20deck%20seating%20area%20mediterranean%20cove%20crystal%20water&width=800&height=600&seq=lan001b&orientation=landscape",
    ],
    caracteristicas: ["Motor 200CV", "GPS", "Equipo de snorkel", "Nevera portátil", "Altavoces Bluetooth"],
    incluye: ["Patrón titulado", "Seguro a todo riesgo", "Combustible primer depósito"],
    disponible: true,
    tripulacion: false,
    rating: 4.6,
    num_resenas: 41,
  },
  {
    id: "vel-002",
    nombre: "Velero Brisa Marina",
    tipo: "velero",
    descripcion: "Velero clásico de 10 metros con encanto mediterráneo. Ideal para aprender a navegar o simplemente disfrutar del viento y el mar en compañía.",
    eslora: 10,
    capacidad: 6,
    cabinas: 2,
    banos: 1,
    precio_dia: 680,
    precio_medio_dia: 380,
    ubicacion: "Benalmádena, Málaga",
    puerto: "Puerto de Benalmádena",
    lat: 36.5967,
    lng: -4.5167,
    fotos: [
      "https://readdy.ai/api/search-image?query=classic%20sailing%20yacht%20sailboat%20white%20sails%20blue%20sea%20mediterranean%20elegant%20charter&width=1200&height=800&seq=vel002a&orientation=landscape",
      "https://readdy.ai/api/search-image?query=sailboat%20interior%20cozy%20cabin%20wood%20finish%20nautical&width=800&height=600&seq=vel002b&orientation=landscape",
    ],
    caracteristicas: ["Velas en perfecto estado", "VHF marino", "GPS", "Nevera 80L", "Equipo de seguridad completo"],
    incluye: ["Patrón titulado", "Seguro a todo riesgo", "Combustible"],
    disponible: true,
    tripulacion: true,
    rating: 4.5,
    num_resenas: 23,
  },
];

export const tipoLabels: Record<string, string> = {
  "catamarán": "Catamarán",
  "velero": "Velero",
  "yate": "Yate",
  "lancha": "Lancha",
  "barco_motor": "Barco a Motor",
};
