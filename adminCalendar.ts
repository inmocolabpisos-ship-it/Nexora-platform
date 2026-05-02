export interface CalendarBlock {
  id: string;
  property_id: string;
  property_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: "reserva" | "mantenimiento" | "bloqueado";
  huesped_nombre: string;
  notas: string;
  color: string;
}

export const mockCalendarBlocks: CalendarBlock[] = [
  {
    id: "b1",
    property_id: "p1",
    property_nombre: "Villa Tramontana",
    fecha_inicio: "2026-04-12",
    fecha_fin: "2026-04-18",
    tipo: "reserva",
    huesped_nombre: "María García López",
    notas: "Reserva confirmada",
    color: "bg-amber-500",
  },
  {
    id: "b2",
    property_id: "p2",
    property_nombre: "Chalet Sierra Nevada",
    fecha_inicio: "2026-04-15",
    fecha_fin: "2026-04-20",
    tipo: "reserva",
    huesped_nombre: "Sofia Blanco Moreno",
    notas: "Pago recibido",
    color: "bg-emerald-500",
  },
  {
    id: "b3",
    property_id: "p1",
    property_nombre: "Villa Tramontana",
    fecha_inicio: "2026-04-25",
    fecha_fin: "2026-04-28",
    tipo: "mantenimiento",
    huesped_nombre: "",
    notas: "Revisión anual piscina",
    color: "bg-stone-400",
  },
  {
    id: "b4",
    property_id: "p3",
    property_nombre: "Apartamento Barceloneta",
    fecha_inicio: "2026-05-01",
    fecha_fin: "2026-05-07",
    tipo: "bloqueado",
    huesped_nombre: "",
    notas: "Uso personal propietario",
    color: "bg-red-400",
  },
];
