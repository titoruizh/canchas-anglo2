# 🤖 Guía para Trabajar con IA - Canchas AngloAmerican

## 📖 Propósito

Este documento ayuda a maximizar la efectividad de herramientas de IA (como GitHub Copilot, ChatGPT, Claude, etc.) al trabajar en este proyecto.

---

## 🎯 Contexto Importante para la IA

### Información del Proyecto

**Nombre**: Sistema de Gestión de Canchas - AngloAmerican  
**Tipo**: Aplicación web de gestión con mapas georreferenciados  
**Stack**: Astro 5 + Supabase + Mapbox GL JS  
**Propósito**: Gestionar flujo de trabajo de canchas entre 4 empresas

### Arquitectura Clave

```
Frontend (Astro SSR) → API Routes → Supabase PostgreSQL
                    ↓
              Mapbox GL JS (mapas)
```

### Sistema de Coordenadas

**Crítico**: El proyecto usa **UTM Zona 19S (EPSG:32719)** y convierte a WGS84 para Mapbox.

---

## 📚 Referencias Rápidas para la IA

Cuando trabajes con IA, dirígela a estos documentos:

### Documentación Principal

```
"Consulta docs/ARCHITECTURE.md para entender la arquitectura"
"Revisa docs/CODE_STANDARDS.md para los estándares de código"
"Mira docs/INDEX.md para navegación completa"
```

### Por Funcionalidad

| Tema | Documento |
|------|-----------|
| Autenticación | `docs/arquitectura/SISTEMA_USUARIOS_COMPLETO.md` |
| Mapas y GIS | `docs/componentes/mapbox-utils.md` |
| PKs Georreferenciados | `docs/diseno/PKS_GEORREFERENCIADOS_README.md` |
| Flujos de Estado | `docs/flujos/FLUJO_ESTADOS_NUEVO.md` |
| Revanchas | `docs/arquitectura/SISTEMA_REVANCHAS_COMPLETO.md` |
| Base de Datos | `docs/database/supabase_setup.sql` |
| APIs | `docs/ARCHITECTURE.md` (sección APIs) |

---

## 💬 Prompts Efectivos

### Para Agregar Funcionalidades

```
Necesito agregar [funcionalidad]. Siguiendo CODE_STANDARDS.md:
1. Crear archivo en [ubicación]
2. Usar nomenclatura [convención]
3. Documentar en docs/

Contexto:
- Stack: Astro 5 + Supabase
- Ver ARCHITECTURE.md para patrones
- Seguir estructura de [archivo similar]
```

### Para Refactorizar

```
Refactoriza [archivo] siguiendo:
- CODE_STANDARDS.md (sección [X])
- Patrón usado en [archivo de referencia]
- Mantener compatibilidad con [dependencia]

Contexto adicional: [explicación del problema]
```

### Para Debugging

```
Error en [archivo] línea [X]:
[Mensaje de error]

Contexto:
- Función: [nombre y propósito]
- Se llama desde: [origen]
- Debería: [comportamiento esperado]
- Hace: [comportamiento actual]

Ver docs/componentes/[archivo].md para documentación.
```

### Para Documentar

```
Documenta [componente/función] siguiendo:
- Formato de docs/componentes/[ejemplo].md
- Incluir: propósito, parámetros, retorno, ejemplos
- Agregar referencias a otros docs relevantes
```

---

## 🔍 Información Crucial que la IA Debe Saber

### 1. Sistema de Coordenadas

```typescript
// Siempre usa estas funciones para coordenadas
import { utmToWgs84, convertGeometry } from '@/utils/mapbox';

// NUNCA uses coordenadas UTM directamente en Mapbox
const [lng, lat] = utmToWgs84(easting, northing);
```

### 2. Roles y Permisos

```typescript
// Roles disponibles
type Rol = 'ANGLO' | 'BESALCO' | 'LINKAPSIS' | 'LLAYLLAY' | 'ADMIN';

// Siempre validar rol antes de acciones
if (!['ANGLO', 'ADMIN'].includes(user.rol)) {
  return new Response('No autorizado', { status: 403 });
}
```

### 3. Estados de Canchas

```
Flujo: Creada → En Proceso → Finalizada → Validada → Cerrada
       (con posibles rechazos que vuelven a "En Proceso")
```

### 4. Convenciones de Nombres

