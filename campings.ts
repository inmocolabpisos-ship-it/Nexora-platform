export interface Camping {
  id: string;
  nombre: string;
  tipo: "camping" | "glamping" | "autocaravanas" | "bungalows";
  descripcion: string;
  categoria: number; // 1-5 estrellas
  capacidad_total: number;
  ubicacion: string;
  direccion: string;
  lat: number;
  lng: number;
  fotos: string[];
  servicios: string[];
  parcelas: ParcelaTipo[];
  incluye: string[];
  disponible: boolean;
  rating: number;
  num_resenas: number;
  piscina: boolean;
  playa_cercana: boolean;
  animales: boolean;
}

export interface ParcelaTipo {
  key: string;
  label: string;
  descripcion: string;
  capacidad: number;
  precio_noche: number;
  superficie: string;
  tipo_alojamiento: string;
  disponibles: number;
}

export const campingsData: Camping[] = [
  {
    id: "cam-001",
    nombre: "Camping Nexura Nature",
    tipo: "glamping",
    descripcion: "El camping más exclusivo de la Costa del Sol. Combina la experiencia de estar en contacto con la naturaleza con el confort de un hotel de lujo. Tiendas de campaña premium, bungalows de madera y zonas de autocaravana con todas las comodidades. A 200 metros de la playa.",
    categoria: 4,
    capacidad_total: 80,
    ubicacion: "Mijas Costa, Málaga",
    direccion: "Ctra. Mijas-Fuengirola km 3, Mijas Costa",
    lat: 36.5167,
    lng: -4.6467,
    fotos: [
      "https://readdy.ai/api/search-image?query=luxury%20glamping%20camping%20Mediterranean%20coast%20Spain%20pine%20trees%20sea%20view%20tents%20bungalows%20premium&width=1200&height=800&seq=cam001a&orientation=landscape",
      "https://readdy.ai/api/search-image?query=glamping%20luxury%20tent%20interior%20bed%20white%20linen%20Mediterranean%20nature&width=800&height=600&seq=cam001b&orientation=landscape",
      "https://readdy.ai/api/search-image?query=camping%20bungalow%20wooden%20cabin%20Mediterranean%20forest%20Spain%20cozy&width=800&height=600&seq=cam001c&orientation=landscape",
      "https://readdy.ai/api/search-image?query=camping%20pool%20area%20Mediterranean%20Spain%20summer%20pine%20trees&width=800&height=600&seq=cam001d&orientation=landscape",
      "https://readdy.ai/api/search-image?query=camping%20beach%20access%20Mediterranean%20Spain%20summer%20sunset&width=800&height=600&seq=cam001e&orientation=landscape",
    ],
    servicios: ["WiFi en zonas comunes", "Piscina", "Supermercado", "Restaurante", "Bar", "Duchas calientes", "Lavandería", "Parque infantil", "Animación", "Alquiler de bicicletas", "Acceso directo a playa"],
    parcelas: [
      { key: "tienda", label: "Parcela Tienda", descripcion: "Parcela para tienda de campaña con toma de corriente", capacidad: 4, precio_noche: 25, superficie: "80m²", tipo_alojamiento: "Tienda propia", disponibles: 20 },
      { key: "autocaravana", label: "Parcela Autocaravana", descripcion: "Parcela con conexión eléctrica y agua para autocaravana", capacidad: 4, precio_noche: 35, superficie: "100m²", tipo_alojamiento: "Autocaravana propia", disponibles: 15 },
      { key: "bungalow", label: "Bungalow Madera", descripcion: "Bungalow de madera equipado con todo lo necesario", capacidad: 4, precio_noche: 65, superficie: "35m²", tipo_alojamiento: "Bungalow incluido", disponibles: 10 },
      { key: "glamping_tent", label: "Glamping Premium", descripcion: "Tienda de lujo con cama doble, baño privado y terraza", capacidad: 2, precio_noche: 95, superficie: "25m²", tipo_alojamiento: "Tienda premium incluida", disponibles: 5 },
    ],
    incluye: ["Acceso a piscina", "Duchas y aseos", "Zona de barbacoa", "Parking incluido"],
    disponible: true,
    rating: 4.8,
    num_resenas: 156,
    piscina: true,
    playa_cercana: true,
    animales: true,
  },
  {
    id: "cam-002",
    nombre: "Camping Sierra Verde",
    tipo: "camping",
    descripcion: "Camping familiar en plena naturaleza de la Sierra de las Nieves. Rodeado de pinos centenarios y con vistas espectaculares a la montaña. El lugar ideal para los amantes del senderismo, la escalada y el turismo de naturaleza. Ambiente tranquilo y familiar.",
    categoria: 3,
    capacidad_total: 60,
    ubicacion: "Ronda, Málaga",
    direccion: "Ctra. Ronda-San Pedro km 8",
    lat: 36.7467,
    lng: -5.1667,
    fotos: [
      "https://readdy.ai/api/search-image?query=mountain%20camping%20pine%20forest%20Spain%20Sierra%20Nevada%20nature%20tents%20green%20landscape&width=1200&height=800&seq=cam002a&orientation=landscape",
      "https://readdy.ai/api/search-image?query=camping%20mountain%20bungalow%20wooden%20cabin%20forest%20Spain%20nature&width=800&height=600&seq=cam002b&orientation=landscape",
      "https://readdy.ai/api/search-image?query=camping%20mountain%20view%20Spain%20Sierra%20nature%20hiking%20landscape&width=800&height=600&seq=cam002c&orientation=landscape",
      "https://readdy.ai/api/search-image?query=camping%20facilities%20shower%20block%20clean%20mountain%20Spain&width=800&height=600&seq=cam002d&orientation=landscape",
    ],
    servicios: ["WiFi en recepción", "Bar-restaurante", "Duchas calientes", "Lavandería", "Tienda de camping", "Zona de barbacoa", "Rutas de senderismo", "Alquiler de material"],
    parcelas: [
      { key: "tienda", label: "Parcela Tienda", descripcion: "Parcela sombreada bajo los pinos", capacidad: 4, precio_noche: 20, superficie: "70m²", tipo_alojamiento: "Tienda propia", disponibles: 25 },
      { key: "autocaravana", label: "Parcela Autocaravana", descripcion: "Parcela con conexión eléctrica", capacidad: 4, precio_noche: 28, superficie: "90m²", tipo_alojamiento: "Autocaravana propia", disponibles: 12 },
      { key: "bungalow", label: "Bungalow", descripcion: "Bungalow de madera con cocina básica", capacidad: 4, precio_noche: 55, superficie: "30m²", tipo_alojamiento: "Bungalow incluido", disponibles: 8 },
    ],
    incluye: ["Duchas y aseos", "Zona de barbacoa", "Parking incluido", "Acceso a rutas"],
    disponible: true,
    rating: 4.6,
    num_resenas: 98,
    piscina: false,
    playa_cercana: false,
    animales: true,
  },
  {
    id: "cam-003",
    nombre: "Glamping Nexura Sunset",
    tipo: "glamping",
    descripcion: "Experiencia de glamping de lujo con vistas al atardecer sobre el Mediterráneo. Tiendas safari premium con cama king, baño privado con ducha de lluvia y terraza con hamaca. Desayuno incluido servido en tu tienda. La experiencia más romántica de la Costa del Sol.",
    categoria: 5,
    capacidad_total: 16,
    ubicacion: "Casares, Málaga",
    direccion: "Finca El Mirador, Casares",
    lat: 36.4367,
    lng: -5.2667,
    fotos: [
      "https://readdy.ai/api/search-image?query=luxury%20glamping%20safari%20tent%20sunset%20Mediterranean%20sea%20view%20Spain%20romantic%20premium&width=1200&height=800&seq=cam003a&orientation=landscape",
      "https://readdy.ai/api/search-image?query=glamping%20luxury%20tent%20interior%20king%20bed%20white%20linen%20private%20bathroom%20premium&width=800&height=600&seq=cam003b&orientation=landscape",
      "https://readdy.ai/api/search-image?query=glamping%20terrace%20hammock%20sea%20view%20Mediterranean%20sunset%20romantic&width=800&height=600&seq=cam003c&orientation=landscape",
      "https://readdy.ai/api/search-image?query=glamping%20breakfast%20tray%20bed%20morning%20luxury%20nature&width=800&height=600&seq=cam003d&orientation=landscape",
      "https://readdy.ai/api/search-image?query=glamping%20outdoor%20shower%20nature%20luxury%20premium%20Mediterranean&width=800&height=600&seq=cam003e&orientation=landscape",
    ],
    servicios: ["Desayuno incluido", "WiFi premium", "Spa al aire libre", "Yoga matutino", "Cenas privadas", "Traslados", "Jacuzzi exterior", "Servicio de habitaciones"],
    parcelas: [
      { key: "safari_doble", label: "Safari Doble", descripcion: "Tienda safari para dos con todas las comodidades", capacidad: 2, precio_noche: 145, superficie: "30m²", tipo_alojamiento: "Tienda safari incluida", disponibles: 6 },
      { key: "safari_familiar", label: "Safari Familiar", descripcion: "Tienda safari amplia para familias", capacidad: 4, precio_noche: 195, superficie: "45m²", tipo_alojamiento: "Tienda safari incluida", disponibles: 4 },
      { key: "villa_glamping", label: "Villa Glamping", descripcion: "Nuestra experiencia más exclusiva con piscina privada", capacidad: 2, precio_noche: 295, superficie: "60m²", tipo_alojamiento: "Villa con piscina incluida", disponibles: 2 },
    ],
    incluye: ["Desayuno gourmet", "Acceso al spa", "WiFi premium", "Ropa de cama de lujo", "Amenities premium"],
    disponible: true,
    rating: 5.0,
    num_resenas: 34,
    piscina: true,
    playa_cercana: false,
    animales: false,
  },
  {
    id: "cam-004",
    nombre: "Camping Playa Nerja",
    tipo: "camping",
    descripcion: "Camping a pie de playa en Nerja, uno de los enclaves más bonitos de la Costa del Sol. Parcelas con sombra natural, bungalows modernos y acceso directo a la playa. Ideal para familias que quieren disfrutar del mar sin renunciar a la naturaleza.",
    categoria: 3,
    capacidad_total: 100,
    ubicacion: "Nerja, Málaga",
    direccion: "Playa de Burriana s/n, Nerja",
    lat: 36.7367,
    lng: -3.8867,
    fotos: [
      "https://readdy.ai/api/search-image?query=beachfront%20camping%20Nerja%20Spain%20Mediterranean%20sea%20tents%20bungalows%20palm%20trees&width=1200&height=800&seq=cam004a&orientation=landscape",
      "https://readdy.ai/api/search-image?query=camping%20bungalow%20beach%20access%20Mediterranean%20Spain%20summer&width=800&height=600&seq=cam004b&orientation=landscape",
      "https://readdy.ai/api/search-image?query=camping%20beach%20Nerja%20Spain%20Mediterranean%20crystal%20water&width=800&height=600&seq=cam004c&orientation=landscape",
    ],
    servicios: ["WiFi en zonas comunes", "Acceso directo a playa", "Supermercado", "Bar-restaurante", "Duchas calientes", "Lavandería", "Parque infantil", "Alquiler de kayaks"],
    parcelas: [
      { key: "tienda", label: "Parcela Tienda", descripcion: "Parcela con sombra y toma de corriente", capacidad: 4, precio_noche: 22, superficie: "75m²", tipo_alojamiento: "Tienda propia", disponibles: 40 },
      { key: "autocaravana", label: "Parcela Autocaravana", descripcion: "Parcela con conexión completa", capacidad: 4, precio_noche: 30, superficie: "95m²", tipo_alojamiento: "Autocaravana propia", disponibles: 20 },
      { key: "bungalow", label: "Bungalow Vista Mar", descripcion: "Bungalow con vistas al Mediterráneo", capacidad: 4, precio_noche: 72, superficie: "32m²", tipo_alojamiento: "Bungalow incluido", disponibles: 12 },
    ],
    incluye: ["Acceso a playa", "Duchas y aseos", "Parking incluido"],
    disponible: true,
    rating: 4.5,
    num_resenas: 203,
    piscina: false,
    playa_cercana: true,
    animales: true,
  },
];

export const tipoCampingLabels: Record<string, string> = {
  camping: "Camping",
  glamping: "Glamping",
  autocaravanas: "Autocaravanas",
  bungalows: "Bungalows",
};
