# Subir Revanchas (Linkapsis)

Esta funcionalidad permite a los usuarios de **Linkapsis** cargar información masiva de revanchas mediante archivos Excel/CSV. El sistema procesa el archivo, valida su estructura, extrae datos, muestra una previsualización con estadísticas y gráficos, y finalmente guarda la información en la base de datos.

## Acceso

- **Ubicación:** Dashboard principal (`index.astro`).
- **Control de Acceso:** Visible solo para usuarios de la empresa **Linkapsis**.
- **Activador:** Botón `btn-subir-revanchas` ("Subir Revanchas").

## Flujo de Trabajo

1.  **Apertura del Modal:** El usuario presiona el botón "Subir Revanchas".
2.  **Selección de Muro:** Se selecciona el muro correspondiente ("Principal", "Este", "Oeste").
    - *Nota:* El selector de archivo se habilita solo después de seleccionar un muro.
3.  **Carga de Archivo:** Se selecciona un archivo (`.csv`, `.xlsx`, `.xls`).
4.  **Procesamiento y Validación:**
    - El frontend lee el archivo usando `SheetJS`.
    - Valida que la estructura del Excel coincida con la configuración esperada para el muro seleccionado (filas de inicio/fin, columnas específicas).
    - Extrae la fecha de medición (celda combinada `F6-M7` típicamente).
5.  **Previsualización:**
    - Se muestra una tabla con los datos extraídos (color coded según umbrales de seguridad).
    - Se generan tablas de resumen estadístico (Mín/Máx por parámetro y por sector).
    - Se genera un gráfico de perfil de elevaciones usando `Chart.js`.
6.  **Guardado:** El usuario confirma y los datos se envían al backend (`/api/revanchas`).

## Detalles Técnicos

### Componentes Clave

- **Modal ID:** `modal-subir-revanchas`
- **Función de Inicialización:** `inicializarRevanchas()` (JavaScript en `src/pages/index.astro`).
- **Librerías:**
    - `XLSX` (SheetJS): Para lectura y parseo de Excel.
    - `Chart.js`: Para el gráfico de perfil.

### Lógica de Procesamiento

El sistema utiliza configuraciones predefinidas (`CONFIGURACIONES_MURO`) para saber cómo leer cada tipo de archivo según el muro:

```javascript
const CONFIGURACIONES_MURO = {
  principal: {
    nombre: "Muro Principal",
    headerRow: 10,
    dataStartRow: 11,
    dataEndRow: 153, // Varía según muro
    sectores: [
      { num: 1, startRow: 11, endRow: 32 },
      { num: 2, startRow: 33, endRow: 56 },
      // ...
    ],
    columns: {
      sector: "A",
      coronamiento: "B",
      revancha: "C",
      lama: "D",
      ancho: "E",
      pk: "F",
      geomembrana: "G",
      distGeoLama: "H",
      distGeoCoronamiento: "I",
    }
    // ...
  }
};
```

### Validaciones

- **Formato de Archivo:** Debe ser Excel o CSV.
- **Estructura:** Se verifican headers específicos en filas predeterminadas.
- **Fecha:** Se intenta extraer y formatear la fecha desde celdas específicas.
- **Semáforo de Valores:**
    - **Revancha:** < 3.0 (Rojo), 3.0-3.5 (Amarillo), > 3.5 (Verde).
    - **Ancho:** < 15 (Rojo), 15-18 (Amarillo), > 18 (Verde).
    - **Dist. Geo-Coronamiento:** < 0.5 (Rojo), 0.5-1.0 (Amarillo).

## Interacción con Base de Datos (Backend)

El endpoint `/api/revanchas` gestiona la persistencia de datos utilizando **Supabase**. La operación es transaccional y robusta:

### Tablas Involucradas

1.  **`revanchas_archivos` (Metadata)**
    - Se crea un registro inicial con la información del archivo (`nombre`, `tipo`, `muro`, `fecha`, `usuario_id`).
    - **Validación:** Se verifica que no exista un archivo duplicado (muro + fecha) para evitar redundancia.

2.  **`revanchas_mediciones` (Datos Masivos)**
    - Se insertan todos los registros procesados (filas del Excel) vinculados al ID del archivo creado.
    - Campos almacenados: `sector`, `pk`, `coronamiento`, `revancha`, `lama`, `ancho`, `geomembrana`, `dist_geo_lama`, `dist_geo_coronamiento`.
    - **Rollback:** Si la inserción de mediciones falla, el sistema elimina automáticamente el registro de archivo creado para mantener la consistencia.

3.  **`revanchas_estadisticas` (Automático)**
    - **Triggers:** La base de datos cuenta con triggers que calculan estadísticas automáticamente tras la inserción de mediciones.
    - El backend recupera estas estadísticas recién calculadas para devolverlas en la respuesta al cliente.

### Vista de Consulta

- **`vista_revanchas_archivos`**: Utilizada por el endpoint `GET /api/revanchas` para listar el historial de cargas, permitiendo filtros por muro y rango de fechas.

## Interacción con API

### Subir Revancha

**Endpoint:** `POST /api/revanchas`

**Payload:**

```json
{
  "muro": "principal",        // Tipo de muro
  "fechaMedicion": "2024-03-20", // Fecha ISO
  "archivoNombre": "reporte.xlsx",
  "archivoTipo": "XLSX",
  "datos": [
    {
      "sector": 1,
      "coronamiento": 745.2,
      "revancha": 3.8,
      "lama": 741.0,
      "ancho": 20.5,
      "pk": "0+100",
      "geomembrana": 744.0,
      "distGeoLama": 3.0,
      "distGeoCoronamiento": 1.2
    }
    // ... array de objetos
  ],
  "usuarioId": 123
}
```

**Respuesta Exitosa:**

```json
{
  "mensaje": "Datos guardados correctamente",
  "data": {
    "totalRegistros": 150,
    "estadisticas": { ... }
  }
}
```
