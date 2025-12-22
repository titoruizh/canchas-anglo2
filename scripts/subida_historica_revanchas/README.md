# 📤 Script de Carga Masiva de Revanchas Históricas

## 🎯 Propósito

Este script procesa **masivamente** archivos Excel/CSV de revanchas históricos organizados en carpetas por muro y los sube a Supabase.

**Estimación:** ~600 archivos (300 Principal, 150 Este, 150 Oeste) en 50-100 minutos.

---

## 📁 Estructura de Archivos Requerida

```
E:\REVANCHAS\
├── Principal\
│   ├── archivo1.xlsx
│   ├── archivo2.csv
│   └── ...
├── Este\
│   ├── archivo1.xlsx
│   └── ...
└── Oeste\
    ├── archivo1.xlsx
    └── ...
```

---

## 🚀 Instalación

### 1. Instalar Python
Asegúrate de tener Python 3.8+ instalado:
```bash
python --version
```

### 2. Instalar Dependencias
```bash
cd scripts/subida_historica_revanchas
pip install -r requirements.txt
```

### 3. Configurar Variables de Entorno

Copia el archivo de ejemplo:
```bash
copy .env.example .env
```

Edita `.env` y completa:
```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE:** Usa la **Service Role Key**, NO la anon key.

**Dónde encontrarla:**
1. Ve a tu proyecto en Supabase Dashboard
2. Settings > API
3. Copia `service_role` key (secret)

---

## 📋 Uso

### Modo Normal (Subir a BD)
```bash
python carga_masiva.py
```

### Modo Dry-Run (Solo Validar)
Edita `carga_masiva.py` línea 59:
```python
'dry_run': True,  # Cambiar a True
```

Luego ejecuta:
```bash
python carga_masiva.py
```

---

## 📊 Salida del Script

### Durante la Ejecución
```
======================================================================
📤 CARGA MASIVA DE REVANCHAS HISTÓRICAS
======================================================================

🔌 Conectando a Supabase...
✅ Conectado

======================================================================
📁 PRINCIPAL: 300 archivos
======================================================================

[1/300] 2022-01-15_Principal.xlsx... ✅ 73 registros (2022-01-15)
[2/300] 2022-02-20_Principal.xlsx... ✅ 73 registros (2022-02-20)
[3/300] 2022-03-10_Principal.xlsx... ⚠️  DUPLICADO: Ya existe archivo para Principal con fecha 2022-03-10
[4/300] corrupto.xlsx... ❌ Error procesando archivo: No se pudo extraer la fecha
...
```

### Reporte Final
```
======================================================================
📊 REPORTE FINAL
======================================================================

✅ Exitosos:   580
⚠️  Duplicados: 15
❌ Errores:    5

📈 Por Muro:
   Principal: 295
   Este: 145
   Oeste: 140

💾 Reporte guardado en: reporte_carga_masiva.json
```

---

## 📄 Reporte JSON

El script genera `reporte_carga_masiva.json`:

```json
{
  "exitosos": [
    {
      "archivo": "2022-01-15_Principal.xlsx",
      "muro": "Principal",
      "fecha": "2022-01-15",
      "registros": 73
    }
  ],
  "duplicados": [
    {
      "archivo": "2022-03-10_Principal.xlsx",
      "muro": "Principal",
      "fecha": "2022-03-10"
    }
  ],
  "errores": [
    {
      "archivo": "corrupto.xlsx",
      "muro": "Este",
      "error": "No se pudo extraer la fecha del archivo"
    }
  ],
  "estadisticas": {
    "Principal": 295,
    "Este": 145,
    "Oeste": 140
  },
  "inicio": "2025-12-22T14:00:00",
  "fin": "2025-12-22T15:30:00"
}
```

---

## ⚙️ Configuración

Puedes modificar `carga_masiva.py` líneas 40-60:

```python
CONFIG = {
    'carpeta_base': r'E:\REVANCHAS',  # Cambiar si está en otra ubicación
    'muros': ['Principal', 'Este', 'Oeste'],
    'usuario_id': 3,  # ID del usuario Linkapsis
    'batch_size': 10,
    'dry_run': False,  # True para solo validar
}
```

---

## 🔧 Troubleshooting

### Error: "Falta PUBLIC_SUPABASE_URL en .env"
**Solución:** Crea el archivo `.env` copiando `.env.example` y completa las credenciales.

### Error: "No existe la carpeta E:\REVANCHAS"
**Solución:** Cambia `carpeta_base` en CONFIG a la ruta correcta.

### Error: "DUPLICADO: Ya existe archivo para..."
**Causa:** Ya existe un archivo en BD para ese muro con esa fecha (constraint UNIQUE).
**Solución:** Normal, el script continúa. Si quieres reemplazarlo, elimínalo primero en Supabase.

### Error: "No se pudo extraer la fecha del archivo"
**Causa:** La celda F6 no contiene una fecha válida.
**Solución:** Verifica el archivo manualmente. El script continúa con los demás.

### Proceso muy lento
**Solución:** Aumenta `batch_size` en CONFIG (ej: 20). Pero cuidado con sobrecargar Supabase.

---

## ✅ Verificación en Supabase

Después de ejecutar, verifica en Supabase SQL Editor:

```sql
-- Ver archivos cargados por muro
SELECT muro, COUNT(*) as total, 
       MIN(fecha_medicion) as desde, 
       MAX(fecha_medicion) as hasta
FROM revanchas_archivos
GROUP BY muro
ORDER BY muro;

-- Ver total de mediciones
SELECT COUNT(*) FROM revanchas_mediciones;

-- Ver estadísticas calculadas (triggers automáticos)
SELECT COUNT(*) FROM revanchas_estadisticas;

-- Ver últimos 10 archivos subidos
SELECT * FROM vista_revanchas_archivos 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🔒 Seguridad

- ✅ El archivo `.env` está en `.gitignore` (no se sube a GitHub)
- ✅ Usa Service Role Key solo para este script
- ⚠️ NO compartas el `.env` ni lo subas a repositorios públicos

---

## 📞 Soporte

**Archivos del script:**
- `carga_masiva.py` - Script principal
- `requirements.txt` - Dependencias
- `.env.example` - Template de configuración
- `README.md` - Este archivo

**Fecha:** 22 de diciembre de 2025  
**Versión:** 1.0.0
