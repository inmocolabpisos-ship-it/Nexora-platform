export interface PropertyAmenity {
  calefaccion: boolean;
  chimenea: boolean;
  jardin: boolean;
  piscina: boolean;
  mascotas: boolean;
  ninos: boolean;
  wifi: boolean;
  tv: boolean;
  cerca_playa: boolean;
  montana: boolean;
  parking: boolean;
  aire_acondicionado: boolean;
  barbacoa: boolean;
  terraza: boolean;
}

export type PropertyType = "villa" | "chalet" | "casa_rural" | "apartamento" | "studio" | "habitacion";

export interface Property {
  id: string;
  propietario_id: string;
  propietario_nombre: string;
  nombre: string;
  tipo: PropertyType;
  descripcion: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  metros_cuadrados: number;
  habitaciones: number;
  banos: number;
  capacidad: number;
  precio_noche: number;
  estado: "activa" | "inactiva" | "pendiente";
  amenities: PropertyAmenity;
  fotos: string[];
  fecha_alta: string;
}

export const propertyTypeLabels: Record<PropertyType, string> = {
  villa: "Villa",
  chalet: "Chalet",
  casa_rural: "Casa Rural",
  apartamento: "Apartamento",
  studio: "Studio",
  habitacion: "Habitación",
};

export const mockProperties: Property[] = [
  {
    id: "p1",
    propietario_id: "2",
    propietario_nombre: "Carlos Martínez Ruiz",
    nombre: "Villa Tramontana",
    tipo: "villa",
    descripcion: "Espectacular villa con vistas al mar, piscina privada y jardín mediterráneo. Perfecta para familias.",
    direccion: "Camino del Faro 12",
    ciudad: "Marbella",
    provincia: "Málaga",
    metros_cuadrados: 320,
    habitaciones: 5,
    banos: 4,
    capacidad: 10,
    precio_noche: 450,
    estado: "activa",
    amenities: { calefaccion: true, chimenea: true, jardin: true, piscina: true, mascotas: false, ninos: true, wifi: true, tv: true, cerca_playa: true, montana: false, parking: true, aire_acondicionado: true, barbacoa: true, terraza: true },
    fotos: [
      "https://readdy.ai/api/search-image?query=luxury%20villa%20exterior%20swimming%20pool%20mediterranean%20garden%20blue%20sky%20sunny%20day%20elegant%20architecture&width=800&height=600&seq=prop001&orientation=landscape",
      "https://readdy.ai/api/search-image?query=luxury%20villa%20interior%20living%20room%20modern%20elegant%20white%20furniture%20natural%20light&width=800&height=600&seq=prop002&orientation=landscape",
      "https://readdy.ai/api/search-image?query=luxury%20villa%20master%20bedroom%20white%20linen%20sea%20view%20window%20elegant&width=800&height=600&seq=prop003&orientation=landscape",
      "https://readdy.ai/api/search-image?query=luxury%20villa%20kitchen%20modern%20white%20marble%20countertop%20elegant&width=800&height=600&seq=prop004&orientation=landscape",
      "https://readdy.ai/api/search-image?query=luxury%20villa%20terrace%20sea%20view%20sunset%20outdoor%20furniture%20elegant&width=800&height=600&seq=prop005&orientation=landscape",
      "https://readdy.ai/api/search-image?query=luxury%20villa%20bathroom%20marble%20white%20elegant%20modern&width=800&height=600&seq=prop006&orientation=landscape",
    ],
    fecha_alta: "2026-03-15",
  },
  {
    id: "p2",
    propietario_id: "4",
    propietario_nombre: "Luis Fernández Torres",
    nombre: "Chalet Sierra Nevada",
    tipo: "chalet",
    descripcion: "Acogedor chalet de montaña con chimenea, jardín y vistas a la sierra. Ideal para escapadas rurales.",
    direccion: "Calle Pinos 7",
    ciudad: "Granada",
    provincia: "Granada",
    metros_cuadrados: 180,
    habitaciones: 3,
    banos: 2,
    capacidad: 6,
    precio_noche: 180,
    estado: "activa",
    amenities: { calefaccion: true, chimenea: true, jardin: true, piscina: false, mascotas: true, ninos: true, wifi: true, tv: true, cerca_playa: false, montana: true, parking: true, aire_acondicionado: false, barbacoa: true, terraza: true },
    fotos: [
      "https://readdy.ai/api/search-image?query=mountain%20chalet%20exterior%20wooden%20architecture%20snow%20pine%20trees%20elegant%20rustic&width=800&height=600&seq=prop007&orientation=landscape",
      "https://readdy.ai/api/search-image?query=mountain%20chalet%20interior%20fireplace%20cozy%20living%20room%20rustic%20elegant%20warm&width=800&height=600&seq=prop008&orientation=landscape",
      "https://readdy.ai/api/search-image?query=mountain%20chalet%20bedroom%20rustic%20wooden%20beams%20cozy%20elegant&width=800&height=600&seq=prop009&orientation=landscape",
    ],
    fecha_alta: "2026-03-20",
  },
  {
    id: "p3",
    propietario_id: "2",
    propietario_nombre: "Carlos Martínez Ruiz",
    nombre: "Apartamento Barceloneta",
    tipo: "apartamento",
    descripcion: "Moderno apartamento a 50m de la playa con terraza y vistas al mar. Totalmente equipado.",
    direccion: "Paseo Marítimo 34, 5ºA",
    ciudad: "Barcelona",
    provincia: "Barcelona",
    metros_cuadrados: 75,
    habitaciones: 2,
    banos: 1,
    capacidad: 4,
    precio_noche: 120,
    estado: "activa",
    amenities: { calefaccion: true, chimenea: false, jardin: false, piscina: false, mascotas: false, ninos: true, wifi: true, tv: true, cerca_playa: true, montana: false, parking: false, aire_acondicionado: true, barbacoa: false, terraza: true },
    fotos: [
      "https://readdy.ai/api/search-image?query=modern%20apartment%20interior%20Barcelona%20sea%20view%20terrace%20elegant%20minimalist&width=800&height=600&seq=prop010&orientation=landscape",
      "https://readdy.ai/api/search-image?query=modern%20apartment%20bedroom%20minimalist%20white%20elegant%20Barcelona&width=800&height=600&seq=prop011&orientation=landscape",
    ],
    fecha_alta: "2026-04-01",
  },
];