```typescript
// Componentes Astro: PascalCase
AuthGuard.astro
MiningMap.astro

// Páginas: kebab-case
mapbox-window.astro

// Utils: camelCase
mapbox.ts
authStore.ts

// APIs: REST con kebab-case
/api/canchas/[id]/generar-pdf.ts
```

### 5. Estructura de Respuestas API

```typescript
// Éxito
return new Response(
  JSON.stringify({ data: resultado }),
  { status: 200, headers: { 'Content-Type': 'application/json' } }
);

// Error
return new Response(
  JSON.stringify({ error: 'Mensaje descriptivo' }),
  { status: 400, headers: { 'Content-Type': 'application/json' } }
);
```

---

## 🚀 Casos de Uso Comunes

### 1. Crear Nuevo Endpoint API

**Prompt:**
```
Crea un endpoint GET en /api/canchas/[id]/estadisticas.ts que:
1. Reciba el ID de cancha
2. Valide autenticación (usar patrón de otros endpoints)
3. Retorne estadísticas de la cancha
4. Siga CODE_STANDARDS.md

Referencia: src/pages/api/canchas/[id]/timeline.ts
```

### 2. Agregar Nueva Página

**Prompt:**
```
Crea una página Astro en src/pages/reportes.astro que:
1. Use AuthGuard para protección
2. Muestre lista de canchas cerradas
3. Siga el estilo de index.astro
4. Documente en docs/componentes/paginas.md

Ver CODE_STANDARDS.md sección "Estructura de Componentes Astro"
```

### 3. Modificar Base de Datos

**Prompt:**
```
Necesito agregar columna "material" a tabla canchas:
1. Crear migración SQL en docs/database/migrations/
2. Incluir rollback
3. Actualizar documentación de esquema
4. Seguir convenciones SQL de CODE_STANDARDS.md
```

### 4. Integrar Nueva Librería

**Prompt:**
```
Instalar y configurar [librería] en el proyecto:
1. Agregar a package.json
2. Configurar según ARCHITECTURE.md
3. Crear util en src/utils/ si es necesario
4. Documentar uso en docs/
5. Actualizar SETUP.md si requiere config
```

---

## 🎨 Patrones de Código a Seguir

### Componente Astro Típico

```astro
---
// 1. Imports
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard.astro';

// 2. Props con tipos
interface Props {
  id: number;
}

const { id } = Astro.props;

// 3. Lógica
const data = await fetchData(id);
---

<AuthGuard />

<!-- 4. HTML -->
<div class="container">
  <h1>{data.title}</h1>
</div>

<!-- 5. Estilos -->
<style>
  .container {
    max-width: 1200px;
  }
</style>

<!-- 6. Scripts del cliente -->
<script>
  // Código del navegador
</script>
```

### Función de Utilidad Típica

```typescript
/**
 * Descripción clara de qué hace
 * 
 * @param param1 - Descripción
 * @param param2 - Descripción
 * @returns Qué retorna
 * @throws Error si [condición]
 */
export async function miFuncion(
  param1: string,
  param2: number
): Promise<Result> {
  // Validación de inputs
  if (!param1) {
    throw new Error('param1 es requerido');
  }
  
  try {
    // Lógica principal
    const result = await operation();
    return result;
  } catch (error) {
    console.error('Error en miFuncion:', error);
    throw new Error('Mensaje descriptivo para el usuario');
  }
}
```

### Endpoint API Típico

```typescript
import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const GET: APIRoute = async ({ params, locals }) => {
  // 1. Validar autenticación
  if (!locals.user) {
    return new Response(
      JSON.stringify({ error: 'No autenticado' }),
      { status: 401 }
    );
  }
  
  // 2. Validar autorización
  if (!['ANGLO', 'ADMIN'].includes(locals.user.rol)) {
    return new Response(
      JSON.stringify({ error: 'No autorizado' }),
      { status: 403 }
    );
  }
  
  // 3. Obtener datos
  const { id } = params;
  const { data, error } = await supabase
    .from('canchas')
    .select('*')
    .eq('id', id)
    .single();
  
  // 4. Manejar errores
  if (error) {
    return new Response(
      JSON.stringify({ error: 'No encontrado' }),
      { status: 404 }
    );
  }
  
  // 5. Retornar resultado
  return new Response(
    JSON.stringify({ data }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

---

## 🧪 Testing con IA

### Generar Tests

```
Genera tests para [función] usando Vitest:
1. Casos normales
2. Casos edge (null, undefined, valores extremos)
3. Manejo de errores
4. Mocks de Supabase si es necesario

