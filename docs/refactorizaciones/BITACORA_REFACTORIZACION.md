# 📜 Bitácora de Refactorización y Fragmentación

Este documento mantiene un registro histórico de las "fragmentaciones" (refactorizaciones modulares) realizadas en el proyecto. Su objetivo es rastrear la evolución del código monolítico hacia una arquitectura basada en componentes y managers.

---

## 📅 20 de Enero, 2026 (PM): Refactorización de Tabla - Completada y Estabilizada

**Responsable:** Agente / TITO  
**Estado:** ✅ Completado y Funcional

### 🎯 Objetivo
Completar la refactorización de la tabla de canchas iniciada previamente, resolver regresiones introducidas durante el proceso, y eliminar declaraciones duplicadas que causaban errores de build.

### 🛠️ Cambios Realizados

#### 1. Implementación Completa de TableManager
Se finalizó la migración de toda la lógica de tabla desde `index.astro` hacia el manager dedicado.

- **Archivo:** `src/utils/TableManager.ts`
- **Funcionalidades:**
    - Renderizado dinámico de filas con `generateRows()`.
    - Generación contextual de botones de acción según empresa y estado.
    - Paginación completa (anterior, siguiente, ir a página).
    - Selección múltiple con checkboxes.
    - Event delegation para acciones y zoom.
    - Callbacks customizables para acciones, zoom y cambios de selección.

#### 2. Corrección de Regresiones Críticas
Durante la refactorización se detectaron y corrigieron 5 regresiones:

##### a) Botones de Acción Mostrando "Cargando..."
- **Causa:** `TableManager` no recibía la información de `empresaLogueada`.
- **Solución:** Agregada llamada `tableManager.setEmpresa(empresaLogueada)` en `cargarUsuarioAutenticado()`.

##### b) Filtro por Defecto Incorrecto
- **Causa:** La vista no se inicializaba en "Mis Acciones".
- **Solución:** Agregado `cambiarVista('acciones')` en `initManagers()` con timeout de 100ms.

##### c) Barra de Acciones Masivas Desaparecida
- **Causa:** CSS eliminado y callback `onSelectionChange` no registrado correctamente.
- **Solución:** Restaurado CSS de `.bulk-actions-bar` y corregido constructor de `TableManager` para incluir `containerId`.

##### d) Error de Build: Declaración Duplicada
- **Problema:** `The symbol "selectedCanchas" has already been declared`.
- **Causa:** Doble declaración de `let selectedCanchas = new Set()` en líneas 5449 y 7359.
- **Solución:** Eliminada declaración redundante en línea 7359.

##### e) Importaciones con Rutas Incorrectas
- **Causa:** Import de `FilterManager` usaba ruta absoluta `/src/utils/FilterManager.ts`.
- **Solución:** Normalizado a ruta relativa `../utils/FilterManager`.

#### 3. Integración con FilterManager
Se estableció comunicación bidireccional entre ambos managers.

- `FilterManager.onFilterUpdate` alimenta datos a `TableManager.setData()`.
- `TableManager` notifica cambios de selección para bulk actions.
- Widgets de estado actualizados vía eventos custom.

### 📊 Archivos Afectados

| Archivo | Tipo de Cambio | Descripción |
|---------|---------------|-------------|
| `src/utils/TableManager.ts` | ✨ Implementación Final | Manager completo y robusto. |
| `src/components/dashboard/CanchasTable.astro` | ✨ Nuevo | Componente UI de tabla. |
| `src/pages/index.astro` | 📉 Reducción | Eliminadas ~500 líneas de lógica legacy. |
| `src/pages/index.astro` | 🐞 Bugfix | 5 correcciones críticas post-refactorización. |

### ✅ Verificación Completada
- ✅ Renderizado inicial con datos correctos.
- ✅ Paginación funcional.
- ✅ Filtros (widgets, fechas, búsqueda) actualizan tabla.
- ✅ Botones de acción contextuales por empresa/rol.
- ✅ Selección múltiple y bulk actions operativos.
- ✅ Vista por defecto "Mis Acciones" al cargar.
- ✅ Build exitoso sin errores de declaraciones duplicadas.

---

## 📅 20 de Enero, 2026: Corrección y Ajuste de Widgets y Filtros

**Responsable:** Agente / TITO
**Estado:** ✅ Completado (Funcionalidad Estabilizada)

### 🎯 Objetivo
Corregir errores críticos en la visualización y actualización de los Widgets de Estado y el Slider de Filtros que impedían una experiencia de usuario correcta, preparando el terreno para una futura refactorización completa.

### 🛠️ Cambios Realizados

#### 1. Corrección de Lógica UI (`index.astro` y `FilterManager.ts`)
Se implementaron funciones robustas para actualizar los contadores de los widgets y KPIs.

