export interface BankAccount {
  titular: string;
  iban: string;
  banco: string;
  swift: string;
}

export interface AdminMember {
  id: string;
  tipo: "cliente" | "propietario";
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  dni_numero: string;
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
  cuenta_bancaria: BankAccount;
  notas: string;
}

export const mockAdminMembers: AdminMember[] = [
  {
    id: "1",
    tipo: "cliente",
    nombre: "María",
    apellidos: "García López",
    email: "maria.garcia@email.com",
    telefono: "+34 612 345 678",
    dni_numero: "12345678A",
    nacionalidad: "Española",
    fecha_nacimiento: "1990-05-15",
    direccion: "Calle Mayor 24, 3ºB",
    ciudad: "Madrid",
    codigo_postal: "28001",
    pais: "España",
    fecha_registro: "2026-04-08",
    estado: "pendiente",
    dni_frontal: "https://readdy.ai/api/search-image?query=spanish%20national%20identity%20card%20front%20document%20white%20background%20official%20government&width=400&height=250&seq=adni001&orientation=landscape",
    dni_trasero: "https://readdy.ai/api/search-image?query=spanish%20national%20identity%20card%20back%20document%20white%20background%20official%20government&width=400&height=250&seq=adni002&orientation=landscape",
    selfie: "https://readdy.ai/api/search-image?query=woman%20selfie%20portrait%20smiling%20natural%20light%20clean%20white%20background%20professional%20headshot&width=300&height=300&seq=aselfie001&orientation=squarish",
    cuenta_bancaria: { titular: "María García López", iban: "ES91 2100 0418 4502 0005 1332", banco: "CaixaBank", swift: "CAIXESBBXXX" },
    notas: ""
  },
  {
    id: "2",
    tipo: "propietario",
    nombre: "Carlos",
    apellidos: "Martínez Ruiz",
    email: "carlos.martinez@email.com",
    telefono: "+34 698 765 432",
    dni_numero: "87654321B",
    nacionalidad: "Española",
    fecha_nacimiento: "1978-11-22",
    direccion: "Avenida del Mar 8, 1ºA",
    ciudad: "Barcelona",
    codigo_postal: "08001",
    pais: "España",
    fecha_registro: "2026-04-07",
    estado: "verificado",
    dni_frontal: "https://readdy.ai/api/search-image?query=spanish%20national%20identity%20card%20front%20document%20white%20background%20official%20government&width=400&height=250&seq=adni003&orientation=landscape",
    dni_trasero: "https://readdy.ai/api/search-image?query=spanish%20national%20identity%20card%20back%20document%20white%20background%20official%20government&width=400&height=250&seq=adni004&orientation=landscape",
    selfie: "https://readdy.ai/api/search-image?query=man%20selfie%20portrait%20smiling%20natural%20light%20clean%20white%20background%20professional%20headshot&width=300&height=300&seq=aselfie002&orientation=squarish",
    cuenta_bancaria: { titular: "Carlos Martínez Ruiz", iban: "ES80 2038 5778 9830 0076 0236", banco: "Bankia", swift: "CAHMESMMXXX" },
    notas: "Propietario verificado con 3 propiedades activas"
  },
  {
    id: "3",
    tipo: "cliente",
    nombre: "Ana",
    apellidos: "Rodríguez Pérez",
    email: "ana.rodriguez@email.com",
    telefono: "+34 655 111 222",
    dni_numero: "11223344C",
    nacionalidad: "Española",
    fecha_nacimiento: "1995-03-08",
    direccion: "Plaza España 5, 2ºC",
    ciudad: "Sevilla",
    codigo_postal: "41001",
    pais: "España",
    fecha_registro: "2026-04-06",
    estado: "rechazado",
    dni_frontal: "https://readdy.ai/api/search-image?query=spanish%20national%20identity%20card%20front%20document%20white%20background%20official%20government&width=400&height=250&seq=adni005&orientation=landscape",
    dni_trasero: "https://readdy.ai/api/search-image?query=spanish%20national%20identity%20card%20back%20document%20white%20background%20official%20government&width=400&height=250&seq=adni006&orientation=landscape",
    selfie: "https://readdy.ai/api/search-image?query=woman%20selfie%20portrait%20smiling%20natural%20light%20clean%20white%20background%20professional%20headshot&width=300&height=300&seq=aselfie003&orientation=squarish",
    cuenta_bancaria: { titular: "Ana Rodríguez Pérez", iban: "ES76 0049 1500 0521 1060 0671", banco: "Santander", swift: "BSCHESMMXXX" },
    notas: "Documentación rechazada por imagen borrosa"
  },
  {
    id: "4",
    tipo: "propietario",
    nombre: "Luis",
    apellidos: "Fernández Torres",
    email: "luis.fernandez@email.com",
    telefono: "+34 677 888 999",
    dni_numero: "55667788D",
    nacionalidad: "Española",
    fecha_nacimiento: "1982-07-30",
    direccion: "Calle Larios 12, 4ºD",
    ciudad: "Málaga",
    codigo_postal: "29001",
    pais: "España",
    fecha_registro: "2026-04-05",
    estado: "pendiente",
    dni_frontal: "https://readdy.ai/api/search-image?query=spanish%20national%20identity%20card%20front%20document%20white%20background%20official%20government&width=400&height=250&seq=adni007&orientation=landscape",
    dni_trasero: "https://readdy.ai/api/search-image?query=spanish%20national%20identity%20card%20back%20document%20white%20background%20official%20government&width=400&height=250&seq=adni008&orientation=landscape",
    selfie: "https://readdy.ai/api/search-image?query=man%20selfie%20portrait%20smiling%20natural%20light%20clean%20white%20background%20professional%20headshot&width=300&height=300&seq=aselfie004&orientation=squarish",
    cuenta_bancaria: { titular: "Luis Fernández Torres", iban: "ES91 0182 6370 4402 0150 3369", banco: "BBVA", swift: "BBVAESMMXXX" },
    notas: ""
  },
  {
    id: "5",
    tipo: "cliente",
    nombre: "Sofia",
    apellidos: "Blanco Moreno",
    email: "sofia.blanco@email.com",
    telefono: "+34 633 444 555",
    dni_numero: "99887766E",
    nacionalidad: "Italiana",
    fecha_nacimiento: "1988-12-01",
    direccion: "Via Roma 45",
    ciudad: "Valencia",
    codigo_postal: "46001",
    pais: "España",
    fecha_registro: "2026-04-04",
    estado: "verificado",
    dni_frontal: "https://readdy.ai/api/search-image?query=european%20identity%20card%20front%20document%20white%20background%20official%20government&width=400&height=250&seq=adni009&orientation=landscape",
    dni_trasero: "https://readdy.ai/api/search-image?query=european%20identity%20card%20back%20document%20white%20background%20official%20government&width=400&height=250&seq=adni010&orientation=landscape",
    selfie: "https://readdy.ai/api/search-image?query=woman%20selfie%20portrait%20smiling%20natural%20light%20clean%20white%20background%20professional%20headshot&width=300&height=300&seq=aselfie005&orientation=squarish",
    cuenta_bancaria: { titular: "Sofia Blanco Moreno", iban: "ES21 0049 6778 5021 2345 6789", banco: "Santander", swift: "BSCHESMMXXX" },
    notas: "Cliente VIP con 5 reservas completadas"
  },
];
