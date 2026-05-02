import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type DbMember = {
  id: string;
  tipo: "huesped" | "anfitrion";
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  dni_numero: string;
  tipo_documento: "dni" | "nie" | "pasaporte" | null;
  nacionalidad: string;
  fecha_nacimiento: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
  pais: string;
  fecha_registro: string;
  estado: "pendiente" | "verificado" | "rechazado";
  dni_frontal: string;
  dni_trasero: string;
  selfie: string;
  forma_pago: string | null;
  cuenta_bancaria: {
    titular: string;
    iban: string;
    banco: string;
    swift: string;
  };
  notas: string;
  created_at: string;
  updated_at: string;
};

export type DbProperty = {
  id: string;
  propietario_id: string;
  propietario_nombre: string;
  nombre: string;
  tipo: string;
  descripcion: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  comunidad_autonoma: string | null;
  metros_cuadrados: number;
  habitaciones: number;
  banos: number;
  capacidad: number;
  precio_noche: number;
  estado: string;
  amenities: Record<string, boolean>;
  fotos: string[];
  fecha_alta: string;
  numero_registro_turistico: string | null;
  tipo_via: string | null;
  created_at: string;
  updated_at: string;
};

export type DbCommission = {
  id: string;
  tipo: "global" | "custom";
  target_tipo: "anfitrion" | "huesped" | null;
  target_id: string | null;
  target_nombre: string | null;
  porcentaje: number;
  duracion: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activa: boolean;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

export type DbBooking = {
  id: string;
  propiedad_id: string | null;
  propiedad_nombre: string | null;
  huesped_id: string | null;
  huesped_nombre: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: "reserva" | "mantenimiento" | "bloqueado";
  estado: "confirmada" | "pendiente" | "cancelada" | "bloqueada";
  precio_total: number | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
};