- **Nuevas Funciones en `index.astro`:**
    - `actualizarWidgetsEstado(canchas)`: Calcula y anima los contadores de cada widget circular.
    - `actualizarResumenWidgets(canchas, total)`: Actualiza los KPIs laterales (Total y Acciones Disponibles).
    - `animateWidgetNumber(...)`: Utilidad para transiciones numéricas suaves (renombrada para evitar colisiones).

#### 2. Fix de Slider de Filtros (`FilterManager.ts`)
Se corrigió un bug donde el `FilterManager` buscaba IDs incorrectos (`vista-acciones` vs `btn-vista-acciones`), lo que impedía que el slider visual ("Mis Acciones" / "Ver Histórico") se moviera.

- **Archivo:** `src/utils/FilterManager.ts`
- **Cambio:** Actualización de selectores `getElementById` en `updateVistaUI`.

#### 3. Estabilización de Dependencias
Se resolvieron conflictos de nombres (duplicate declaration) en funciones utilitarias.

### 📊 Archivos Afectados

| Archivo | Tipo de Cambio | Descripción |
|---------|---------------|-------------|
| `src/pages/index.astro` | 🔧 Mejora | Implementación de `animateWidgetNumber` y lógica de widgets. |
| `src/utils/FilterManager.ts` | 🐞 Bugfix | Corrección de IDs para el slider de vista. |
| `src/utils/FilterManager.ts` | 🐞 Bugfix | Corrección de mapeo slug-nombre en `toggleEstadoWidget`. |

---

## 📅 20 de Enero, 2026: Refactorización Modular de Widgets de Estado

**Responsable:** Agente / TITO
**Estado:** ✅ Completado

### 🎯 Objetivo
Extraer completamente la interfaz y la lógica de los widgets de estado ("bolitas" con contadores) desde `index.astro` hacia un componente independiente `WidgetsEstados.astro`, reduciendo la complejidad del archivo principal y mejorando la modularidad.

### 🛠️ Cambios Realizados

#### 1. Creación del Componente `WidgetsEstados.astro`
- **Ubicación:** `src/components/dashboard/WidgetsEstados.astro`
- **Contenido:**
    - HTML de la sección `.dashboard-estados-section`.
    - CSS encapsulado (scoped) para los widgets.
    - Lógica JS interna para animaciones (`animateWidgetNumber`) y cálculo de totales (`actualizarWidgetsEstado` ahora interna).
- **Interacción:**
    - Escucha eventos `update-widget-stats` para actualizar sus números.
    - Emite eventos `filter-widget-request` al hacer doble click.

#### 2. Limpieza de `index.astro`
- Se reemplazaron ~60 líneas de HTML con el tag `<WidgetsEstados />`.
- Se eliminaron funciones legadas de cálculo UI.
- `actualizarContadorResultados` ahora delega la actualización vía eventos custom `window.dispatchEvent`, desacoplando la lógica.
- Se agregó un listener limpio en `initManagers` para conectar el componente con `FilterManager`.

### 📊 Archivos Afectados
| Archivo | Tipo de Cambio | Descripción |
|---------|---------------|-------------|
| `src/components/dashboard/WidgetsEstados.astro` | ✨ Nuevo | Componente encapsulado. |
| `src/pages/index.astro` | 📉 Reducción | Delegación de responsabilidades. |

---

## 📅 20 de Enero, 2026: Corrección y Ajuste de Widgets y Filtros

**Responsable:** Agente / TITO
**Estado:** ✅ Completado

### 🎯 Objetivo
Extraer la lógica de creación de canchas, que estaba hardcodeada masivamente dentro de `src/pages/index.astro` (aprox. 300 líneas), hacia un modelo modular y mantenible.

### 🛠️ Cambios Realizados

#### 1. Creación del Manager (`CreateCanchaManager`)
Se implementó el patrón **Manager** para encapsular toda la lógica de negocio y UI relacionada con el modal de creación.

- **Nuevo Archivo:** `src/utils/CreateCanchaManager.ts`
- **Responsabilidades:**
    - Manejo del DOM del modal (abrir/cerrar).
    - Validación del formulario (Nombre, Muro, Sector).
    - Lógica de negocio específica (MP hasta S7, ME hasta S3).
    - Comunicación con el iframe de Mapbox (recepción de polígonos).
    - Envío de datos a la API (`POST /api/canchas`).
    - Feedback al usuario (Notificaciones Toast).

#### 2. Componentización de la UI
Se movió el HTML del modal fuera de `index.astro`.

- **Nuevo Componente:** `src/components/dashboard/CreateCanchaModal.astro`
- **Mejoras:**
    - Estilos encapsulados.
    - Ancho aumentado a `95vw` para mejor experiencia de dibujo.
    - ids únicos para evitar colisiones.

#### 3. Limpieza de `index.astro`
- **Antes:** Código mezclado con cientos de líneas de lógica de mapa, formulario y fetch.
- **Ahora:** Inicialización limpia en una sola línea:
  ```typescript
  const createCanchaManager = new CreateCanchaManager();
  ```

