-- ═══════════════════════════════════════════════════════════════════════════════
-- DOCUMENTACIÓN COMPLETA DEL SISTEMA DE TIMELINE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Sistema de visualización cronológica de transiciones de estado de canchas
-- Última actualización: Diciembre 2025
-- ═══════════════════════════════════════════════════════════════════════════════

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                           DESCRIPCIÓN GENERAL                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

El sistema de Timeline permite visualizar gráficamente la evolución temporal de
las canchas a través de las diferentes etapas del proceso productivo.

COMPONENTES PRINCIPALES:
  1. Tabla: transiciones_estado (almacenamiento de eventos)
  2. Vista: vista_transiciones_completa (consulta optimizada)
  3. API: /api/canchas/[id]/timeline (endpoint REST)
  4. Frontend: Modal timeline en index.astro (visualización)

FLUJO DE DATOS:
  Usuario → Botón "Ver Timeline" → API → Vista → Renderizado gráfico
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. ESTRUCTURA DE BASE DE DATOS
-- ═══════════════════════════════════════════════════════════════════════════════

/*
TABLA PRINCIPAL: transiciones_estado
─────────────────────────────────────────────────────────────────────────────────
Almacena cada cambio de estado que sufre una cancha durante su ciclo de vida.

COLUMNAS:
  • id                    : Identificador único de la transición
  • cancha_id            : ID de la cancha que sufrió la transición
  • estado_anterior_id   : ID del estado antes de la transición (puede ser NULL en creación)
  • estado_nuevo_id      : ID del estado después de la transición
  • empresa_anterior_id  : ID de la empresa que tenía la cancha antes
  • empresa_nueva_id     : ID de la empresa que recibe la cancha
  • accion               : Código de la acción realizada (ver mapeo abajo)
  • observaciones        : Notas adicionales sobre la transición
  • usuario_id           : ID del usuario que ejecutó la acción
  • created_at           : Timestamp de cuándo ocurrió la transición

EJEMPLO DE REGISTRO:
  {
    id: 58,
    cancha_id: 224,
    estado_anterior_id: NULL,
    estado_nuevo_id: 1,
    empresa_anterior_id: NULL,
    empresa_nueva_id: 1,
    accion: "crear_cancha_con_poligono",
    observaciones: "Cancha creada con polígono: MP_S1_TEST_TIMELINE2",
    usuario_id: 1,
    created_at: "2025-11-01 09:00:00+00"
  }
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. VISTA DE CONSULTA: vista_transiciones_completa
-- ═══════════════════════════════════════════════════════════════════════════════

-- Esta vista simplifica la consulta de transiciones con información legible
-- Código de creación (ejecutar en Supabase):

DROP VIEW IF EXISTS vista_transiciones_completa CASCADE;

CREATE OR REPLACE VIEW vista_transiciones_completa AS
SELECT
  t.id,
  t.cancha_id,
  c.nombre AS cancha_nombre,
  c.muro,
  c.sector,
  ea.nombre AS estado_anterior,
  en.nombre AS estado_nuevo,
  emp_ant.nombre AS empresa_anterior,
  emp_new.nombre AS empresa_nueva,
  t.accion,
  t.observaciones,
  u.nombre_completo AS usuario_nombre,
  t.created_at AS fecha_transicion,
  t.created_at,
  t.created_at as updated_at
FROM transiciones_estado t
LEFT JOIN canchas c ON t.cancha_id = c.id
LEFT JOIN estados_cancha ea ON t.estado_anterior_id = ea.id
LEFT JOIN estados_cancha en ON t.estado_nuevo_id = en.id
LEFT JOIN empresas emp_ant ON t.empresa_anterior_id = emp_ant.id
LEFT JOIN empresas emp_new ON t.empresa_nueva_id = emp_new.id
LEFT JOIN usuarios u ON t.usuario_id = u.id
ORDER BY t.created_at DESC;

-- NOTA IMPORTANTE:
-- Esta vista se basa ÚNICAMENTE en la tabla transiciones_estado.
-- NO incluye UNION con otras tablas (historial_cancha, validaciones, etc.)
-- Esto mantiene la simplicidad y rendimiento del sistema.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. MAPEO DE ACCIONES
-- ═══════════════════════════════════════════════════════════════════════════════

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                      CÓDIGOS DE ACCIÓN → TEXTO VISIBLE                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

Los códigos de acción en la BD se mapean a texto legible en el frontend.
Definido en: src/pages/index.astro → NOMBRES_ACCIONES_TIMELINE

┌─────────────────────────────┬────────────────────────────────────────────────┐
│ CÓDIGO EN BD                │ TEXTO EN TIMELINE                              │
├─────────────────────────────┼────────────────────────────────────────────────┤
│ AngloAmerican (AA)                                                           │
├─────────────────────────────┼────────────────────────────────────────────────┤
│ crear_cancha                │ Creación de Cancha                             │
│ crear_cancha_con_poligono   │ Creación de Cancha                             │
│ enviar_besalco              │ Envío a Besalco                                │
│ cerrar_cancha               │ Cierre de Cancha                               │
├─────────────────────────────┼────────────────────────────────────────────────┤
│ Besalco (BS)                                                                 │
├─────────────────────────────┼────────────────────────────────────────────────┤
│ recepcionar_besalco         │ Trabajo recepcionado por Besalco               │
│ finalizar_besalco           │ Trabajo finalizado por Besalco                 │
│ rechazar_besalco            │ Trabajo rechazado por Besalco                  │
├─────────────────────────────┼────────────────────────────────────────────────┤
│ Linkapsis (LK)                                                               │
├─────────────────────────────┼────────────────────────────────────────────────┤
│ recepcionar_linkapsis       │ Trabajo recepcionado por Linkapsis             │
│ validar_linkapsis           │ Espesores validados por Linkapsis              │
│ rechazar_linkapsis          │ Espesores rechazados por Linkapsis             │
├─────────────────────────────┼────────────────────────────────────────────────┤
│ LlayLlay (LL)                                                                │
├─────────────────────────────┼────────────────────────────────────────────────┤
│ recepcionar_llay_llay       │ Trabajo recepcionado por LlayLlay              │
│ validar_llay_llay           │ Densidad validada por LlayLlay                 │
│ rechazar_llay_llay          │ Densidad rechazada por LlayLlay                │
├─────────────────────────────┼────────────────────────────────────────────────┤
│ Genéricos                                                                    │
├─────────────────────────────┼────────────────────────────────────────────────┤
│ tomar_trabajo               │ Trabajo tomado                                 │
│ rechazar_cancha             │ Cancha rechazada                               │
└─────────────────────────────┴────────────────────────────────────────────────┘
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. FLUJO COMPLETO DEL PROCESO
-- ═══════════════════════════════════════════════════════════════════════════════

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                  CICLO DE VIDA COMPLETO DE UNA CANCHA                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PROCESO NORMAL (SIN RECHAZOS):
───────────────────────────────────────────────────────────────────────────────

1. CREACIÓN
   Usuario: AngloAmerican
   Acción: crear_cancha_con_poligono
   Estado: NULL → Creada
   Empresa: NULL → AngloAmerican

2. ENVÍO A BESALCO
   Usuario: AngloAmerican
   Acción: enviar_besalco
   Estado: Creada → Enviada a Contratista
   Empresa: AngloAmerican → Besalco

3. BESALCO RECEPCIONA
   Usuario: Besalco
   Acción: tomar_trabajo (o recepcionar_besalco)
   Estado: Enviada a Contratista → En Proceso
   Empresa: Besalco → Besalco

4. BESALCO FINALIZA Y ENVÍA A LINKAPSIS
   Usuario: Besalco
   Acción: finalizar_besalco
   Estado: En Proceso → Enviada a Contratista
   Empresa: Besalco → Linkapsis

5. LINKAPSIS RECEPCIONA
   Usuario: Linkapsis
   Acción: tomar_trabajo (o recepcionar_linkapsis)
   Estado: Enviada a Contratista → En Proceso
   Empresa: Linkapsis → Linkapsis

6. LINKAPSIS VALIDA Y ENVÍA A LLAY LLAY
   Usuario: Linkapsis
   Acción: validar_linkapsis
   Estado: En Proceso → Enviada a Contratista
   Empresa: Linkapsis → LlayLlay

7. LLAY LLAY RECEPCIONA
   Usuario: LlayLlay
   Acción: tomar_trabajo (o recepcionar_llay_llay)
   Estado: Enviada a Contratista → En Proceso
   Empresa: LlayLlay → LlayLlay

8. LLAY LLAY VALIDA Y ENVÍA A AA
   Usuario: LlayLlay
   Acción: validar_llay_llay
   Estado: En Proceso → Validada
   Empresa: LlayLlay → AngloAmerican

9. AA CIERRA CANCHA
   Usuario: AngloAmerican
   Acción: cerrar_cancha
   Estado: Validada → Cerrada
   Empresa: AngloAmerican → AngloAmerican

PROCESO CON RECHAZO:
───────────────────────────────────────────────────────────────────────────────

Si en cualquier punto una empresa rechaza la cancha:

Ejemplo: LlayLlay rechaza en paso 8
   Usuario: LlayLlay
   Acción: rechazar_llay_llay
   Estado: En Proceso → Rechazada, en Espera
   Empresa: LlayLlay → Besalco (vuelve al inicio del ciclo)

Luego se repite el proceso desde Besalco (pasos 3-8).
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. CONSULTAS ÚTILES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 5.1. VER TIMELINE DE UNA CANCHA ESPECÍFICA
-- ─────────────────────────────────────────────────────────────────────────────

-- Reemplaza 224 con el ID de la cancha que quieres ver
SELECT
    ROW_NUMBER() OVER (ORDER BY t.created_at) as paso,
    TO_CHAR(t.created_at, 'YYYY-MM-DD HH24:MI') as fecha,
    t.accion,
    ea.nombre as estado_anterior,
    en.nombre as estado_nuevo,
    emp_ant.nombre as de_empresa,
    emp_new.nombre as a_empresa,
    u.nombre_completo as usuario,
    t.observaciones
FROM transiciones_estado t
LEFT JOIN estados_cancha ea ON t.estado_anterior_id = ea.id
LEFT JOIN estados_cancha en ON t.estado_nuevo_id = en.id
LEFT JOIN empresas emp_ant ON t.empresa_anterior_id = emp_ant.id
LEFT JOIN empresas emp_new ON t.empresa_nueva_id = emp_new.id
LEFT JOIN usuarios u ON t.usuario_id = u.id
WHERE t.cancha_id = 224
ORDER BY t.created_at ASC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5.2. VER TODAS LAS TRANSICIONES USANDO LA VISTA
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
    cancha_id,
    cancha_nombre,
    TO_CHAR(fecha_transicion, 'YYYY-MM-DD HH24:MI') as fecha,
    accion,
    estado_anterior,
    estado_nuevo,
    empresa_anterior,
    empresa_nueva,
    usuario_nombre
FROM vista_transiciones_completa
WHERE cancha_id = 224
ORDER BY fecha_transicion ASC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5.3. COMPARAR MÚLTIPLES CANCHAS
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
    c.id as cancha_id,
    c.nombre as cancha,
    TO_CHAR(t.created_at, 'YYYY-MM-DD HH24:MI') as fecha,
    t.accion,
    emp_new.nombre as empresa
FROM transiciones_estado t
INNER JOIN canchas c ON t.cancha_id = c.id
LEFT JOIN empresas emp_new ON t.empresa_nueva_id = emp_new.id
WHERE t.cancha_id IN (224, 225, 226)
ORDER BY t.created_at ASC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5.4. ESTADÍSTICAS DE PROCESO
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
    c.id,
    c.nombre,
    MIN(t.created_at) as inicio_proceso,
    MAX(t.created_at) as fin_proceso,
    MAX(t.created_at) - MIN(t.created_at) as duracion_total,
    COUNT(t.id) as total_eventos,
    COUNT(CASE WHEN t.accion LIKE 'rechazar%' THEN 1 END) as total_rechazos
FROM transiciones_estado t
INNER JOIN canchas c ON t.cancha_id = c.id
WHERE t.cancha_id IN (224, 225, 226)
GROUP BY c.id, c.nombre
ORDER BY c.id;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. AJUSTE DE FECHAS PARA PRUEBAS/SIMULACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                    SIMULACIÓN DE FECHAS PARA TIMELINE                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

Cuando creas canchas de prueba, todas las transiciones tienen la misma fecha
(el momento en que las creaste). Esto hace que el timeline visual se vea mal.

PROCESO PARA AJUSTAR FECHAS:
*/

