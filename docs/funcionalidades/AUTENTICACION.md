# Documentación: Sistema de Autenticación

El sistema implementa un modelo de autenticación basado en **sesiones de cliente (localStorage)** con un patrón Singleton para la gestión de estado y componentes de guardia para la protección de rutas.

## 1. Arquitectura General

El flujo de seguridad se compone de tres pilares:
1.  **UI de Acceso (`login.astro`):** Interfaz para credenciales y selección de empresa.
2.  **Gestor de Estado (`authStore.ts`):** Singleton que centraliza la lógica de sesión (creación, lectura, expiración).
3.  **Protección (`AuthGuard.astro`):** HOC (High Order Component) lógico que valida permisos antes de renderizar páginas protegidas.

---

## 2. Flujo de Login (`login.astro`)

La página de inicio de sesión gestiona dos "vistas" o estados visuales:
1.  **Selección de Empresa:** El usuario elige su organización (Anglo American, Besalco, Linkapsis, etc.).
2.  **Formulario de Credenciales:** Ingreso de usuario y contraseña específicos para esa empresa.

### Características
*   **Animación:** Fondo de partículas interactivo (`ParticleNetwork`).
*   **Feedback:** Validaciones visuales y mensajes de error/éxito.
*   **Redirección:** Al autenticarse exitosamente, redirige al `/` (Dashboard).

---

## 3. Gestión de Sesión (`authStore.ts`)

La lógica de negocio reside en `src/utils/authStore.ts`. Utiliza el patrón **Singleton** para asegurar una única fuente de verdad.

### Modelo de Datos (`UserSession`)
```typescript
interface UserSession {
  id: number;
  nombre_completo: string;
  empresa_id: number;
  rol_nombre: string;
  // ...otros metadatos
}
```

### Funcionalidades Clave
*   **Persistencia:** Guarda la sesión en `localStorage` bajo la clave `userSession`.
*   **Expiración Automática:**
    *   Duración por defecto: **8 horas**.
    *   Método `isSessionExpired()` verifica la validez en cada acceso.
*   **Seguridad Reactiva:** Emite eventos (`userLogin`, `userLogout`) para que la UI reaccione a cambios de estado.
*   **Helpers:**
    *   `hasRole('Admin')`: Verificación de roles.
    *   `isFromCompany(id)`: Verificación de pertenencia.

---

## 4. Protección de Rutas (`AuthGuard.astro`)

Componente que actúa como barrera de seguridad en el cliente. Se debe incluir en el `<head>` o al inicio del `<body>` de cualquier página privada.

### Uso
```astro
---
import AuthGuard from '../components/AuthGuard.astro';
---
<AuthGuard requireRole="Admin" />
```

### Lógica de Validación
1.  Verifica existencia de `localStorage.getItem('userSession')`.
2.  Parsea el JSON y comprueba `expiresAt`.
3.  Si se requieren roles específicos (`requireRole`), compara contra la sesión.
4.  **Fallo:** Redirige inmediatamente a `/login`.
5.  **Éxito:** Dispara evento `userAuthenticated` y permite la carga del contenido.

## 5. Referencias Técnicas
*   **Store:** `src/utils/authStore.ts`
*   **Guard:** `src/components/AuthGuard.astro`
*   **Página:** `src/pages/login.astro`