#### 4. Mejoras de UX/UI Adicionales
- **Toast Notifications:** Reemplazo de `alert()` por notificaciones visuales personalizadas.
- **Validación Robusta:** Manejo de errores de servidor (ej. nombres duplicados) y cliente.
- **Interacción Mapa:** Corrección del modo dibujo (`drawing=true`) y filtros.

### 📊 Archivos Afectados

| Archivo | Tipo de Cambio | Descripción |
|---------|---------------|-------------|
| `src/pages/index.astro` | 📉 Eliminación | Se eliminaron ~300 líneas de código legacy. |
| `src/utils/CreateCanchaManager.ts` | ✨ Nuevo | Lógica centralizada. |
| `src/components/dashboard/CreateCanchaModal.astro` | ✨ Nuevo | UI del modal. |
| `src/pages/api/canchas.ts` | 🔧 Modificación | Mejor manejo de errores (409 Conflict). |

---

## 📅 14 de Enero, 2026: Fragmentación de `MiningMap` (Vista de Mapa)

**Responsable:** Agente / TITO
**Estado:** ✅ Completado

### 🎯 Objetivo
Desacoplar la lógica de visualización de mapas y geoespacial del componente `MiningMap.astro`, que manejaba demasiadas responsabilidades (UI, Datos, Eventos, Mapbox).

### 🛠️ Cambios Realizados

#### 1. Separación de Lógica (`MapManager.ts`)
Se extrajo toda la lógica de interacción con Mapbox GL JS a una clase dedicada.

- **Nuevo Archivo:** `src/components/map/MapManager.ts`
- **Responsabilidades:**
    - Inicialización del mapa y TileServer.
    - Gestión de capas (Raster y Vectoriales).
    - Manejo de popups e interacciones.
    - Filtrado de datos visuales (`show/hide`).

#### 2. Componentización de UI
Se crearon componentes específicos para los controles del mapa.

- `src/components/map/MapControls.astro`: Botonera y filtros.
- `src/components/map/MapLegend.astro`: Leyenda de colores/estados.
- `src/components/map/MapLoader.astro`: Spinner de carga.

### 📊 Archivos Afectados
| Archivo | Tipo de Cambio | Descripción |
|---------|---------------|-------------|
| `src/components/MiningMap.astro` | 📉 Reducción | Pasó a ser un contenedor "tonto". |
| `src/components/map/MapManager.ts` | ✨ Nuevo | Cerebro del mapa. |

---

## 📅 10 de Enero, 2026: Fragmentación de `login.astro`

**Responsable:** Agente / TITO
**Estado:** ✅ Completado

### 🎯 Objetivo
Modularizar la página de inicio de sesión para mejorar la seguridad, el manejo de estados de autenticación y la mantenibilidad.

### 🛠️ Cambios Realizados

#### 1. Creación de Componentes UI
Se dividió la interfaz en piezas reutilizables.

- `src/components/login/LoginForm.astro`
- `src/components/login/LoginHeader.astro`
- `src/components/login/WelcomeModal.astro`

#### 2. Lógica de Negocio (`LoginManager.ts`)
Se centralizó la lógica de autenticación (Supabase Auth) y validación.

- **Nuevo Archivo:** `src/components/login/LoginManager.ts`
- **Funciones:** Login, Logout, Selección de Empresa, Manejo de Errores.

### 📊 Archivos Afectados
| Archivo | Tipo de Cambio | Descripción |
|---------|---------------|-------------|
| `src/pages/login.astro` | 📉 Reducción | Orquestador principal únicamente. |
| `src/components/login/*` | ✨ Nuevos | Componentes UI y Manager. |

---

## 📅 8 de Enero, 2026: Fragmentación de `Gestión de Usuarios`

**Responsable:** Agente / TITO
**Estado:** ✅ Completado

### 🎯 Objetivo
Separar la lógica de administración de usuarios de la interfaz en `src/pages/admin/usuarios.astro`.

### 🛠️ Cambios Realizados

#### 1. Lógica de Negocio (`UsuarioManager.ts`)
Se encapsularon las operaciones CRUD y de filtrado.

- **Nuevo Archivo:** `src/utils/UsuarioManager.ts`
- **Funciones:** Cargar usuarios, Filtrar por empresa/estado, Crear/Editar Usuario (Modales).

### 📊 Archivos Afectados
| Archivo | Tipo de Cambio | Descripción |
|---------|---------------|-------------|
| `src/pages/admin/usuarios.astro` | 📉 Reducción | Eliminación de scripts inline. |
| `src/utils/UsuarioManager.ts` | ✨ Nuevo | Controlador de lógica. |

---

## 📅 [Próxima Refactorización]

*Espacio reservado para futura fragmentación*