-- PASO 1: Identificar los IDs de las transiciones de la cancha
-- Reemplaza 226 con el ID de tu cancha

SELECT id, cancha_id, accion, created_at
FROM transiciones_estado
WHERE cancha_id = 226
ORDER BY id;

-- PASO 2: Con los IDs obtenidos, actualizar las fechas
-- Copia el template de abajo y ajusta los IDs y fechas

/*
TEMPLATE PARA PROCESO NORMAL (9 eventos):
─────────────────────────────────────────────────────────────────────────────

UPDATE transiciones_estado SET created_at = '2025-11-01 09:00:00+00' WHERE id = XX; -- Creación
UPDATE transiciones_estado SET created_at = '2025-11-02 10:00:00+00' WHERE id = YY; -- Envío a Besalco
UPDATE transiciones_estado SET created_at = '2025-11-03 11:30:00+00' WHERE id = ZZ; -- Besalco recepciona
UPDATE transiciones_estado SET created_at = '2025-11-05 14:00:00+00' WHERE id = AA; -- Besalco finaliza
UPDATE transiciones_estado SET created_at = '2025-11-06 09:15:00+00' WHERE id = BB; -- Linkapsis recepciona
UPDATE transiciones_estado SET created_at = '2025-11-08 15:30:00+00' WHERE id = CC; -- Linkapsis valida
UPDATE transiciones_estado SET created_at = '2025-11-09 10:45:00+00' WHERE id = DD; -- LlayLlay recepciona
UPDATE transiciones_estado SET created_at = '2025-11-12 16:00:00+00' WHERE id = EE; -- LlayLlay valida
UPDATE transiciones_estado SET created_at = '2025-11-13 11:00:00+00' WHERE id = FF; -- AA cierra

NOTAS:
- Reemplaza XX, YY, ZZ, etc. con los IDs reales del PASO 1
- Ajusta las fechas según necesites
- Espaciar eventos por días mejora la visualización
- Usa diferentes horas del día para eventos del mismo día
*/

