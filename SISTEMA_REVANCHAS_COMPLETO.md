# 📊 SISTEMA DE REVANCHAS - DOCUMENTACIÓN COMPLETA

## 🎯 Descripción General

Sistema completo para gestión de mediciones de revanchas de muros (Principal, Este, Oeste) en mina AngloAmerican. Permite:

- ✅ Carga de archivos Excel/CSV con mediciones
- ✅ Validación automática de estructura
- ✅ Cálculo automático de estadísticas (min/max/promedio por sector y global)
- ✅ Visualización con colores condicionales según umbrales de seguridad
- ✅ Comparación entre mediciones de diferentes fechas
- ✅ Almacenamiento histórico para análisis de tendencias
- 🔄 **Futuro:** Georreferenciación de puntos PK, gráficos de tendencias, alertas automáticas

---

## 📁 Estructura de Archivos

```
canchas-anglo2/
├── src/
│   ├── pages/
│   │   ├── index.astro                    # Frontend con modal Subir Revanchas
│   │   └── api/
│   │       └── revanchas/
│   │           ├── index.ts               # GET (listar) y POST (crear archivo)
│   │           ├── [id].ts                # GET (detalle) y DELETE (eliminar)
│   │           └── comparar.ts            # GET y POST (comparaciones)
│   └── lib/
│       └── supabase.ts                    # Cliente Supabase
└── migracion_revanchas_COMPLETA_FINAL.sql # Script de migración SQL

```

---

## 🗄️ Esquema de Base de Datos

### Tabla: `revanchas_archivos`
Metadata de archivos subidos.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PRIMARY KEY | ID único |
| `muro` | VARCHAR(50) | 'Principal', 'Este', 'Oeste' |
| `fecha_medicion` | DATE | Fecha extraída del Excel (celda F6) |
| `archivo_nombre` | VARCHAR(255) | Nombre del archivo original |
| `archivo_tipo` | VARCHAR(10) | 'CSV' o 'XLSX' |
| `total_registros` | INTEGER | Número de filas procesadas |
| `sectores_incluidos` | TEXT[] | Array de sectores encontrados |
| `usuario_id` | INTEGER | FK a `usuarios(id)` |
| `created_at` | TIMESTAMP | Auto |
| `updated_at` | TIMESTAMP | Auto (trigger) |

**Constraints:**
- UNIQUE: `(muro, fecha_medicion)` ⚠️ Solo un archivo por muro por fecha
- CHECK: `muro IN ('Principal', 'Este', 'Oeste')`

---

### Tabla: `revanchas_mediciones`
Datos individuales de cada fila del Excel.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PRIMARY KEY | ID único |
| `archivo_id` | INTEGER | FK a `revanchas_archivos(id)` ON DELETE CASCADE |
| `sector` | VARCHAR(10) | Número de sector (1-7 para Principal) |
| `pk` | VARCHAR(20) | Progressive Kilometer (progresiva) |
| `coronamiento` | DECIMAL(10,3) | Cota del coronamiento (m) |
| `revancha` | DECIMAL(10,3) | 🎯 **Revancha (m)** - COLUMNA CRÍTICA |
| `lama` | DECIMAL(10,3) | Cota de la lama (m) |
| `ancho` | DECIMAL(10,3) | 🎯 **Ancho de cubeta (m)** - COLUMNA CRÍTICA |
| `geomembrana` | DECIMAL(10,3) | Cota de geomembrana (m) |
| `dist_geo_lama` | DECIMAL(10,3) | Distancia geomembrana-lama (m) |
| `dist_geo_coronamiento` | DECIMAL(10,3) | Distancia geomembrana-coronamiento (m) |
| `created_at` | TIMESTAMP | Auto |

**Constraints:**
- UNIQUE: `(archivo_id, sector, pk)` - No duplicados por archivo

---

### Tabla: `revanchas_estadisticas`
Estadísticas globales calculadas **automáticamente** por trigger.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `archivo_id` | INTEGER UNIQUE | FK a `revanchas_archivos(id)` |
| `revancha_min/max/promedio` | DECIMAL(10,3) | Stats de revancha |
| `revancha_pk_min/max` | VARCHAR(20) | PK donde ocurren min/max |
| `ancho_min/max/promedio` | DECIMAL(10,3) | Stats de ancho |
| `ancho_pk_min/max` | VARCHAR(20) | PK donde ocurren min/max |
| `coronamiento_min/max/promedio` | DECIMAL(10,3) | Stats de coronamiento |
| `coronamiento_pk_min/max` | VARCHAR(20) | PK donde ocurren min/max |

