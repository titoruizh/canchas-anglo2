# Estándares de Código - Canchas AngloAmerican

## 🎯 Objetivo

Este documento establece las convenciones y mejores prácticas para mantener un código limpio, consistente y mantenible en el proyecto.

## 📁 Estructura de Archivos

### Nomenclatura

- **Componentes Astro**: PascalCase - `MiningMap.astro`, `AuthGuard.astro`
- **Páginas**: kebab-case - `mapbox-window.astro`, `admin-usuarios.astro`
- **Utilidades/Scripts**: camelCase - `authStore.ts`, `mapbox.ts`
- **APIs**: kebab-case - `[id].ts`, `generar-pdf.ts`
- **Estilos**: kebab-case - `index-design.css`
- **Documentación**: SCREAMING_SNAKE_CASE o descriptivo - `README.md`, `CODE_STANDARDS.md`

### Organización

```
src/
├── pages/           # Rutas públicas (1 archivo = 1 ruta)
├── components/      # Componentes reutilizables
├── lib/             # Configuración y clientes externos
├── utils/           # Funciones auxiliares puras
├── scripts/         # Scripts del cliente (browser)
└── styles/          # Estilos globales
```

**Reglas:**
- Un archivo debe tener una responsabilidad clara
- Evitar archivos "god" con múltiples funciones no relacionadas
- Agrupar lógica relacionada en carpetas

## 🔤 Convenciones de Código

### TypeScript/JavaScript

#### Variables y Constantes

```typescript
// ✅ Bueno - nombres descriptivos
const currentUser = getUserFromSession();
const isAuthenticated = checkAuth();
const MAX_RETRIES = 3;

// ❌ Malo - nombres ambiguos
const u = getUser();
const flag = check();
const x = 3;
```

#### Funciones

```typescript
// ✅ Bueno - verbos descriptivos, parámetros tipados
async function fetchCanchaById(id: number): Promise<Cancha | null> {
  // ...
}

function validateUserRole(user: Usuario, allowedRoles: string[]): boolean {
  // ...
}

// ❌ Malo - nombres ambiguos, sin tipos
async function get(id) {
  // ...
}
```

#### Comentarios

```typescript
// ✅ Bueno - explica el "por qué"
// Usamos proj4 porque las coordenadas vienen en EPSG:32719
const converted = proj4(SOURCE_CRS, TARGET_CRS, coords);

// ❌ Malo - explica el "qué" (obvio del código)
// Convierte coordenadas
const converted = proj4(SOURCE_CRS, TARGET_CRS, coords);
```

**Cuándo comentar:**
- Lógica compleja no obvia
- Decisiones de arquitectura importantes
- Workarounds temporales (con TODO)
- APIs externas con comportamiento no documentado

### Astro

#### Estructura de Componentes

```astro
---
// 1. Imports
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard.astro';

// 2. Props con tipos
interface Props {
  canchaId: number;
  showActions?: boolean;
}

const { canchaId, showActions = true } = Astro.props;

// 3. Lógica del componente
const cancha = await fetchCancha(canchaId);
const user = Astro.locals.user;

// 4. Funciones auxiliares (si son cortas)
function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-CL').format(date);
}
---

<!-- 5. HTML/Template -->
<div class="cancha-card">
  <h2>{cancha.nombre}</h2>
  {showActions && (
    <div class="actions">
      <!-- ... -->
    </div>
  )}
</div>

<!-- 6. Estilos (scoped) -->
<style>
  .cancha-card {
    /* ... */
  }
</style>

<!-- 7. Scripts del cliente -->
<script>
  // Código que corre en el navegador
  document.querySelector('.btn').addEventListener('click', () => {
    // ...
  });
</script>
```

#### Props y Tipos

```typescript
// ✅ Bueno - siempre tipar Props
interface Props {
  titulo: string;
  canchas: Cancha[];
  filtros?: FiltrosCancha;
}

// ❌ Malo - Props sin tipo
const { titulo, canchas, filtros } = Astro.props;
```

### CSS

#### Nomenclatura BEM (Block Element Modifier)

```css
/* Bloque */
.cancha-card { }

/* Elemento */
.cancha-card__header { }
.cancha-card__body { }

/* Modificador */
.cancha-card--finalizada { }
.cancha-card--rechazada { }
```

#### Organización

