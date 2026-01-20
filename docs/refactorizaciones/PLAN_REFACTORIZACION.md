# 📋 Plan Maestro de Refactorización

Este documento rastrea el estado global de la migración desde un `index.astro` monolítico hacia una arquitectura modular basada en Managers y Componentes.

## 📊 Estado General
- **Progreso:** 45% Completado
- **Objetivo:** Eliminar toda lógica de negocio compleja de `src/pages/index.astro`.

---

## 🟢 Completado

Estos módulos ya fueron extraídos, tienen su propio Manager y están registrados en la `BITACORA_REFACTORIZACION.md`.

- [x] **Gestión de Usuarios**
  - **Código:** `src/utils/UsuarioManager.ts`
  - **Fecha:** 08 Ene 2026

- [x] **Autenticación (Login)**
  - **Código:** `src/components/login/LoginManager.ts`
  - **Fecha:** 10 Ene 2026

- [x] **Mapa Minero (Visualización)**
  - **Código:** `src/components/map/MapManager.ts`
  - **Fecha:** 14 Ene 2026

- [x] **Crear Cancha**
  - **Código:** `src/utils/CreateCanchaManager.ts`
  - **Fecha:** 16 Ene 2026

- [x] **API Cancha Endpoint**
  - **Código:** `src/pages/api/canchas.ts`
  - **Fecha:** 16 Ene 2026

- [x] **Widgets y Filtros (Estabilización)**
  - **Código:** `src/utils/FilterManager.ts` (Correcciones) y `src/pages/index.astro` (UI Logic)
  - **Fecha:** 20 Ene 2026
  - *Nota:* Funcionalidad estable. Pendiente refactorización de UI a componente aislado.

---

## 🔴 Pendiente (Prioridad Alta)

Estas funcionalidades siguen "viviendo" dentro de `src/pages/index.astro` y deben ser extraídas.

### 1. Tablas y Listados
- [ ] **Tabla Principal de Canchas** (`TableManager`)
  - **Estado Actual:** Función `renderizarCanchas()` gigante en index.astro.
  - **Meta:** Crear componente `<CanchasTable />` y `TableManager.ts` para paginación y renderizado.

### 2. Filtros y Control
- [ ] **Filtros y Estadísticas (Refactor UI Complleto)** (`FilterManager`)
  - **Estado Actual:** Lógica de negocio en `FilterManager` (OK), pero actualización de UI todavía en `index.astro` (`actualizarWidgetsEstado`).
  - **Meta:** Mover lógica de UI a un componente Dashboard dedicado (ej: `WidgetsEstados.astro`).
  - **Incluye:** Widgets de Estado (contadores circulares).

### 3. Importación de Datos
- [ ] **Subir Canchas (CSV/Excel)** (`ImportManager` o `CanchaUploader`)
  - **Estado Actual:** Lógica `subirCanchas` inline manejando parsing de archivos.
  - **Meta:** Mover a un servicio de utilidad o manager dedicado.

- [ ] **Subir Revanchas** (`RevanchaUploader`)
  - **Estado Actual:** Scripts dispersos para el modal de revanchas de Linkapsis.
  - **Meta:** Unificar con la lógica de subida de canchas o crear manager separado.

---

## 🟡 Futuras Mejoras (Prioridad Media)

- [ ] **Sistema de Notificaciones**
  - Centralizar todos los `Toast` o alertas en un `NotificationManager` global.
  
- [ ] **Optimizaciones de Rendimiento**
  - Lazy loading de componentes pesados (como el Mapa).

---

> **Nota:** Al completar cada item:
> 1. Marcarlo con `[x]` aquí.
> 2. Agregar entrada detallada en `BITACORA_REFACTORIZACION.md`.
> 3. Verificar que la documentación en `docs/funcionalidades/` esté actualizada.
