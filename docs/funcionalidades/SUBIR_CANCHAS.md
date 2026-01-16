# Subir Canchas (Linkapsis)

Esta funcionalidad permite a los usuarios de **Linkapsis** realizar una carga masiva o manual de canchas y muestras al sistema. Ofrece un flujo guiado para seleccionar el tipo de carga necesaria.

## Acceso

- **Ubicación:** Dashboard principal (`index.astro`).
- **Control de Acceso:** Visible solo para usuarios de la empresa **Linkapsis**.
- **Activador:** Botón `btn-subir-canchas` ("Subir Canchas").

## Flujo de Trabajo

El modal cuenta con un sistema de navegación interna de dos a tres pasos:

1.  **Selección de Tipo:**
    - El usuario elige entre cargar una **CANCHA** o una **MUESTRA**.
    - Interfaz visual basada en Tarjetas (`.tipo-card`).

2.  **Formulario Específico:**
    - Se despliega el formulario correspondiente a la selección.
    - Botón "Volver" permite regresar a la selección de tipo.

### Formulario de Cancha

Permite registrar una nueva cancha con información detallada para control de calidad.

- **Campos Requeridos:**
    - **Muro / Sector:** Selección en cascada (el sector depende del muro).
    - **Relleno:** Texto libre.
    - **Fecha:** Selector de fecha.
    - **Foto:** Carga de imagen con previsualización (Máx 5MB).
    - **Archivo:** Archivo de datos técnicos (CSV, XLSX, ASC).
    - **Responsable:** Lista desplegable de usuarios activos de Linkapsis (cargada dinámicamente desde `/api/usuarios`).
    - **Método:** Selección ("Movimiento de Tierra", "Hidráulico").
    - **N° Capas:** Selección (1-4).

### Formulario de Muestra

Formulario simplificado para el registro de muestras.

- **Campos Requeridos:**
    - **Muro / Sector:** Selección en cascada.
    - **Relleno:** Texto.
    - **Fecha:** Selector.
    - **Foto:** Opcional.
    - **Archivo:** Requerido.

## Detalles Técnicos

### Componentes Clave

- **Modal ID:** `modal-subir-canchas`
- **Función de Inicialización:** `inicializarSubirCanchas()`
- **Lógica de Manejo:**
    - `configurarNavegacionModal()`: Maneja la visibilidad entre el selector y los formularios.
    - `configurarSelectorMuro()`: Llena dinámicamente los sectores (S1-S7 para Principal, S1-S3 para otros).
    - `cargarResponsables()`: Obtiene usuarios vía API.

### Estado de Implementación

> [!WARNING]
> Visualización y Captura Frontend Completada
> Actualmente, la lógica de envío al servidor es una simulación.

- Los formularios validan los campos `required`.
- Al enviar (`submit`), el sistema:
    1.  Previene el envío por defecto.
    2.  Captura todos los datos en un objeto JSON.
    3.  Muestra los datos en la consola del navegador para depuración.
    4.  Muestra una alerta (`alert`) indicando éxito.
    5.  Resetea el formulario.

**No existe aún un endpoint activo conectado a este formulario específico.** Se requiere implementar el backend para recibir estos datos multipart (JSON + Archivos).

## API (Usuario)

El formulario consume la siguiente API para llenar selectores:

- `GET /api/usuarios`: Para llenar el campo "Responsable".
    - Filtra usuarios donde `empresa_id === 3` (Linkapsis) y `activo === true`.

## Próximos Pasos (Implementación Backend)

Para completar esta funcionalidad se requiere:

1.  Crear endpoints para recepción de carga masiva (`POST /api/canchas/upload` o similar).
2.  Manejar la subida de archivos (imágenes y datos) al storage (Supabase Bucket).
3.  Insertar registros en la base de datos (`canchas`, `muestras`).