```css
/* 1. Variables y resets */
:root {
  --color-primary: #007bff;
  --spacing-md: 1rem;
}

/* 2. Layout general */
.container { }
.grid { }

/* 3. Componentes (orden alfabético) */
.btn { }
.cancha-card { }
.modal { }

/* 4. Utilidades */
.text-center { }
.mt-2 { }
```

## 🗃️ Base de Datos

### Nomenclatura SQL

```sql
-- Tablas: snake_case, plural
CREATE TABLE canchas ();
CREATE TABLE validaciones ();

-- Columnas: snake_case
id, nombre_cancha, created_at

-- Constraints: tabla_tipo_descripcion
PRIMARY KEY pk_canchas
FOREIGN KEY fk_canchas_empresa
UNIQUE unique_canchas_numero
```

### Queries en el Código

```typescript
// ✅ Bueno - queries preparadas, manejo de errores
async function getCanchasByEstado(estado: string) {
  const { data, error } = await supabase
    .from('canchas')
    .select('*')
    .eq('estado', estado);
  
  if (error) {
    console.error('Error fetching canchas:', error);
    return [];
  }
  
  return data;
}

// ❌ Malo - SQL inyectable, sin manejo de errores
async function getCanchas(estado) {
  const data = await supabase
    .from('canchas')
    .select('*')
    .eq('estado', estado);
  return data;
}
```

## 🔐 Seguridad

### Validación de Inputs

```typescript
// ✅ Bueno - validar y sanitizar
function createCancha(req: Request) {
  const { nombre, pk_inicio, pk_fin } = await req.json();
  
  if (!nombre || typeof nombre !== 'string') {
    return new Response('Nombre inválido', { status: 400 });
  }
  
  if (pk_inicio >= pk_fin) {
    return new Response('PKs inválidos', { status: 400 });
  }
  
  // ...
}

// ❌ Malo - confiar en el cliente
function createCancha(req: Request) {
  const data = await req.json();
  await supabase.from('canchas').insert(data);
}
```

### Autenticación

```typescript
// ✅ Bueno - siempre verificar autenticación y roles
export async function POST({ request, locals }) {
  if (!locals.user) {
    return new Response('No autenticado', { status: 401 });
  }
  
  if (!['ANGLO', 'ADMIN'].includes(locals.user.rol)) {
    return new Response('No autorizado', { status: 403 });
  }
  
  // ...
}
```

## 📊 Manejo de Datos

### Estado y Stores

```typescript
// ✅ Bueno - store reactivo para estado global
import { writable } from 'svelte/store';

interface AuthState {
  user: Usuario | null;
  isLoading: boolean;
}

export const authStore = writable<AuthState>({
  user: null,
  isLoading: true,
});

// ❌ Malo - variables globales mutables
let currentUser = null;
```

### Mapeo de Datos

```typescript
// ✅ Bueno - transformar datos en funciones puras
function mapCanchaToDTO(cancha: CanchaDB): CanchaDTO {
  return {
    id: cancha.id,
    nombre: cancha.nombre_cancha,
    estado: cancha.estado_actual,
    fechaCreacion: new Date(cancha.created_at),
  };
}

// ❌ Malo - mutar objetos directamente
function transform(cancha) {
  cancha.fecha = new Date(cancha.created_at);
  delete cancha.created_at;
  return cancha;
}
```

## 🗺️ GIS y Mapbox

### Coordenadas

```typescript
// ✅ Bueno - siempre especificar CRS y formato
interface Coordenada {
  lat: number;  // WGS84
  lng: number;  // WGS84
  crs?: string; // Ej: 'EPSG:4326'
}

function convertToWGS84(coords: number[], fromCRS: string): Coordenada {
  const [lng, lat] = proj4(fromCRS, 'EPSG:4326', coords);
  return { lat, lng, crs: 'EPSG:4326' };
}

// ❌ Malo - formato ambiguo
function convert(x, y) {
  return proj4(SRC, DST, [x, y]);
}
```

### GeoJSON

```typescript
// ✅ Bueno - usar tipos estándar
import type { Feature, Point, Polygon } from 'geojson';

function createPKFeature(pk: PK): Feature<Point> {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [pk.lng, pk.lat],
    },
    properties: {
      nombre: pk.nombre,
      kilometraje: pk.km,
    },
  };
}
```

## 🐛 Manejo de Errores

### Async/Await

```typescript
// ✅ Bueno - try/catch con contexto
async function fetchCancha(id: number) {
  try {
    const { data, error } = await supabase
      .from('canchas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error fetching cancha ${id}:`, error);
    throw new Error(`No se pudo cargar la cancha ${id}`);
  }
}