-- EJEMPLO REAL: Cancha 224 (proceso normal)
/*
UPDATE transiciones_estado SET created_at = '2025-11-01 09:00:00+00' WHERE id = 58;
UPDATE transiciones_estado SET created_at = '2025-11-02 10:00:00+00' WHERE id = 59;
UPDATE transiciones_estado SET created_at = '2025-11-03 11:30:00+00' WHERE id = 60;
UPDATE transiciones_estado SET created_at = '2025-11-05 14:00:00+00' WHERE id = 61;
UPDATE transiciones_estado SET created_at = '2025-11-06 09:15:00+00' WHERE id = 62;
UPDATE transiciones_estado SET created_at = '2025-11-08 15:30:00+00' WHERE id = 63;
UPDATE transiciones_estado SET created_at = '2025-11-09 10:45:00+00' WHERE id = 64;
UPDATE transiciones_estado SET created_at = '2025-11-12 16:00:00+00' WHERE id = 65;
UPDATE transiciones_estado SET created_at = '2025-11-13 11:00:00+00' WHERE id = 66;
*/

-- EJEMPLO REAL: Cancha 226 (proceso con rechazo - 15 eventos)
/*
UPDATE transiciones_estado SET created_at = '2025-11-02 09:00:00+00' WHERE id = 76; -- Creación
UPDATE transiciones_estado SET created_at = '2025-11-02 10:30:00+00' WHERE id = 77; -- Envío Besalco
UPDATE transiciones_estado SET created_at = '2025-11-03 09:00:00+00' WHERE id = 78; -- Besalco recepciona
UPDATE transiciones_estado SET created_at = '2025-11-04 16:00:00+00' WHERE id = 79; -- Besalco finaliza
UPDATE transiciones_estado SET created_at = '2025-11-05 10:00:00+00' WHERE id = 80; -- Linkapsis recepciona
UPDATE transiciones_estado SET created_at = '2025-11-06 14:00:00+00' WHERE id = 81; -- Linkapsis valida
UPDATE transiciones_estado SET created_at = '2025-11-07 11:00:00+00' WHERE id = 82; -- LlayLlay recepciona
UPDATE transiciones_estado SET created_at = '2025-11-08 09:00:00+00' WHERE id = 83; -- ❌ LlayLlay RECHAZA
UPDATE transiciones_estado SET created_at = '2025-11-08 14:00:00+00' WHERE id = 84; -- Besalco retoma
UPDATE transiciones_estado SET created_at = '2025-11-10 15:00:00+00' WHERE id = 85; -- Besalco finaliza retrabajo
UPDATE transiciones_estado SET created_at = '2025-11-11 09:30:00+00' WHERE id = 86; -- Linkapsis recepciona
UPDATE transiciones_estado SET created_at = '2025-11-12 13:00:00+00' WHERE id = 87; -- Linkapsis valida
UPDATE transiciones_estado SET created_at = '2025-11-12 16:00:00+00' WHERE id = 88; -- LlayLlay recepciona
UPDATE transiciones_estado SET created_at = '2025-11-14 10:00:00+00' WHERE id = 89; -- LlayLlay valida ✅
UPDATE transiciones_estado SET created_at = '2025-11-14 15:00:00+00' WHERE id = 90; -- AA cierra
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. INTEGRACIÓN CON EL FRONTEND
-- ═══════════════════════════════════════════════════════════════════════════════

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                     COMPONENTES DEL FRONTEND                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

ARCHIVO: src/pages/index.astro
───────────────────────────────────────────────────────────────────────────────

FUNCIÓN: openTimelineModal(canchaId, canchaName)
  • Se llama cuando el usuario hace clic en "Ver Timeline"
  • Abre el modal y muestra un spinner de carga
  • Llama a fetchTimelineData() para obtener los datos

FUNCIÓN: fetchTimelineData(canchaId)
  • Hace una petición GET a /api/canchas/[id]/timeline
  • Recibe el JSON con las transiciones
  • Llama a renderTimeline() para dibujar el gráfico

FUNCIÓN: renderTimeline(timelineData, canchaColors, container)
  • Genera el HTML del timeline visual
  • Crea los puntos (dots) en la línea de tiempo
  • Aplica colores según la empresa
  • Agrega tooltips con información detallada

MAPEO DE COLORES POR EMPRESA:
  • AngloAmerican: #1e40af (azul)
  • Besalco: #b91c1c (rojo)
  • Linkapsis: #15803d (verde)
  • LlayLlay: #9333ea (morado)

TOOLTIPS:
  Muestran al pasar el mouse sobre cada punto:
  • Nombre de la cancha
  • Acción realizada (texto legible del mapeo)
  • Fecha y hora del evento
*/

