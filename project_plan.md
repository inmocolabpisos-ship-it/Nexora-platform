# StayLux - Plataforma de Alquiler Vacacional

## 1. Descripción del Proyecto
Plataforma premium de alquiler vacacional estilo luxury (similar a Airbnb) que permite el registro verificado de huéspedes y anfitriones con documentación de identidad (DNI frontal/trasero + selfie), gestión de propiedades, y un panel de administración para verificar documentos y cumplir con la normativa SES HOSPEDAJE.

**Usuarios objetivo:** Huéspedes, Anfitriones, Administradores
**Valor diferencial:** Verificación de identidad con cámara en tiempo real, cumplimiento normativo SES HOSPEDAJE, diseño luxury premium

## 2. Estructura de Páginas

- `/` - Inicio (Home) - Landing page luxury
- `/registro-huesped` - Registro de Huéspedes (datos + DNI + selfie)
- `/registro-anfitrion` - Registro de Anfitriones (datos + DNI + selfie)
- `/admin` - Panel de Administración
- `/admin/verificacion` - Verificación de Documentos
- `*` - NotFound

## 3. Funcionalidades Core

- [ ] Página de inicio luxury con hero, características, CTA
- [ ] Formulario de registro de huéspedes con captura de DNI (frontal/trasero) y selfie via cámara
- [ ] Formulario de registro de anfitriones con captura de DNI (frontal/trasero) y selfie via cámara
- [ ] Panel de administración con lista de miembros registrados
- [ ] Sección de verificación de documentos (aprobar/rechazar)
- [ ] Visualización de documentos para entrega a SES HOSPEDAJE
- [ ] Navegación luxury con logo personalizado
- [ ] Diseño responsive (móvil y escritorio)

## 4. Modelo de Datos

### Tabla: guests (Huéspedes)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Clave primaria |
| nombre | text | Nombre completo |
| email | text | Correo electrónico |
| telefono | text | Teléfono |
| fecha_nacimiento | date | Fecha de nacimiento |
| nacionalidad | text | Nacionalidad |
| dni_numero | text | Número de DNI/Pasaporte |
| dni_frontal | text | URL/base64 foto DNI frontal |
| dni_trasero | text | URL/base64 foto DNI trasero |
| selfie | text | URL/base64 selfie |
| estado | text | pendiente/verificado/rechazado |
| created_at | timestamp | Fecha de registro |

### Tabla: hosts (Anfitriones)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Clave primaria |
| nombre | text | Nombre completo |
| email | text | Correo electrónico |
| telefono | text | Teléfono |
| fecha_nacimiento | date | Fecha de nacimiento |
| nacionalidad | text | Nacionalidad |
| dni_numero | text | Número de DNI/Pasaporte |
| direccion | text | Dirección del alojamiento |
| tipo_alojamiento | text | Tipo de propiedad |
| dni_frontal | text | URL/base64 foto DNI frontal |
| dni_trasero | text | URL/base64 foto DNI trasero |
| selfie | text | URL/base64 selfie |
| estado | text | pendiente/verificado/rechazado |
| created_at | timestamp | Fecha de registro |

## 5. Integraciones Backend

- **Supabase:** Necesario para almacenar registros de huéspedes, anfitriones y documentos. También para autenticación del panel admin. *(Fase futura)*
- **Almacenamiento de imágenes:** Supabase Storage para DNI y selfies *(Fase futura)*
- **Shopify:** No necesario
- **Stripe:** No necesario

## 6. Plan de Fases de Desarrollo

### Fase 1: Página de Inicio + Navegación ✅
- Objetivo: Landing page luxury con navegación completa
- Entregable: Home page con hero, características, CTA, navbar y footer

### Fase 2: Registro de Huéspedes
- Objetivo: Formulario completo con captura de documentos via cámara
- Entregable: Página /registro-huesped funcional con cámara

### Fase 3: Registro de Anfitriones
- Objetivo: Formulario completo con captura de documentos via cámara
- Entregable: Página /registro-anfitrion funcional con cámara

### Fase 4: Panel de Administración
- Objetivo: Dashboard admin con lista de miembros y verificación de documentos
- Entregable: Páginas /admin y /admin/verificacion

### Fase 5: Integración con Base de Datos (Supabase)
- Objetivo: Conectar formularios con Supabase para persistencia real
- Entregable: Datos guardados en BD, documentos en Storage
