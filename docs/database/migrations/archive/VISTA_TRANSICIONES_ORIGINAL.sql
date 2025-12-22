-- =====================================================
-- VISTA ORIGINAL (del commit 473f309)
-- =====================================================
-- Esta es la vista que funcionaba correctamente

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

-- Verificar que funciona
SELECT
    cancha_id,
    cancha_nombre,
    TO_CHAR(fecha_transicion, 'YYYY-MM-DD HH24:MI') as fecha,
    accion,
    empresa_anterior,
    empresa_nueva
FROM vista_transiciones_completa
WHERE cancha_id IN (30, 31)
ORDER BY cancha_id, fecha_transicion;
