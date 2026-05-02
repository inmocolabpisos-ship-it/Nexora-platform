export type CommissionDuration = "vida" | "3_meses" | "6_meses" | "1_ano" | "2_anos" | "personalizado";

export const durationLabels: Record<CommissionDuration, string> = {
  vida: "Por vida",
  "3_meses": "3 meses",
  "6_meses": "6 meses",
  "1_ano": "1 año",
  "2_anos": "2 años",
  personalizado: "Personalizado",
};

export interface CommissionRule {
  id: string;
  member_id: string;
  member_nombre: string;
  member_tipo: "cliente" | "propietario";
  porcentaje: number;
  duracion: CommissionDuration;
  fecha_inicio: string;
  fecha_fin: string | null;
  activa: boolean;
  notas: string;
}

export const mockCommissions: CommissionRule[] = [
  {
    id: "c1",
    member_id: "2",
    member_nombre: "Carlos Martínez Ruiz",
    member_tipo: "propietario",
    porcentaje: 0,
    duracion: "1_ano",
    fecha_inicio: "2026-01-01",
    fecha_fin: "2026-12-31",
    activa: true,
    notas: "Descuento por ser propietario fundador",
  },
  {
    id: "c2",
    member_id: "5",
    member_nombre: "Sofia Blanco Moreno",
    member_tipo: "cliente",
    porcentaje: 3,
    duracion: "6_meses",
    fecha_inicio: "2026-04-01",
    fecha_fin: "2026-09-30",
    activa: true,
    notas: "Promoción primavera-verano",
  },
  {
    id: "c3",
    member_id: "4",
    member_nombre: "Luis Fernández Torres",
    member_tipo: "propietario",
    porcentaje: 5,
    duracion: "vida",
    fecha_inicio: "2026-03-01",
    fecha_fin: null,
    activa: true,
    notas: "Tarifa estándar",
  },
];
