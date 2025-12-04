# Plan de Limpieza de Archivos SQL

## Archivos a MANTENER (3 archivos)

### ✅ Archivos Recién Creados (NO TOCAR)
1. **diagnostico_completo_database.sql** - Diagnóstico completo de BD
2. **migracion_revanchas_completa.sql** - Migración de revanchas
3. **implementation_plan.md** (artifact) - Plan de implementación

### ✅ Archivos Importantes del Sistema
4. **supabase_setup.sql** - Setup inicial de Supabase (MANTENER - es la base)
5. **backup-supabase.sql** - Backup completo (MANTENER - por seguridad)

---

## Archivos a ELIMINAR (23 archivos)

### 🗑️ Archivos de Debug/Testing (7 archivos)
- debug_database_structure.sql
- debug_usuarios_inactivos.sql
- diagnostico_usuarios_completo.sql
- test_usuarios_roles.sql
- generar_canchas_test.sql
- actualizar_fechas_timeline_prueba.sql
- verificar_estados_cancha.sql

### 🗑️ Archivos de Fix/Corrección Temporal (8 archivos)
- fix_estados_finalizada.sql
- fix_rls_usuarios.sql
- fix_vista_canchas_ids.sql
- fix_vista_usuarios_SEGURO.sql
- fix_vista_usuarios_completa.sql
- correccion_estados_rechazada.sql
- validaciones_usuarios_update.sql
- update_vista_canchas.sql

### 🗑️ Archivos de Migración/Limpieza Antigua (5 archivos)
- migracion_nuevos_estados.sql
- eliminar_estados_3_y_5.sql
- limpiar_estados_deprecados.sql
- crear_tabla_transiciones.sql
- verificar_tracking_fechas.sql

### 🗑️ Archivos de Setup/Update Específicos (3 archivos)
- supabase_update_besalco.sql
- usuarios_roles_setup.sql
- lista_completa_acciones.sql

### 🗑️ Carpeta Backup (1 carpeta)
- backup_supabase\estructura.sql (dentro de carpeta backup_supabase)

---

## Resumen
- **Total archivos**: 28
- **Mantener**: 5 archivos
- **Eliminar**: 23 archivos + 1 carpeta