🤖 **Auto-calculado por trigger `trigger_calcular_estadisticas_insert`**

---

### Tabla: `revanchas_estadisticas_sector`
Estadísticas por sector calculadas **automáticamente** por trigger.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `archivo_id` | INTEGER | FK a `revanchas_archivos(id)` |
| `sector` | VARCHAR(10) | Sector (1-7) |
| `revancha_min/max` + `pk_min/max` | DECIMAL + VARCHAR | Stats por sector |
| `ancho_min/max` + `pk_min/max` | DECIMAL + VARCHAR | Stats por sector |
| `coronamiento_min/max` + `pk_min/max` | DECIMAL + VARCHAR | Stats por sector |

**Constraints:**
- UNIQUE: `(archivo_id, sector)`

---

### Tabla: `revanchas_comparaciones`
Comparaciones entre archivos de diferentes fechas.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `archivo_anterior_id` | INTEGER | FK a `revanchas_archivos(id)` |
| `archivo_actual_id` | INTEGER | FK a `revanchas_archivos(id)` |
| `sector` | VARCHAR(10) | Sector |
| `pk` | VARCHAR(20) | PK |
| `diff_coronamiento/revancha/lama/ancho` | DECIMAL(10,3) | Diferencias calculadas |
| `alerta_revancha/ancho/coronamiento` | BOOLEAN | TRUE si diff > umbral |

**Umbrales de Alerta:**
- Revancha: ±0.3m
- Ancho: ±1.0m
- Coronamiento: ±0.5m

---

### Vistas SQL

#### `vista_revanchas_archivos`
Archivos con nombre de usuario que lo subió.

#### `vista_ultimas_mediciones`
Última medición por muro (DISTINCT ON).

#### `vista_mediciones_completas`
Mediciones con clasificación de color incluida:
- `clasificacion_revancha`: 'VERDE' | 'AMARILLO' | 'ROJO'
- `clasificacion_ancho`: 'VERDE' | 'AMARILLO' | 'ROJO'
- `clasificacion_dist_geo`: 'SIN_COLOR' | 'AMARILLO' | 'ROJO'

#### `vista_comparacion_ultimas_mediciones`
Comparación automática entre últimas 2 mediciones por muro.

---

## 🎨 Lógica de Colores Condicionales

### Revancha (m)
```
🟢 VERDE:    > 3.5
🟡 AMARILLO: 3.0 - 3.5
🔴 ROJO:     < 3.0
```

### Ancho (m)
```
🟢 VERDE:    > 18
🟡 AMARILLO: 15 - 18
🔴 ROJO:     < 15
```

### Dist Geo-Coronamiento (m)
```
⚪ SIN COLOR: > 1
🟡 AMARILLO:  0.5 - 1
🔴 ROJO:      < 0.5
```

---

## 📋 API Endpoints

### `POST /api/revanchas`
Crear nuevo archivo de revanchas.

**Request Body:**
```json
{
  "muro": "principal",
  "fechaMedicion": "2024-12-04",
  "archivoNombre": "Muro_Principal_Dec2024.xlsx",
  "archivoTipo": "XLSX",
  "datos": [
    {
      "sector": "1",
      "pk": "0+000",
      "coronamiento": 742.5,
      "revancha": 3.8,
      "lama": 738.7,
      "ancho": 19.2,
      "geomembrana": 740.1,
      "distGeoLama": 1.4,
      "distGeoCoronamiento": 2.4
    }
    // ... más filas
  ],
  "usuarioId": 5
}
```

**Response (201):**
```json
{
  "success": true,
  "mensaje": "Archivo procesado exitosamente",
  "data": {
    "archivoId": 12,
    "muro": "Principal",
    "fechaMedicion": "2024-12-04",
    "totalRegistros": 73,
    "sectores": ["1", "2", "3", "4", "5", "6", "7"],
    "estadisticas": {
      "revancha_min": 2.8,
      "revancha_max": 4.5,
      "revancha_promedio": 3.6,
      // ...
    }
  }
}
```

**Errores:**
- `400`: Campos faltantes o inválidos
- `409`: Archivo duplicado (muro + fecha ya existe)
- `500`: Error de servidor

---

### `GET /api/revanchas`
Listar archivos con filtros opcionales.