/*
ARCHIVO: src/pages/api/canchas/[id]/timeline.ts
───────────────────────────────────────────────────────────────────────────────

ENDPOINT: GET /api/canchas/[id]/timeline

CÓDIGO RELEVANTE:
  const transiciones = await CanchaService.obtenerTransicionesCancha(canchaId);
  return new Response(JSON.stringify({ transiciones }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

RESPUESTA JSON:
  {
    "transiciones": [
      {
        "id": 58,
        "cancha_id": 224,
        "cancha_nombre": "MP_S1_TEST_TIMELINE2",
        "accion": "crear_cancha_con_poligono",
        "empresa_anterior": null,
        "empresa_nueva": "AngloAmerican",
        "fecha_transicion": "2025-11-01T09:00:00.000Z",
        ...
      },
      ...
    ]
  }
*/

/*
ARCHIVO: src/lib/supabase.ts
───────────────────────────────────────────────────────────────────────────────

SERVICIO: CanchaService.obtenerTransicionesCancha(canchaId)

CÓDIGO:
  const { data, error } = await supabase
    .from("vista_transiciones_completa")
    .select("*")
    .eq("cancha_id", canchaId)
    .order("fecha_transicion", { ascending: true });

  return data || [];

IMPORTANTE:
  • Usa la vista vista_transiciones_completa (no la tabla directa)
  • Ordena por fecha_transicion ascendente
  • Retorna array vacío si hay error
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. MIGRACIÓN DE DATOS HISTÓRICOS
-- ═══════════════════════════════════════════════════════════════════════════════

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║              MIGRACIÓN DE historial_cancha → transiciones_estado             ║
╚══════════════════════════════════════════════════════════════════════════════╝

CONTEXTO:
  Las canchas antiguas (30, 31) fueron creadas ANTES de implementar el sistema
  de transiciones_estado. Sus datos están en la tabla historial_cancha.

SOLUCIÓN:
  Migrar los datos históricos a transiciones_estado para que aparezcan en el
  timeline junto con las canchas nuevas.

CÓDIGO DE MIGRACIÓN:
*/

