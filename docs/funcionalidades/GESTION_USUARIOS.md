# Funcionalidad: Gestión de Usuarios

Esta funcionalidad proporciona una interfaz administrativa para gestionar las cuentas de usuario del sistema. Permite listar, crear, editar y cambiar el estado (activo/inactivo) de los usuarios, asignándoles empresas y roles específicos.

## Descripción General

- **Acceso:** Botón "👥 Gestión Usuarios" en el header del Dashboard (o ruta directa `/admin/usuarios`).
- **Ruta:** `src/pages/admin/usuarios.astro`.
- **Restricción:** Acceso protegido mediante `AuthGuard`. Solo usuarios con permisos de administración pueden acceder.

## Características Principales

### 1. Listado de Usuarios
*   Visualización tabular de todos los usuarios registrados.
*   Columnas: Nombre, Empresa, Rol, Email, Estado, Fecha Creación, Acciones.
*   Indicadores visuales de estado (Activo/Inactivo).

### 2. Filtros
Permite filtrar la lista de usuarios para facilitar la gestión:
*   **Por Empresa:** Desplegable para ver usuarios de una empresa específica.
*   **Por Estado:** Filtrar usuarios Activos o Inactivos.

### 3. Creación y Edición (CRUD)
*   **Nuevo Usuario:** Modal para registrar un nuevo usuario.
    *   Campos: Nombre Completo, Email, Empresa, Rol.
*   **Edición:** Permite modificar los datos de un usuario existente.
*   **Gestión de Estado:** Checkbox para activar o desactivar el acceso de un usuario.

## Aspectos Técnicos

### Frontend (`usuarios.astro`)

*   **Clase Principal:** `UsuarioManager` maneja toda la lógica de la página.
*   **Componentes UI:**
    *   `#usuarios-tbody`: Contenedor de la tabla dinámica.
    *   `#usuario-modal`: Modal reutilizable para creación y edición.
    *   `#form-usuario`: Formulario de datos con validación HTML5.

*   **Estilos:**
    *   Uso de variables CSS para consistencia.
    *   Animación de fondo de partículas (`particles-canvas`) consistente con el diseño del Login.

### Seguridad

*   **AuthGuard:** Componente que verifica la sesión del usuario antes de renderizar la página.
*   **Roles:** El frontend valida permisos para mostrar/ocultar botones críticos (aunque la seguridad final reside en el backend).

### Interacción con API (Estimada)

El frontend interactúa con endpoints de administración (probablemente `/api/usuarios` o `/api/admin/users`) para realizar las operaciones:
*   `GET`: Obtener lista de usuarios.
*   `POST`: Crear nuevo usuario.
*   `PUT/PATCH`: Actualizar usuario existente.