**Query Params:**
- `muro`: 'Principal' | 'Este' | 'Oeste'
- `fechaDesde`: 'YYYY-MM-DD'
- `fechaHasta`: 'YYYY-MM-DD'

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "muro": "Principal",
      "fecha_medicion": "2024-12-04",
      "archivo_nombre": "Muro_Principal_Dec2024.xlsx",
      "archivo_tipo": "XLSX",
      "total_registros": 73,
      "sectores_incluidos": ["1", "2", "3", "4", "5", "6", "7"],
      "subido_por": "Juan Pérez",
      "created_at": "2024-12-04T14:30:00Z"
    }
  ]
}
```

---

### `GET /api/revanchas/[id]`
Obtener detalle completo de un archivo.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "archivo": { /* metadata */ },
    "mediciones": [ /* array de mediciones */ ],
    "estadisticas": { /* stats globales */ },
    "estadisticasSector": [ /* stats por sector */ ]
  }
}
```

---

### `DELETE /api/revanchas/[id]`
Eliminar archivo (CASCADE elimina mediciones y estadísticas).

**Response (200):**
```json
{
  "success": true,
  "mensaje": "Archivo eliminado exitosamente"
}
```

---

### `GET /api/revanchas/comparar`
Comparar mediciones entre dos archivos.

**Opción 1 - Por IDs:**
```
GET /api/revanchas/comparar?anteriorId=10&actualId=12
```

**Opción 2 - Por Muro (automático últimas 2):**
```
GET /api/revanchas/comparar?muro=Principal
```

**Response (200):**
```json
{
  "success": true,
  "metadata": {
    "anterior": { "id": 10, "muro": "Principal", "fecha": "2024-11-15" },
    "actual": { "id": 12, "muro": "Principal", "fecha": "2024-12-04" }
  },
  "resumen": {
    "totalPuntos": 73,
    "puntosConAlertas": 5,
    "alertasPorTipo": {
      "revancha": 2,
      "ancho": 3,
      "coronamiento": 1
    },
    "umbrales": {
      "revancha": 0.3,
      "ancho": 1.0,
      "coronamiento": 0.5
    }
  },
  "comparaciones": [
    {
      "sector": "1",
      "pk": "0+000",
      "anterior": { "revancha": 3.5, "ancho": 18.5 },
      "actual": { "revancha": 3.2, "ancho": 17.8 },
      "diferencias": { "revancha": -0.3, "ancho": -0.7 },
      "alertas": { "revancha": true, "ancho": false },
      "tieneAlertas": true
    }
  ]
}
```

---

### `POST /api/revanchas/comparar`
Guardar comparación en DB.

**Request Body:**
```json
{
  "anteriorId": 10,
  "actualId": 12
}
```

**Response (201):**
```json
{
  "success": true,
  "mensaje": "Comparación guardada exitosamente",
  "totalRegistros": 73
}
```

---

## 🚀 Flujo de Uso Completo

### 1. Usuario Carga Archivo
1. Usuario de Linkapsis abre modal "Subir Revanchas"
2. Selecciona tipo de muro: Principal / Este / Oeste
3. Carga archivo Excel (.xlsx) o CSV
4. Frontend valida estructura con SheetJS:
   - Headers en fila correcta (12 para Principal/Este, 9 para Oeste)
   - Columnas: Sector, Coronamiento, Revancha, Lama, Ancho, PK, etc.
5. Frontend extrae:
   - Fecha de celda F6 (combinada F6-M7)
   - Datos de filas 13-85 (Principal), 10-45 (Oeste), 13-41 (Este)
   - Asigna sector según rangos de filas
6. Muestra preview con:
   - Tabla principal con colores condicionales
   - Tabla resumen global (min/max/promedio con PK)
   - Tabla resumen por sectores
   - Gráfico Chart.js de perfil (Coronamiento, Geomembrana, Lama)

### 2. Usuario Procesa Datos
1. Click en botón "Procesar Datos"
2. Frontend convierte fecha "dd-mm-yyyy" → "yyyy-mm-dd"
3. POST a `/api/revanchas` con:
   - Muro, fecha, nombre archivo, tipo, datos[], usuarioId
4. Backend:
   - Inserta en `revanchas_archivos`
   - Inserta masivo en `revanchas_mediciones`
   - **Trigger automático** calcula estadísticas
5. Frontend muestra mensaje de éxito y cierra modal

### 3. Sistema Auto-Calcula Estadísticas
**Trigger `trigger_calcular_estadisticas_insert`:**
- Se dispara AFTER INSERT en `revanchas_mediciones`
- Calcula MIN, MAX, AVG de Revancha, Ancho, Coronamiento
- Encuentra PK donde ocurren min/max
- Inserta en `revanchas_estadisticas` (global)
- Inserta en `revanchas_estadisticas_sector` (por cada sector)