-- Ver qué canchas necesitan migración
SELECT DISTINCT
    hc.cancha_id,
    c.nombre,
    COUNT(hc.id) as eventos_historial,
    COUNT(te.id) as eventos_transiciones
FROM historial_cancha hc
INNER JOIN canchas c ON hc.cancha_id = c.id
LEFT JOIN transiciones_estado te ON te.cancha_id = hc.cancha_id
GROUP BY hc.cancha_id, c.nombre
HAVING COUNT(te.id) = 0
ORDER BY hc.cancha_id;

-- Migrar datos (solo canchas sin transiciones)
INSERT INTO transiciones_estado (
    cancha_id,
    estado_anterior_id,
    estado_nuevo_id,
    empresa_anterior_id,
    empresa_nueva_id,
    accion,
    observaciones,
    usuario_id,
    created_at
)
SELECT
    hc.cancha_id,
    hc.estado_anterior_id,
    hc.estado_nuevo_id,
    hc.empresa_anterior_id,
    hc.empresa_nueva_id,
    hc.accion,
    hc.observaciones,
    hc.created_by as usuario_id,
    hc.created_at
FROM historial_cancha hc
WHERE hc.cancha_id NOT IN (
    SELECT DISTINCT cancha_id FROM transiciones_estado
)
ORDER BY hc.cancha_id, hc.created_at;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. SOLUCIÓN DE PROBLEMAS COMUNES
-- ═══════════════════════════════════════════════════════════════════════════════

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                           TROUBLESHOOTING                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PROBLEMA 1: Timeline muestra "No hay transiciones para mostrar"
───────────────────────────────────────────────────────────────────────────────
CAUSA: No hay datos en transiciones_estado para esa cancha
SOLUCIÓN:
  1. Verificar que la cancha tiene transiciones:
     SELECT COUNT(*) FROM transiciones_estado WHERE cancha_id = XXX;
  
  2. Si es cancha antigua, migrar desde historial_cancha (ver sección 8)
  
  3. Si es cancha nueva, verificar que se estén registrando las transiciones
     en el código (buscar: registrarTransicion en supabase.ts)

