# Historial de Migraciones

Registro cronológico de todas las migraciones y cambios significativos en el schema de la base de datos.

## Formato

Cada migración incluye:
- **Fecha**: Cuándo se ejecutó
- **Versión**: Número de versión del schema
- **Descripción**: Qué cambió
- **Archivo**: Referencia al archivo SQL
- **Impacto**: Nivel de impacto (Bajo/Medio/Alto)

---

## 2024-12-04 - v1.4 - Sistema de Revanchas Completo

**Archivo**: `archive/migracion_revanchas_COMPLETA_FINAL.sql`

**Descripción**: Implementación completa del sistema de revanchas con archivos, mediciones, comparaciones y estadísticas.

**Cambios**:
- ✅ Creada tabla `revanchas_archivos` - Metadata de archivos CSV/XLSX
- ✅ Creada tabla `revanchas_mediciones` - Mediciones individuales
- ✅ Creada tabla `revanchas_comparaciones` - Comparaciones entre fechas
- ✅ Creada tabla `revanchas_estadisticas` - Estadísticas globales
- ✅ Creada tabla `revanchas_estadisticas_sector` - Estadísticas por sector
- ✅ Creadas vistas: `vista_revanchas_archivos`, `vista_ultimas_mediciones`, `vista_mediciones_completas`, `vista_comparacion_ultimas_mediciones`
- ✅ Creada función `calcular_estadisticas_archivo()` - Cálculo automático de estadísticas
- ✅ Creados triggers para cálculo automático de estadísticas
- ✅ Configuradas políticas RLS para todas las tablas
- ✅ Creados índices de performance

**Impacto**: Alto - Sistema completamente nuevo

---

## 2024-12-XX - v1.3 - Sistema de PKs Georreferenciados

**Archivo**: `archive/SISTEMA_PKS_GEORREFERENCIADOS.sql`

**Descripción**: Implementación del sistema de 138 PKs georreferenciados con conversión UTM ↔ WGS84.

**Cambios**:
- ✅ Creada tabla `pks_maestro` - 138 PKs con coordenadas UTM y WGS84
- ✅ Creada función `utm_to_wgs84()` - Conversión UTM Zona 19S a WGS84
- ✅ Creada función `normalizar_pk()` - Normalización de formato de PKs
- ✅ Creadas vistas: `vista_revanchas_georreferenciadas`, `vista_ultimas_revanchas_geo`, `vista_resumen_revanchas_geo`
- ✅ Insertados 138 PKs:
  - Muro Principal: 73 PKs (0+000 a 1+434)
  - Muro Este: 29 PKs (0+000 a 0+551)
  - Muro Oeste: 36 PKs (0+000 a 0+690)
- ✅ Creados índices para búsquedas por muro, pk, y coordenadas
- ✅ Creado trigger para cálculo automático de WGS84

**Impacto**: Alto - Sistema completamente nuevo

---

## 2024-11-XX - v1.2 - Sistema de Usuarios y Roles

**Descripción**: Implementación del sistema de autenticación y autorización.

**Cambios**:
- ✅ Creada tabla `usuarios` - Usuarios del sistema
- ✅ Creada tabla `roles` - Roles por empresa
- ✅ Creada vista `vista_usuarios_completa` - Usuarios con empresa y rol
- ✅ Agregada columna `usuario_id` a `revanchas_archivos`
- ✅ Agregada columna `usuario_validador_id` a `validaciones`
- ✅ Agregada columna `usuario_id` a `transiciones_estado`
- ✅ Configuradas políticas RLS para usuarios y roles
- ✅ Creados índices de performance

**Impacto**: Alto - Sistema completamente nuevo

---

## 2024-11-XX - v1.1 - Mejoras al Sistema Core

**Descripción**: Mejoras y refinamientos al sistema principal de canchas.

**Cambios**:
- ✅ Agregada tabla `transiciones_estado` - Registro detallado de transiciones
- ✅ Agregada tabla `contador_informes` - Numeración de informes
- ✅ Agregada columna `numero_informe` a `canchas`
- ✅ Agregada columna `poligono_coordenadas` (JSONB) a `canchas`
- ✅ Creada vista `vista_transiciones_completa`
- ✅ Agregada columna `is_revalidacion` a `validaciones`
- ✅ Creados índices adicionales para performance

**Impacto**: Medio - Extensiones al sistema existente

---

## 2024-11-04 - v1.0 - Setup Inicial

**Archivo**: `archive/supabase_setup.sql`

**Descripción**: Configuración inicial del sistema de gestión de canchas.