### 4. Comparación Entre Fechas (Futuro)
1. Usuario selecciona muro
2. GET `/api/revanchas/comparar?muro=Principal`
3. Backend:
   - Obtiene últimas 2 mediciones del muro
   - Compara punto por punto (sector + pk)
   - Calcula diferencias
   - Detecta alertas según umbrales
4. Frontend muestra:
   - Tabla comparativa
   - Gráficos de tendencias
   - Puntos con alertas resaltados

---

## 📊 Configuración por Muro

### Muro Principal
```javascript
{
  nombre: "Muro Principal",
  headerRow: 12,
  dataStartRow: 13,
  dataEndRow: 85,
  totalFilas: 73,
  sectores: 7,
  dateCell: "F6",
  columns: {
    sector: "A",
    coronamiento: "C",  // ⚠️ Columna C (diferente de Oeste)
    revancha: "E",
    lama: "F",
    ancho: "H",
    pk: "I",
    geomembrana: "J",
    distGeoLama: "K",
    distGeoCoronamiento: "L"
  }
}
```

### Muro Oeste
```javascript
{
  nombre: "Muro Oeste",
  headerRow: 9,        // ⚠️ Fila 9 (diferente)
  dataStartRow: 10,
  dataEndRow: 45,
  totalFilas: 36,
  sectores: 3,
  dateCell: "F6",
  columns: {
    sector: "A",
    coronamiento: "B",  // ⚠️ Columna B (diferente)
    revancha: "E",
    lama: "F",
    ancho: "H",
    pk: "I",
    geomembrana: "J",
    distGeoLama: "K",
    distGeoCoronamiento: "L"
  }
}
```

### Muro Este
```javascript
{
  nombre: "Muro Este",
  headerRow: 12,
  dataStartRow: 13,
  dataEndRow: 41,
  totalFilas: 29,
  sectores: 3,
  dateCell: "F6",
  columns: {
    sector: "A",
    coronamiento: "C",
    revancha: "E",
    lama: "F",
    ancho: "H",
    pk: "I",
    geomembrana: "J",
    distGeoLama: "K",
    distGeoCoronamiento: "L"
  }
}
```

---

## 🔒 Seguridad (RLS)

**Políticas actuales:**
- Lectura: Todos pueden leer (`FOR SELECT USING (true)`)
- Escritura: Todos pueden insertar/actualizar (`FOR ALL USING (true)`)

**Recomendaciones futuras:**
```sql
-- Solo Linkapsis puede insertar
CREATE POLICY "Solo Linkapsis inserta" ON revanchas_archivos
  FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT id FROM usuarios WHERE empresa_id = (SELECT id FROM empresas WHERE nombre = 'Linkapsis')));

-- Solo dueño o admin puede eliminar
CREATE POLICY "Solo dueño elimina" ON revanchas_archivos
  FOR DELETE 
  USING (usuario_id = auth.uid() OR auth.uid() IN (SELECT id FROM usuarios WHERE rol = 'admin'));
```

---

## 🎯 Funcionalidades Futuras

### 1. Georreferenciación de PK
- Agregar columnas `lat` y `lon` a `revanchas_mediciones`
- Importar coordenadas desde GIS
- Visualizar puntos en Mapbox con colores según clasificación
- Click en punto → mostrar histórico de ese PK

### 2. Gráficos de Tendencias
- Evolución temporal de Revancha por sector
- Gráfico de líneas con Chart.js
- Filtrar por rango de fechas
- Comparar múltiples sectores

### 3. Dashboard de Alertas
- Vista dedicada con tabla de puntos críticos
- Filtros por muro, sector, tipo de alerta
- Exportar a PDF/Excel
- Envío de notificaciones por email

### 4. Análisis Predictivo
- Calcular tendencia (lineal, polinomial)
- Predecir fecha cuando Revancha < 3.0
- Alertas tempranas basadas en velocidad de cambio

### 5. Gestión de Versiones
- Marcar archivos como "oficial" vs "borrador"
- Sistema de aprobación (workflow)
- Historial de cambios con diff visual

### 6. Exportación Avanzada
- Generar reportes PDF automáticos
- Templates personalizados por empresa
- Exportar comparaciones a Excel con gráficos
- API para integración con otros sistemas

---

## 🛠️ Instalación y Uso

### 1. Aplicar Migración SQL
```bash
# En Supabase SQL Editor, ejecutar:
migracion_revanchas_COMPLETA_FINAL.sql
```

**Verificar creación:**
```sql
SELECT * FROM information_schema.tables 
WHERE table_name LIKE 'revanchas_%';

SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE '%revanchas%';
```