PROBLEMA 2: Tooltips muestran "Sin Acción" en lugar del texto correcto
───────────────────────────────────────────────────────────────────────────────
CAUSA: El código de acción en BD no está en el mapeo NOMBRES_ACCIONES_TIMELINE
SOLUCIÓN:
  1. Ver qué acciones tiene la cancha:
     SELECT DISTINCT accion FROM transiciones_estado WHERE cancha_id = XXX;
  
  2. Agregar el código faltante al mapeo en index.astro:
     const NOMBRES_ACCIONES_TIMELINE = {
       nueva_accion: "Texto a mostrar",
       ...
     };

PROBLEMA 3: Vista vista_transiciones_completa no existe
───────────────────────────────────────────────────────────────────────────────
CAUSA: La vista no fue creada en Supabase
SOLUCIÓN: Ejecutar el código de la sección 2 en el SQL Editor de Supabase

PROBLEMA 4: Todas las transiciones tienen la misma fecha
───────────────────────────────────────────────────────────────────────────────
CAUSA: Se crearon en pruebas muy rápido
SOLUCIÓN: Usar el proceso de ajuste de fechas de la sección 6

PROBLEMA 5: El timeline no se renderiza visualmente
───────────────────────────────────────────────────────────────────────────────
CAUSA: Error de JavaScript en el frontend
SOLUCIÓN:
  1. Abrir DevTools del navegador (F12)
  2. Ver errores en la consola
  3. Verificar que el JSON del API sea válido
  4. Verificar que todas las empresas tengan color asignado
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. NOTAS FINALES
-- ═══════════════════════════════════════════════════════════════════════════════

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                        INFORMACIÓN ADICIONAL                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

MANTENIMIENTO:
  • La tabla transiciones_estado crece con el tiempo
  • Considerar archivado de transiciones antiguas si es necesario
  • No borrar registros, son históricos importantes

RENDIMIENTO:
  • La vista es eficiente para cantidades moderadas de datos
  • Si hay problemas de performance, agregar índices:
    CREATE INDEX idx_transiciones_cancha ON transiciones_estado(cancha_id, created_at);

SEGURIDAD:
  • El endpoint /api/canchas/[id]/timeline debe validar permisos
  • Los usuarios solo deberían ver timelines de canchas autorizadas

EXTENSIONES FUTURAS:
  • Filtros por rango de fechas
  • Exportación de timeline a PDF
  • Comparación lado a lado de múltiples canchas
  • Estadísticas agregadas (tiempo promedio por etapa)
  • Notificaciones cuando una cancha lleva mucho tiempo en un estado

CONTACTO:
  Para dudas o problemas, consultar este documento primero.
  Última actualización: Diciembre 2025
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIN DE LA DOCUMENTACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════