**Cambios**:
- ✅ Creada tabla `empresas` - 4 empresas del flujo
- ✅ Creada tabla `estados_cancha` - 6 estados posibles
- ✅ Creada tabla `canchas` - Tabla principal
- ✅ Creada tabla `historial_cancha` - Trazabilidad de cambios
- ✅ Creada tabla `validaciones` - Validaciones por empresa
- ✅ Creadas vistas: `vista_canchas_completa`, `vista_historial_completa`
- ✅ Creada función `update_updated_at_column()` - Actualización automática de timestamps
- ✅ Creada función `registrar_cambio_cancha()` - Registro automático en historial
- ✅ Creados triggers para automatización
- ✅ Configuradas políticas RLS básicas
- ✅ Insertados datos iniciales (empresas y estados)

**Impacto**: Alto - Setup inicial completo

---

## Schema Actual (v1.4)

### Tablas (15)
1. `empresas` - Empresas participantes
2. `estados_cancha` - Estados del flujo
3. `canchas` - Tabla principal
4. `historial_cancha` - Historial de cambios
5. `transiciones_estado` - Transiciones detalladas
6. `validaciones` - Validaciones por empresa
7. `contador_informes` - Numeración de informes
8. `usuarios` - Usuarios del sistema
9. `roles` - Roles por empresa
10. `pks_maestro` - PKs georreferenciados (138)
11. `revanchas_archivos` - Archivos de revanchas
12. `revanchas_mediciones` - Mediciones individuales
13. `revanchas_comparaciones` - Comparaciones
14. `revanchas_estadisticas` - Estadísticas globales
15. `revanchas_estadisticas_sector` - Estadísticas por sector

### Vistas (12)
1. `vista_canchas_completa`
2. `vista_historial_completa`
3. `vista_transiciones_completa`
4. `vista_usuarios_completa`
5. `vista_pks_completa`
6. `vista_pks_por_muro`
7. `vista_revanchas_archivos`
8. `vista_revanchas_georreferenciadas`
9. `vista_ultimas_revanchas_geo`
10. `vista_resumen_revanchas_geo`
11. `vista_mediciones_completas`
12. `vista_comparacion_ultimas_mediciones`
13. `vista_ultimas_mediciones`

### Funciones (10)
1. `update_updated_at_column()`
2. `registrar_cambio_cancha()`
3. `utm_to_wgs84()`
4. `normalizar_pk()`
5. `calcular_estadisticas_archivo()`
6. `calcular_wgs84_pks()`
7. `update_revanchas_archivos_updated_at()`
8. `actualizar_fecha_actualizacion()`
9. `actualizar_resumen_fechas()`
10. `avanzar_flujo()`
11. `actualizar_vistas_por_empresa()`

### Triggers (8+)
1. `trigger_update_canchas_updated_at`
2. `trigger_cambio_cancha`
3. `trigger_calcular_estadisticas_insert`
4. `trigger_calcular_estadisticas_delete`
5. `trigger_update_revanchas_archivos_updated_at`
6. `trigger_calcular_wgs84`
7. Y otros triggers de actualización automática

---

## Próximas Migraciones Planificadas

### v1.5 - Mejoras de Performance (Planificado)
- [ ] Optimización de índices existentes
- [ ] Particionamiento de tablas grandes
- [ ] Materialización de vistas frecuentes

### v1.6 - Seguridad Mejorada (Planificado)
- [ ] Políticas RLS más restrictivas por empresa
- [ ] Auditoría de cambios sensibles
- [ ] Encriptación de datos sensibles

---

## Notas de Migración

### Proceso de Migración

1. **Backup**: Siempre hacer backup antes de migrar
   ```sql
   -- Ver: archive/backup-supabase.sql
   ```

2. **Testing**: Probar en ambiente de desarrollo primero

3. **Ejecución**: Ejecutar SQL en Supabase SQL Editor

4. **Verificación**: Ejecutar queries de verificación
   ```sql
   -- Ver: DIAGNOSTICO_SCHEMA_COMPLETO.sql
   ```

5. **Documentación**: Actualizar este archivo y README.md

### Rollback

Para revertir una migración:
1. Restaurar desde backup
2. Ejecutar scripts de rollback (si existen)
3. Verificar integridad de datos

---

## Ver También

- [../README.md](../README.md) - Documentación principal
- [archive/](./archive/) - Archivos SQL de migraciones
- [../DIAGNOSTICO_SCHEMA_COMPLETO.sql](../DIAGNOSTICO_SCHEMA_COMPLETO.sql) - Diagnóstico del schema
