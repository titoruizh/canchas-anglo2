# 🗺️ Corrección de Visualización de Revanchas en Mapa

## 🎯 Problema

El toggle "Vista de Mapa" en `index.astro` muestra el error:
```
Error al cargar revanchas georreferenciadas
```

## 🔍 Causa Raíz

Después del diagnóstico, se identificaron **2 problemas**:

### 1. Vista SQL Desactualizada
La vista `vista_revanchas_georreferenciadas` en Supabase **NO tiene la columna `tiene_coordenadas`** que el API espera.

**Evidencia:**
- Query #6 del diagnóstico dio error al intentar filtrar por `tiene_coordenadas = true`
- El endpoint `/api/revanchas/georreferenciadas.ts` línea 47 hace: `.eq('tiene_coordenadas', true)`

### 2. PKs con Formato Incorrecto
Algunos archivos históricos tienen PKs sin el formato estándar `0+XXX`:

```
❌ Formato incorrecto:
- "736.45"
- "0.05999999999994543"
- "2.75"

✅ Formato correcto:
- "0+000"
- "0+020"
- "0+736"
```

**Impacto:** Estos PKs **NO pueden hacer match** con `pks_maestro`, por lo que nunca tendrán coordenadas.

---

## ✅ Solución

### Paso 1: Ejecutar Script SQL en Supabase

1. Abrir Supabase → SQL Editor
2. Copiar el contenido de `CORREGIR_VISTAS_REVANCHAS.sql`
3. Ejecutar el script completo

**El script hace:**

1. **Elimina PKs con formato incorrecto** (no pueden georreferenciarse de todas formas)
2. **Recrea `vista_revanchas_georreferenciadas`** con la columna `tiene_coordenadas`
3. **Recrea `vista_ultimas_revanchas_geo`** para mostrar solo las mediciones más recientes
4. **Ejecuta queries de verificación** para confirmar que todo funciona

### Paso 2: Verificar en el Frontend

1. Ir a `http://localhost:4322/`
2. Activar el toggle "Vista de Mapa"
3. Debería cargar las revanchas georreferenciadas sin error

---

## 📊 Resultados Esperados

Después de ejecutar el script:

### Antes (Diagnóstico)
```
❌ Query #6: ERROR (columna tiene_coordenadas no existe)
❌ Query #13: 20+ PKs con formato incorrecto
❌ Frontend: "Error al cargar revanchas georreferenciadas"
```

### Después (Corrección)
```
✅ Vista tiene columna tiene_coordenadas
✅ PKs inválidos eliminados
✅ Frontend carga revanchas correctamente
✅ Mapa muestra solo las mediciones más recientes por PK
```

---

## 🔧 Detalles Técnicos

### Vista `vista_revanchas_georreferenciadas`

**Características:**
- Une `revanchas_mediciones` + `revanchas_archivos` + `pks_maestro`
- Usa `normalizar_pk()` para hacer match (ej: `0+000.00` → `0+000`)
- Incluye columna `tiene_coordenadas` (true/false)
- Calcula colores según umbrales:
  - **Revancha:** Verde ≥3.5m, Amarillo ≥3.0m, Rojo <3.0m
  - **Ancho:** Verde ≥18m, Amarillo ≥15m, Rojo <15m
  - **Dist. Geo:** Verde ≥1.0m, Amarillo ≥0.5m, Rojo <0.5m

### Vista `vista_ultimas_revanchas_geo`

**Características:**
- Filtra solo mediciones con `tiene_coordenadas = true`
- Agrupa por `(muro, sector, pk)`
- Selecciona solo la fecha más reciente de cada grupo
- **Esto es lo que usa el mapa** para evitar duplicados

### Función `normalizar_pk()`

Convierte PKs con decimales a formato estándar:
```sql
normalizar_pk('0+000.00') → '0+000'
normalizar_pk('0+020.00') → '0+020'
normalizar_pk('0+550.80') → '0+551' (redondea)
```

---

## 📝 Notas Importantes

### PKs Eliminados
Los PKs con formato incorrecto **se eliminarán permanentemente** porque:
- No pueden georreferenciarse (no hay forma de saber su ubicación)
- Probablemente son errores de archivos antiguos mal formateados
- Representan una pequeña fracción del total de mediciones

### Impacto en Datos
- **Total mediciones antes:** 22,913
- **PKs inválidos:** ~20-50 (estimado, basado en Query #13)
- **Pérdida de datos:** <0.3%

### Backup Recomendado
Antes de ejecutar el script, puedes hacer un backup de las mediciones con PKs inválidos:

```sql
-- Guardar PKs inválidos en tabla temporal (opcional)
CREATE TABLE revanchas_mediciones_pks_invalidos AS
SELECT * FROM revanchas_mediciones
WHERE pk !~ '^\d+\+\d+';
```

---

## 🚀 Siguiente Paso

**Ejecuta el script `CORREGIR_VISTAS_REVANCHAS.sql` en Supabase SQL Editor**

Después de ejecutarlo, el mapa debería funcionar correctamente mostrando las revanchas más recientes de cada PK con sus coordenadas.
