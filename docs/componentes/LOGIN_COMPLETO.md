# 🔐 Documentación Completa del Login (`login.astro`)

## 📄 Descripción General
La página de login (`src/pages/login.astro`) está diseñada para manejar la autenticación multi-empresa. No es un formulario estándar, sino una experiencia en dos pasos que primero segmenta al usuario por empresa y luego solicita las credenciales específicas.

## 🎨 Experiencia de Usuario (UX)

La interfaz utiliza un diseño minimalista y moderno con:
- **Fondo Animado**: Un canvas de partículas interactivo que responde al movimiento del mouse.
- **Transiciones Suaves**: Animaciones CSS para mostrar/ocultar vistas (`fade-in`, `slideUp`).
- **Feedback Visual**:
  - Modal de bienvenida con barra de progreso.
  - Cards de empresas con efecto de "levantamiento" y glassmorphism.
  - Indicadores de carga dentro de los botones.

## 🔄 Flujo de Autenticación

1. **Carga Inicial (`checkExistingLogin`)**
   - Al cargar, el script verifica si existe una `userSession` válida en `localStorage`.
   - Si la sesión es válida y no ha expirado, redirige automáticamente al Dashboard (`/`).

2. **Paso 1: Selección de Empresa (`view-companies`)**
   - Se muestra un grid con logos de las empresas disponibles (Anglo American, Besalco, Linkapsis, Llay Llay).
   - Los logos se cargan dinámicamente desde la API `/api/empresas`.
   - **Interacción**: Al hacer clic en un logo, se guarda el `empresa.id` y se oculta esta vista.

3. **Paso 2: Formulario de Credenciales (`view-login`)**
   - Se muestra el logo de la empresa seleccionada en la cabecera.
   - Se carga dinámicamente la lista de usuarios asociados a esa empresa mediante `/api/usuarios`.
   - **Formulario**:
     - **Usuario**: Select con búsqueda (actualmente nativo).
     - **Contraseña**: Input de tipo password.
   - Botón de "Volver" permite regresar a la selección de empresa.

4. **Autenticación (`onLogin`)**
   - Se envía un POST a `/api/auth/login` con:
     ```json
     {
       "empresa_id": 123,
       "usuario_id": 456,
       "password": "..."
     }
     ```
   - **Éxito**:
     - Se guarda el objeto `userSession` en `localStorage` con fecha de expiración (8 horas).
     - Se muestra el **Modal de Bienvenida** con animación.
     - Redirección a `/` tras 2.8 segundos.
   - **Error**: Se muestra un mensaje de error en pantalla.

## 🛠️ Arquitectura Técnica

### Estructura del Código

El archivo combina HTML estático, estilos CSS scoped y lógica JavaScript encapsulada en clases.

#### 1. Markup (HTML structure)
```html
<body>
    <!-- Canvas para fondo animado -->
    <canvas id="bg-canvas"></canvas>

    <!-- Vista 1: Grid de Empresas -->
    <div id="view-companies">...</div>

    <!-- Vista 2: Formulario Login -->
    <div id="view-login" class="hidden">...</div>

    <!-- Modal de Éxito -->
    <div id="welcome-modal">...</div>
</body>
```

#### 2. Lógica JavaScript (`LoginManager`)

Todo el comportamiento está encapsulado en la clase `LoginManager` que se instancia al cargar el DOM.

**Métodos Principales:**
- `init()`: Inicializa partículas, eventos y verifica sesión.
- `cargarEmpresas()`: Fetch a `/api/empresas` y renderiza las cards.
- `selectCompany(empresa, logoSrc)`: Transición entre vistas y carga de usuarios.
- `loadUsuarios(empresaId)`: Fetch a `/api/usuarios` filtado por empresa.
- `onLogin(event)`: Maneja el submit, loading state y respuesta del servidor.

#### 3. Animación de Fondo (`ParticleNetwork`)

Clase dedicada a dibujar y animar el canvas del fondo.
- Genera partículas aleatorias.
- Dibuja líneas de conexión entre partículas cercanas.
- Implementa repulsión/atracción al mouse.

### Estilos (CSS)

- **Hover Effect Refinado**: Se busca una sensación "premium" y sutil.
  - Elevación suave: `translateY(-8px)` (en lugar de saltos bruscos).
  - Escala ligera: `scale(1.02)`.
  - Sombras multicapa: Combinación de sombra difusa y borde sutil (`0 0 0 1px`).
- **Backdrop Filter**: Se usa `backdrop-filter: blur(12px)` para el efecto de vidrio en las tarjetas.
- **Layout**: Diseño Grid responsive que se adapta para mostrar tarjetas rectangulares (aprox 2:1 ratio) optimizando el espacio vertical.
- **Gradientes**: Uso extensivo de gradientes sutiles para fondos y borders.
- **Animaciones Keyframes**:
  - `fadeIn`: Entrada suave de elementos.
  - `slideUp`: Aparición del formulario desde abajo.
  - `bounceIcon`: Animación del icono en el modal de éxito.

## 🔌 APIs Utilizadas

- `GET /api/empresas`: Listado de empresas para el grid inicial.
- `GET /api/usuarios?empresa_id={id}&activo=true`: Usuarios filtrados para el select.
- `POST /api/auth/login`: Validación de credenciales.

## 🔒 Seguridad

- **Sesión de Cliente**: La sesión persiste en `localStorage` pero **AuthGuard** (en el servidor) vuelve a validar permisos en cada navegación crítica.
- **Sanitización**: Los inputs se procesan como JSON.
- **Feedback de Error**: Mensajes genéricos para no revelar si el usuario existe o no (aunque el listado de usuarios es visible por diseño actual, esto es un punto a considerar si se requiere mayor privacidad).

## 🚀 Posibles Mejoras
- [ ] Implementar caché para la lista de empresas y usuarios para acelerar la carga.
- [ ] Agregar "Olvide mi contraseña".
- [ ] Transformar el select de usuarios en un combobox con autocompletado para cuando escale el número de usuarios.