### 2. Verificar API Endpoints
```bash
# Listar archivos
curl http://localhost:4321/api/revanchas

# Subir archivo (ejemplo con datos mock)
curl -X POST http://localhost:4321/api/revanchas \
  -H "Content-Type: application/json" \
  -d '{"muro":"principal","fechaMedicion":"2024-12-04",...}'
```

### 3. Probar en Frontend
1. Login como usuario Linkapsis
2. Click en botón "Subir Revanchas"
3. Seleccionar muro
4. Cargar archivo Excel
5. Verificar preview
6. Click "Procesar Datos"
7. Verificar en Supabase:
```sql
SELECT * FROM revanchas_archivos ORDER BY created_at DESC LIMIT 1;
SELECT * FROM revanchas_estadisticas ORDER BY created_at DESC LIMIT 1;
```

---

## 📝 Notas Técnicas

### SheetJS (XLSX.read)
- Versión: 0.20.1 (CDN)
- Lee Excel y CSV
- Convierte números de serie de Excel a fechas
- Maneja celdas vacías/null correctamente

### Chart.js
- Gráfico de líneas para perfil de elevaciones
- Ejes: X = PK, Y = Cota (m)
- 3 datasets: Coronamiento, Geomembrana, Lama
- Tooltips con valores formateados a 3 decimales

### Triggers SQL
- `trigger_calcular_estadisticas_insert`: AFTER INSERT
- `trigger_calcular_estadisticas_delete`: AFTER DELETE
- `trigger_update_revanchas_archivos_updated_at`: BEFORE UPDATE
- Todos usan `LANGUAGE plpgsql`

### Performance
- Índices en columnas más consultadas
- `ON DELETE CASCADE` para limpieza automática
- Batch insert de mediciones (1 query para todas)
- Vistas materializadas no usadas (actualización en tiempo real)

---

## 🐛 Troubleshooting

### Error: "Ya existe un archivo para [muro] con fecha [fecha]"
**Causa:** Constraint `UNIQUE (muro, fecha_medicion)`
**Solución:** 
- Cambiar fecha en Excel (celda F6)
- O eliminar archivo anterior
- O modificar constraint si necesitas múltiples versiones por día

### Error: "Header no encontrado en [celda]"
**Causa:** Estructura de Excel no coincide con configuración
**Solución:**
- Verificar que headers estén en fila correcta (12 o 9)
- Verificar nombres de columnas (Sector, Coronamiento, Revancha, Lama)
- Revisar `CONFIGURACIONES_MURO` en `index.astro`

### Estadísticas no se calculan
**Causa:** Trigger no se ejecutó o error en SQL
**Solución:**
```sql
-- Verificar triggers
SELECT * FROM pg_trigger WHERE tgname LIKE '%revanchas%';

-- Recalcular manualmente
SELECT calcular_estadisticas_archivo();
```

### Archivo muy grande (timeout)
**Causa:** INSERT masivo toma mucho tiempo
**Solución:**
- Dividir en batches de 100 filas
- Usar transacciones
- Aumentar timeout en API

---

## 📞 Soporte

**Desarrollador:** GitHub Copilot + Claude Sonnet 4.5
**Fecha Creación:** 4 de Diciembre, 2024
**Versión:** 1.0.0

**Archivos Clave:**
- `src/pages/index.astro` (líneas 3976-4076, 8225-9000)
- `src/pages/api/revanchas/index.ts`
- `src/pages/api/revanchas/[id].ts`
- `src/pages/api/revanchas/comparar.ts`
- `migracion_revanchas_COMPLETA_FINAL.sql`

---

## ✅ Checklist de Implementación

- [x] Crear tablas SQL (5 tablas)
- [x] Crear índices (6 índices)
- [x] Crear triggers (3 triggers)
- [x] Crear vistas (4 vistas)
- [x] Configurar RLS (5 políticas)
- [x] Crear API POST /api/revanchas
- [x] Crear API GET /api/revanchas
- [x] Crear API GET /api/revanchas/[id]
- [x] Crear API DELETE /api/revanchas/[id]
- [x] Crear API GET /api/revanchas/comparar
- [x] Crear API POST /api/revanchas/comparar
- [x] Integrar botón "Procesar Datos"
- [x] Validación de fechas (dd-mm-yyyy → yyyy-mm-dd)
- [x] Manejo de errores (duplicados, validación)
- [x] Documentación completa
- [ ] **Próximo:** Georreferenciación de PK
- [ ] **Próximo:** Dashboard de comparaciones
- [ ] **Próximo:** Gráficos de tendencias temporales
- [ ] **Próximo:** Alertas automáticas por email
- [ ] **Próximo:** Exportación a PDF

---

**FIN DE DOCUMENTACIÓN** 🎉