// ❌ Malo - sin manejo de errores
async function fetchCancha(id) {
  const { data } = await supabase
    .from('canchas')
    .select('*')
    .eq('id', id)
    .single();
  
  return data;
}
```

### APIs

```typescript
// ✅ Bueno - responses consistentes
return new Response(
  JSON.stringify({ error: 'Cancha no encontrada' }),
  { 
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  }
);

// ✅ Bueno - éxito
return new Response(
  JSON.stringify({ data: cancha }),
  { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  }
);
```

## 📝 Documentación

### Funciones Complejas

```typescript
/**
 * Calcula la distancia entre dos PKs en el sistema georreferenciado
 * 
 * @param pkInicio - PK de inicio (debe existir en la BD)
 * @param pkFin - PK de fin (debe existir en la BD)
 * @returns Distancia en metros usando la fórmula de Haversine
 * @throws Error si algún PK no existe o tiene coordenadas inválidas
 * 
 * @example
 * const distancia = await calcularDistanciaPKs(100, 150);
 * console.log(`Distancia: ${distancia}m`);
 */
async function calcularDistanciaPKs(
  pkInicio: number, 
  pkFin: number
): Promise<number> {
  // ...
}
```

### TODOs

```typescript
// TODO: Migrar a nueva API de Mapbox v4 (antes de Q2 2026)
// FIXME: Este cálculo falla con coordenadas del hemisferio norte
// HACK: Workaround temporal hasta que Supabase soporte PostGIS 3.4
// NOTE: Esta función se ejecuta cada 5 segundos, optimizar si crece la BD
```

## 🧪 Testing (Futuro)

### Estructura de Tests

```typescript
// tests/utils/mapbox.test.ts
import { describe, it, expect } from 'vitest';
import { convertCoordinates } from '@/utils/mapbox';

describe('convertCoordinates', () => {
  it('should convert UTM to WGS84 correctly', () => {
    const result = convertCoordinates([300000, 6200000], 'EPSG:32719');
    expect(result.lat).toBeCloseTo(-33.45, 2);
    expect(result.lng).toBeCloseTo(-70.66, 2);
  });
  
  it('should throw on invalid coordinates', () => {
    expect(() => convertCoordinates([NaN, 0], 'EPSG:32719'))
      .toThrow('Invalid coordinates');
  });
});
```

## 🚀 Performance

### Optimizaciones Comunes

```typescript
// ✅ Bueno - cargar solo datos necesarios
const { data } = await supabase
  .from('canchas')
  .select('id, nombre, estado')
  .limit(50);

// ❌ Malo - cargar todo sin necesidad
const { data } = await supabase
  .from('canchas')
  .select('*, historial(*), validaciones(*)');
```

```typescript
// ✅ Bueno - debounce en búsquedas
let searchTimeout: NodeJS.Timeout;

input.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    performSearch(e.target.value);
  }, 300);
});
```

## 📦 Git y Commits

### Mensajes de Commit

```
feat: agregar filtro de canchas por estado
fix: corregir cálculo de distancia entre PKs
docs: actualizar README con nuevas variables de entorno
refactor: simplificar lógica de validación de roles
style: aplicar formato consistente a archivos CSS
chore: actualizar dependencias de Mapbox a v3.8
```

### Ramas

- `main` - Producción
- `develop` - Desarrollo
- `feature/nombre-feature` - Nuevas funcionalidades
- `fix/nombre-bug` - Correcciones
- `docs/tema` - Documentación

## ✅ Checklist Pre-Commit

Antes de hacer commit, verificar:

- [ ] Código formateado consistentemente
- [ ] Sin `console.log` de debug
- [ ] Sin código comentado innecesario
- [ ] Tipos TypeScript correctos
- [ ] Manejo de errores apropiado
- [ ] Documentación actualizada (si aplica)
- [ ] Variables de entorno documentadas (si se agregan nuevas)

## 🔄 Revisión de Código

Al revisar PRs, verificar:

- [ ] Cumple con estos estándares
- [ ] No introduce deuda técnica
- [ ] Está bien documentado
- [ ] No duplica código existente
- [ ] Maneja casos edge apropiadamente

## 📚 Referencias

- [Astro Style Guide](https://docs.astro.build/en/guides/styling/)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)
- [CSS BEM Methodology](http://getbem.com/)