Ver CODE_STANDARDS.md sección "Testing"
```

### Test de Integración

```
Crea test de integración para flujo:
1. Usuario hace login
2. Crea cancha
3. Envía a Besalco
4. Verifica estado en BD

Usar patrón de tests existentes en tests/
```

---

## 📝 Documentación con IA

### Generar Documentación de Función

```
Documenta la función [nombre] en [archivo]:
1. JSDoc completo
2. Ejemplos de uso
3. Casos edge
4. Referencias a docs relacionados

Seguir formato de docs/componentes/mapbox-utils.md
```

### Generar Documentación de API

```
Documenta el endpoint [ruta]:
1. Método HTTP
2. Autenticación requerida
3. Parámetros (URL, body)
4. Responses (200, 400, 401, 403, 404)
5. Ejemplo de request/response

Agregar a docs/api/ENDPOINTS.md
```

---

## ⚠️ Advertencias Importantes para la IA

### ❌ NO hacer:

```typescript
// ❌ NO usar coordenadas UTM directamente
map.setCenter([347823, 6331245]); // INCORRECTO

// ❌ NO confiar en inputs del cliente
await supabase.from('canchas').insert(requestData);

// ❌ NO hardcodear credenciales
const token = "pk.ey..."; // INCORRECTO

// ❌ NO saltarse validación de roles
// Siempre verificar permisos

// ❌ NO usar console.log en producción
// Usar proper logging
```

### ✅ SÍ hacer:

```typescript
// ✅ Convertir coordenadas
const [lng, lat] = utmToWgs84(347823, 6331245);
map.setCenter([lng, lat]);

// ✅ Validar inputs
if (!nombre || typeof nombre !== 'string') {
  return error('Nombre inválido');
}

// ✅ Usar variables de entorno
const token = await getMapboxToken();

// ✅ Verificar permisos
if (!hasPermission(user, 'crear_cancha')) {
  return unauthorized();
}

// ✅ Logging apropiado
console.error('Error crítico:', error);
```

---

## 🔄 Flujo de Trabajo con IA

### 1. Planificación

```
IA: Analiza [tarea] y sugiere:
1. Archivos a modificar
2. Nuevos archivos a crear
3. Tests necesarios
4. Documentación a actualizar
5. Posibles breaking changes

Basándote en ARCHITECTURE.md y CODE_STANDARDS.md
```

### 2. Implementación

```
IA: Implementa [tarea] siguiendo:
1. Patrones de [archivo existente similar]
2. CODE_STANDARDS.md
3. Agregar manejo de errores
4. Agregar validaciones
5. Incluir JSDoc
```

### 3. Testing

```
IA: Crea tests para los cambios:
1. Unit tests de funciones nuevas
2. Integration tests del flujo
3. Verificar casos edge
```

### 4. Documentación

```
IA: Actualiza documentación:
1. JSDoc en código
2. Archivo relevante en docs/
3. Actualizar INDEX.md si es nuevo tema
4. Agregar ejemplos de uso
```

### 5. Revisión

```
IA: Revisa el código contra:
1. CODE_STANDARDS.md
2. ARCHITECTURE.md (patrones)
3. Seguridad (validaciones, auth)
4. Performance (optimizaciones obvias)
5. Documentación completa
```

---

## 📊 Métricas de Calidad

Cuando pidas código a la IA, verifica:

- [ ] ✅ Sigue CODE_STANDARDS.md
- [ ] ✅ Tiene manejo de errores
- [ ] ✅ Valida inputs
- [ ] ✅ Verifica permisos (si aplica)
- [ ] ✅ Está documentado (JSDoc)
- [ ] ✅ Tiene ejemplos de uso
- [ ] ✅ Usa TypeScript apropiadamente
- [ ] ✅ Es consistente con código existente

---

## 🎓 Aprendizaje Continuo

A medida que el proyecto crece:

1. **Actualiza esta guía** con nuevos patrones
2. **Agrega ejemplos** de prompts exitosos
3. **Documenta edge cases** descubiertos
4. **Comparte conocimiento** con el equipo

---

## 🔗 Enlaces Útiles

- [Documentación de Astro](https://docs.astro.build)
- [Supabase Docs](https://supabase.com/docs)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)

---

**Recuerda**: La IA es una herramienta poderosa, pero el código final es responsabilidad del desarrollador. Siempre revisa, prueba y entiende lo que la IA genera.

**Última actualización**: Diciembre 2025
