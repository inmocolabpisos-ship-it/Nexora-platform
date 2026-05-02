export interface Hostal {
  id: string;
  nombre: string;
  tipo: "hostal" | "pension" | "hotel_boutique" | "apartahotel";
  descripcion: string;
  estrellas: number;
  capacidad_total: number;
  ubicacion: string;
  direccion: string;
  lat: number;
  lng: number;
  fotos: string[];
  servicios: string[];
  habitaciones: HabitacionTipo[];
  incluye: string[];
  disponible: boolean;
  rating: number;
  num_resenas: number;
  wifi: boolean;
  desayuno: boolean;
  parking: boolean;
}

export interface HabitacionTipo {
  key: string;
  label: string;
  descripcion: string;
  capacidad: number;
  precio_noche: number;
  camas: string;
  bano: "privado" | "compartido";
  disponibles: number;
}

export const hostalesData: Hostal[] = [
  {
    id: "hos-001",
    nombre: "Hostal Nexura Marbella",
    tipo: "hostal",
    descripcion: "Acogedor hostal en el corazón de Marbella, a 5 minutos a pie de la playa y del casco antiguo. Habitaciones cuidadosamente decoradas con estilo mediterráneo moderno. Ambiente familiar y atención personalizada para que tu estancia sea perfecta.",
    estrellas: 3,
    capacidad_total: 24,
    ubicacion: "Marbella, Málaga",
    direccion: "Calle Ancha 12, Marbella",
    lat: 36.5101,
    lng: -4.8825,
    fotos: [
      "https://readdy.ai/api/search-image?query=charming%20boutique%20hostel%20mediterranean%20style%20white%20walls%20terracotta%20tiles%20courtyard%20Marbella%20Spain%20elegant%20cozy&width=1200&height=800&seq=hos001a&orientation=landscape",
      "https://readdy.ai/api/search-image?query=hostel%20double%20room%20mediterranean%20decor%20white%20linen%20wooden%20furniture%20bright%20window%20sea%20view&width=800&height=600&seq=hos001b&orientation=landscape",
      "https://readdy.ai/api/search-image?query=hostel%20common%20area%20lounge%20terrace%20mediterranean%20plants%20white%20walls%20cozy%20seating&width=800&height=600&seq=hos001c&orientation=landscape",
      "https://readdy.ai/api/search-image?query=hostel%20breakfast%20area%20dining%20room%20mediterranean%20style%20bright%20morning%20light&width=800&height=600&seq=hos001d&orientation=landscape",
      "https://readdy.ai/api/search-image?query=hostel%20rooftop%20terrace%20sea%20view%20Marbella%20Spain%20summer%20evening&width=800&height=600&seq=hos001e&orientation=landscape",
    ],
    servicios: ["WiFi gratuito", "Recepción 24h", "Consigna de equipaje", "Cambio de moneda", "Información turística", "Lavandería", "Terraza con vistas", "Bar en terraza"],
    habitaciones: [
      { key: "individual", label: "Individual", descripcion: "Habitación acogedora para viajero solo", capacidad: 1, precio_noche: 55, camas: "1 cama individual", bano: "compartido", disponibles: 4 },
      { key: "doble", label: "Doble", descripcion: "Amplia habitación para dos personas", capacidad: 2, precio_noche: 85, camas: "1 cama doble", bano: "privado", disponibles: 6 },
      { key: "triple", label: "Triple", descripcion: "Perfecta para grupos de tres", capacidad: 3, precio_noche: 110, camas: "1 doble + 1 individual", bano: "privado", disponibles: 3 },
      { key: "suite", label: "Suite Superior", descripcion: "Nuestra habitación más exclusiva con vistas al mar", capacidad: 2, precio_noche: 120, camas: "1 cama king size", bano: "privado", disponibles: 2 },
    ],
    incluye: ["Ropa de cama y toallas", "Desayuno continental", "WiFi de alta velocidad", "Acceso a terraza"],
    disponible: true,
    rating: 4.7,
    num_resenas: 89,
    wifi: true,
    desayuno: true,
    parking: false,
  },
  {
    id: "hos-002",
    nombre: "Hostal Sol Mediterráneo",
    tipo: "hostal",
    descripcion: "Hostal familiar con más de 20 años de experiencia en la Costa del Sol. Situado en primera línea de playa en Torremolinos, ofrece vistas espectaculares al Mediterráneo desde todas sus habitaciones. El lugar perfecto para disfrutar del sol y la playa.",
    estrellas: 2,
    capacidad_total: 18,
    ubicacion: "Torremolinos, Málaga",
    direccion: "Paseo Marítimo 45, Torremolinos",
    lat: 36.6213,
    lng: -4.4997,
    fotos: [
      "https://readdy.ai/api/search-image?query=beachfront%20hostel%20Mediterranean%20sea%20view%20Torremolinos%20Spain%20white%20building%20balconies%20sunny&width=1200&height=800&seq=hos002a&orientation=landscape",
      "https://readdy.ai/api/search-image?query=hostel%20sea%20view%20room%20balcony%20Mediterranean%20blue%20water%20white%20decor&width=800&height=600&seq=hos002b&orientation=landscape",
      "https://readdy.ai/api/search-image?query=hostel%20pool%20area%20Mediterranean%20terrace%20sun%20loungers%20sea%20view&width=800&height=600&seq=hos002c&orientation=landscape",
      "https://readdy.ai/api/search-image?query=hostel%20reception%20lobby%20Mediterranean%20style%20warm%20colors%20welcoming&width=800&height=600&seq=hos002d&orientation=landscape",
    ],
    servicios: ["WiFi gratuito", "Piscina exterior", "Bar junto a la piscina", "Recepción 24h", "Parking privado", "Servicio de playa", "Alquiler de bicicletas"],
    habitaciones: [
      { key: "individual", label: "Individual", descripcion: "Habitación sencilla con vistas al jardín", capacidad: 1, precio_noche: 45, camas: "1 cama individual", bano: "compartido", disponibles: 3 },
      { key: "doble", label: "Doble Vista Mar", descripcion: "Habitación doble con balcón y vistas al mar", capacidad: 2, precio_noche: 75, camas: "1 cama doble", bano: "privado", disponibles: 5 },
      { key: "triple", label: "Triple", descripcion: "Habitación familiar con vistas al jardín", capacidad: 3, precio_noche: 95, camas: "1 doble + 1 individual", bano: "privado", disponibles: 2 },
    ],
    incluye: ["Ropa de cama", "Toallas de playa", "WiFi", "Acceso a piscina"],
    disponible: true,
    rating: 4.5,
    num_resenas: 134,
    wifi: true,
    desayuno: false,
    parking: true,
  },
  {
    id: "hos-003",
    nombre: "Pensión La Andaluza",
    tipo: "pension",
    descripcion: "Encantadora pensión en el centro histórico de Nerja, a pasos de la famosa Balcón de Europa. Ambiente auténticamente andaluz con patio interior lleno de flores y azulejos tradicionales. La opción más económica y con más encanto de la zona.",
    estrellas: 2,
    capacidad_total: 12,
    ubicacion: "Nerja, Málaga",
    direccion: "Calle Pintada 8, Nerja",
    lat: 36.7467,
    lng: -3.8767,
    fotos: [
      "https://readdy.ai/api/search-image?query=traditional%20Andalusian%20pension%20guesthouse%20white%20walls%20flowers%20patio%20tiles%20Nerja%20Spain%20charming&width=1200&height=800&seq=hos003a&orientation=landscape",
      "https://readdy.ai/api/search-image?query=traditional%20Spanish%20room%20simple%20clean%20white%20walls%20wooden%20furniture%20Andalusia&width=800&height=600&seq=hos003b&orientation=landscape",
      "https://readdy.ai/api/search-image?query=Andalusian%20courtyard%20patio%20flowers%20tiles%20fountain%20traditional%20Spain&width=800&height=600&seq=hos003c&orientation=landscape",
    ],
    servicios: ["WiFi gratuito", "Patio interior", "Cocina compartida", "Información turística", "Consigna de equipaje"],
    habitaciones: [
      { key: "individual", label: "Individual", descripcion: "Habitación sencilla con encanto andaluz", capacidad: 1, precio_noche: 35, camas: "1 cama individual", bano: "compartido", disponibles: 3 },
      { key: "doble", label: "Doble", descripcion: "Habitación doble con vistas al patio", capacidad: 2, precio_noche: 60, camas: "1 cama doble", bano: "compartido", disponibles: 3 },
      { key: "familiar", label: "Familiar", descripcion: "Habitación amplia para familias", capacidad: 4, precio_noche: 90, camas: "2 camas dobles", bano: "privado", disponibles: 1 },
    ],
    incluye: ["Ropa de cama", "WiFi", "Acceso a cocina compartida"],
    disponible: true,
    rating: 4.6,
    num_resenas: 67,
    wifi: true,
    desayuno: false,
    parking: false,
  },
  {
    id: "hos-004",
    nombre: "Hotel Boutique Nexura Gold",
    tipo: "hotel_boutique",
    descripcion: "Exclusivo hotel boutique de 4 estrellas en Puerto Banús. Diseño contemporáneo de lujo con toques dorados y materiales premium. Cada habitación es una obra de arte. Servicio de concierge personalizado, spa y restaurante gourmet.",
    estrellas: 4,
    capacidad_total: 20,
    ubicacion: "Puerto Banús, Marbella",
    direccion: "Av. Julio Iglesias 12, Puerto Banús",
    lat: 36.4867,
    lng: -4.9534,
    fotos: [
      "https://readdy.ai/api/search-image?query=luxury%20boutique%20hotel%20gold%20black%20interior%20design%20Puerto%20Banus%20Marbella%20Spain%20elegant%20premium&width=1200&height=800&seq=hos004a&orientation=landscape",
      "https://readdy.ai/api/search-image?query=luxury%20hotel%20room%20gold%20black%20decor%20king%20bed%20premium%20amenities%20elegant&width=800&height=600&seq=hos004b&orientation=landscape",
      "https://readdy.ai/api/search-image?query=luxury%20hotel%20rooftop%20pool%20infinity%20sea%20view%20Marbella%20evening%20golden%20hour&width=800&height=600&seq=hos004c&orientation=landscape",
      "https://readdy.ai/api/search-image?query=luxury%20hotel%20spa%20wellness%20area%20premium%20marble%20gold%20accents&width=800&height=600&seq=hos004d&orientation=landscape",
      "https://readdy.ai/api/search-image?query=luxury%20hotel%20restaurant%20gourmet%20dining%20gold%20black%20elegant%20interior&width=800&height=600&seq=hos004e&orientation=landscape",
    ],
    servicios: ["WiFi premium", "Spa y wellness", "Restaurante gourmet", "Bar de cócteles", "Piscina infinity", "Concierge 24h", "Traslados privados", "Room service 24h", "Parking valet"],
    habitaciones: [
      { key: "deluxe", label: "Deluxe", descripcion: "Habitación premium con todas las comodidades", capacidad: 2, precio_noche: 180, camas: "1 cama king", bano: "privado", disponibles: 6 },
      { key: "junior_suite", label: "Junior Suite", descripcion: "Suite con sala de estar y terraza privada", capacidad: 2, precio_noche: 280, camas: "1 cama king", bano: "privado", disponibles: 3 },
      { key: "suite_premium", label: "Suite Premium", descripcion: "La experiencia más exclusiva con jacuzzi privado", capacidad: 2, precio_noche: 420, camas: "1 cama king size", bano: "privado", disponibles: 1 },
    ],
    incluye: ["Desayuno gourmet", "Acceso al spa", "WiFi premium", "Minibar incluido", "Amenities de lujo"],
    disponible: true,
    rating: 4.9,
    num_resenas: 43,
    wifi: true,
    desayuno: true,
    parking: true,
  },
  {
    id: "hos-005",
    nombre: "Hostal Playa Fuengirola",
    tipo: "hostal",
    descripcion: "Hostal moderno y funcional a 50 metros de la playa de Fuengirola. Ideal para viajeros que buscan comodidad a buen precio. Habitaciones luminosas con decoración contemporánea y todas las comodidades necesarias para una estancia perfecta.",
    estrellas: 2,
    capacidad_total: 16,
    ubicacion: "Fuengirola, Málaga",
    direccion: "Calle Larga 23, Fuengirola",
    lat: 36.5397,
    lng: -4.6247,
    fotos: [
      "https://readdy.ai/api/search-image?query=modern%20hostel%20near%20beach%20Fuengirola%20Spain%20contemporary%20clean%20white%20rooms%20bright&width=1200&height=800&seq=hos005a&orientation=landscape",
      "https://readdy.ai/api/search-image?query=modern%20hostel%20room%20clean%20white%20contemporary%20furniture%20bright%20natural%20light&width=800&height=600&seq=hos005b&orientation=landscape",
      "https://readdy.ai/api/search-image?query=hostel%20terrace%20beach%20view%20Fuengirola%20Spain%20summer&width=800&height=600&seq=hos005c&orientation=landscape",
    ],
    servicios: ["WiFi gratuito", "Recepción 24h", "Terraza", "Alquiler de bicicletas", "Consigna de equipaje", "Información turística"],
    habitaciones: [
      { key: "individual", label: "Individual", descripcion: "Habitación sencilla y funcional", capacidad: 1, precio_noche: 40, camas: "1 cama individual", bano: "compartido", disponibles: 4 },
      { key: "doble", label: "Doble", descripcion: "Habitación doble con baño privado", capacidad: 2, precio_noche: 68, camas: "1 cama doble", bano: "privado", disponibles: 5 },
      { key: "twin", label: "Twin", descripcion: "Habitación con dos camas individuales", capacidad: 2, precio_noche: 65, camas: "2 camas individuales", bano: "privado", disponibles: 3 },
    ],
    incluye: ["Ropa de cama y toallas", "WiFi", "Acceso a terraza"],
    disponible: true,
    rating: 4.4,
    num_resenas: 112,
    wifi: true,
    desayuno: false,
    parking: false,
  },
  {
    id: "hos-006",
    nombre: "Apartahotel Nexura Estepona",
    tipo: "apartahotel",
    descripcion: "Moderno apartahotel en Estepona con apartamentos totalmente equipados. Combina la comodidad de un hotel con la independencia de un apartamento. Cocina completa, salón y dormitorios separados. Ideal para estancias largas y familias.",
    estrellas: 3,
    capacidad_total: 30,
    ubicacion: "Estepona, Málaga",
    direccion: "Av. España 78, Estepona",
    lat: 36.4267,
    lng: -5.1467,
    fotos: [
      "https://readdy.ai/api/search-image?query=modern%20aparthotel%20Estepona%20Spain%20contemporary%20apartments%20pool%20garden%20Mediterranean&width=1200&height=800&seq=hos006a&orientation=landscape",
      "https://readdy.ai/api/search-image?query=apartment%20hotel%20living%20room%20kitchen%20modern%20white%20contemporary%20Spain&width=800&height=600&seq=hos006b&orientation=landscape",
      "https://readdy.ai/api/search-image?query=aparthotel%20pool%20garden%20Mediterranean%20Spain%20summer&width=800&height=600&seq=hos006c&orientation=landscape",
      "https://readdy.ai/api/search-image?query=apartment%20bedroom%20modern%20white%20clean%20contemporary%20Spain&width=800&height=600&seq=hos006d&orientation=landscape",
    ],
    servicios: ["WiFi gratuito", "Piscina comunitaria", "Parking privado", "Recepción 24h", "Lavandería", "Gimnasio", "Jardín"],
    habitaciones: [
      { key: "estudio", label: "Estudio", descripcion: "Estudio con cocina americana", capacidad: 2, precio_noche: 75, camas: "1 cama doble", bano: "privado", disponibles: 8 },
      { key: "apartamento_1hab", label: "Apartamento 1 hab.", descripcion: "Apartamento con dormitorio separado", capacidad: 3, precio_noche: 110, camas: "1 doble + sofá cama", bano: "privado", disponibles: 6 },
      { key: "apartamento_2hab", label: "Apartamento 2 hab.", descripcion: "Amplio apartamento para familias", capacidad: 5, precio_noche: 155, camas: "2 dobles + sofá cama", bano: "privado", disponibles: 4 },
    ],
    incluye: ["Ropa de cama y toallas", "WiFi", "Acceso a piscina", "Parking incluido", "Cocina equipada"],
    disponible: true,
    rating: 4.6,
    num_resenas: 78,
    wifi: true,
    desayuno: false,
    parking: true,
  },
];

export const tipoHostalLabels: Record<string, string> = {
  hostal: "Hostal",
  pension: "Pensión",
  hotel_boutique: "Hotel Boutique",
  apartahotel: "Apartahotel",
};
