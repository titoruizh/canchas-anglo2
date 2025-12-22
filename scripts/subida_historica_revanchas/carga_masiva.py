"""
Script de Carga Masiva de Revanchas Históricas
==============================================

Este script procesa archivos Excel/CSV de revanchas organizados en carpetas
por muro y los sube a Supabase.

Estructura esperada:
    E:\REVANCHAS\
    ├── Principal\
    │   ├── archivo1.xlsx
    │   └── archivo2.csv
    ├── Este\
    └── Oeste\

Uso:
    python carga_masiva.py

Autor: Sistema de Gestión de Canchas
Fecha: 2025-12-22
"""

import os
import sys
from pathlib import Path
from datetime import datetime
import json
import re
from typing import Dict, List, Tuple, Optional
import time

# Librerías externas
try:
    import openpyxl
    from supabase import create_client, Client
    from dotenv import load_dotenv
except ImportError as e:
    print(f"❌ Error: Falta instalar dependencias.")
    print(f"   Ejecuta: pip install -r requirements.txt")
    sys.exit(1)

# Cargar variables de entorno
load_dotenv()

# ============================================
# CONFIGURACIÓN
# ============================================

CONFIG = {
    # Carpeta base donde están los archivos
    'carpeta_base': r'E:\TITO\1 Astro\REVANCHAS HISTORICAS',
    
    # Muros a procesar (solo Oeste y Este por ahora)
    'muros': ['Oeste', 'Este', 'Principal'],
    
    # Credenciales Supabase (desde .env)
    'supabase_url': os.getenv('PUBLIC_SUPABASE_URL'),
    'supabase_key': os.getenv('SUPABASE_SERVICE_KEY'),  # Service Role Key
    
    # Usuario que "sube" los archivos (Linkapsis)
    'usuario_id': 3,
    
    # Batch size: 1 = procesar de a 1 archivo (más lento pero más seguro)
    'batch_size': 1,
    
    # Modo dry-run (solo validar, no insertar)
    'dry_run': False,
}

# Configuraciones por muro (igual que frontend)
CONFIGURACIONES_MURO = {
    'principal': {
        'nombre': 'Muro Principal',
        'header_row': 12,
        'data_start_row': 13,
        'data_end_row': 85,
        'date_cell': 'F6',
        'columns': {
            'sector': 'A',
            'coronamiento': 'C',
            'revancha': 'E',
            'lama': 'F',
            'ancho': 'H',
            'pk': 'I',
            'geomembrana': 'J',
            'dist_geo_lama': 'K',
            'dist_geo_coronamiento': 'L',
        },
        'sectores': [
            {'num': 1, 'start_row': 13, 'end_row': 23},
            {'num': 2, 'start_row': 24, 'end_row': 33},
            {'num': 3, 'start_row': 34, 'end_row': 43},
            {'num': 4, 'start_row': 44, 'end_row': 53},
            {'num': 5, 'start_row': 54, 'end_row': 63},
            {'num': 6, 'start_row': 64, 'end_row': 73},
            {'num': 7, 'start_row': 74, 'end_row': 85},
        ]
    },
    'oeste': {
        'nombre': 'Muro Oeste',
        'header_row': 9,
        'data_start_row': 10,
        'data_end_row': 45,
        'date_cell': 'F6',
        'columns': {
            'sector': 'A',
            'coronamiento': 'B',
            'revancha': 'E',
            'lama': 'F',
            'ancho': 'H',
            'pk': 'I',
            'geomembrana': 'J',
            'dist_geo_lama': 'K',
            'dist_geo_coronamiento': 'L',
        },
        'sectores': [
            {'num': 1, 'start_row': 10, 'end_row': 21},
            {'num': 2, 'start_row': 22, 'end_row': 33},
            {'num': 3, 'start_row': 34, 'end_row': 45},
        ]
    },
    'este': {
        'nombre': 'Muro Este',
        'header_row': 12,
        'data_start_row': 13,
        'data_end_row': 41,
        'date_cell': 'F6',
        'columns': {
            'sector': 'A',
            'coronamiento': 'C',
            'revancha': 'E',
            'lama': 'F',
            'ancho': 'H',
            'pk': 'I',
            'geomembrana': 'J',
            'dist_geo_lama': 'K',
            'dist_geo_coronamiento': 'L',
        },
        'sectores': [
            {'num': 1, 'start_row': 13, 'end_row': 22},
            {'num': 2, 'start_row': 23, 'end_row': 32},
            {'num': 3, 'start_row': 33, 'end_row': 41},
        ]
    }
}

# ============================================
# FUNCIONES AUXILIARES
# ============================================

def validar_configuracion():
    """Valida que la configuración esté completa."""
    if not CONFIG['supabase_url']:
        print("❌ Error: Falta PUBLIC_SUPABASE_URL en .env")
        return False
    if not CONFIG['supabase_key']:
        print("❌ Error: Falta SUPABASE_SERVICE_KEY en .env")
        return False
    if not os.path.exists(CONFIG['carpeta_base']):
        print(f"❌ Error: No existe la carpeta {CONFIG['carpeta_base']}")
        return False
    return True


def extraer_fecha(worksheet, date_cell: str) -> Optional[str]:
    """
    Extrae la fecha buscando en todas las celdas de las filas 6-7.
    Busca en columnas A-M para encontrar fechas en formato DD-MM-YYYY o similares.
    """
    try:
        # Lista de celdas donde buscar (filas 6 y 7, columnas A-M)
        celdas_a_buscar = []
        for fila in [6, 7]:
            for col in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']:
                celdas_a_buscar.append(f"{col}{fila}")
        
        # Buscar en cada celda
        for celda in celdas_a_buscar:
            cell_value = worksheet[celda].value
            
            if cell_value is None:
                continue
            
            # Si es un datetime de Excel
            if isinstance(cell_value, datetime):
                return cell_value.strftime('%Y-%m-%d')
            
            # Si es string, buscar patrón de fecha
            text = str(cell_value)
            
            # Buscar formatos: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
            patterns = [
                r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})',  # DD/MM/YYYY o DD-MM-YYYY
                r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})',  # YYYY-MM-DD
            ]
            
            for pattern in patterns:
                match = re.search(pattern, text)
                if match:
                    groups = match.groups()
                    if len(groups[0]) == 4:  # YYYY-MM-DD
                        fecha = f"{groups[0]}-{groups[1].zfill(2)}-{groups[2].zfill(2)}"
                    else:  # DD/MM/YYYY o DD-MM-YYYY
                        fecha = f"{groups[2]}-{groups[1].zfill(2)}-{groups[0].zfill(2)}"
                    
                    # Validar que la fecha sea razonable (año entre 2020-2030)
                    try:
                        year = int(fecha.split('-')[0])
                        if 2020 <= year <= 2030:
                            return fecha
                    except:
                        continue
        
        return None
    except Exception as e:
        print(f"   ⚠️  Error extrayendo fecha: {e}")
        return None


def detectar_estructura_automatica(worksheet):
    """
    Detecta automáticamente la estructura del archivo Excel.
    Funciona con archivos de cualquier año (2022-2025).
    Retorna: (header_row, columns_dict, data_start_row, data_end_row)
    """
    # Buscar fila de headers (busca "Sector" o "PK")
    header_row = None
    for row in range(1, 20):  # Buscar en las primeras 20 filas
        for col in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']:
            cell_value = worksheet[f"{col}{row}"].value
            if cell_value and isinstance(cell_value, str):
                if 'sector' in cell_value.lower() or ('pk' in cell_value.lower() and len(cell_value) < 10):
                    header_row = row
                    break
        if header_row:
            break
    
    if not header_row:
        raise ValueError("No se encontró fila de headers")
    
    # Detectar columnas buscando los headers
    columns = {}
    for col in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O']:
        cell_value = worksheet[f"{col}{header_row}"].value
        if cell_value and isinstance(cell_value, str):
            cell_lower = cell_value.lower().strip()
            
            # Mapeo de keywords a nombres de columnas
            if 'sector' in cell_lower and 'sector' not in columns:
                columns['sector'] = col
            elif 'pk' in cell_lower and 'pk' not in columns:
                columns['pk'] = col
            elif 'coronamiento' in cell_lower and 'coronamiento' not in columns:
                columns['coronamiento'] = col
            elif 'revancha' in cell_lower and 'revancha' not in columns:
                columns['revancha'] = col
            elif 'lama' in cell_lower and 'lama' not in columns:
                columns['lama'] = col
            elif 'ancho' in cell_lower and 'ancho' not in columns:
                columns['ancho'] = col
            elif 'geomembrana' in cell_lower or 'geo' in cell_lower:
                if 'geomembrana' not in columns:
                    columns['geomembrana'] = col
            elif 'dist' in cell_lower:
                # Puede haber dos columnas de distancia
                if 'dist_geo_lama' not in columns:
                    columns['dist_geo_lama'] = col
                elif 'dist_geo_coronamiento' not in columns:
                    columns['dist_geo_coronamiento'] = col
    
    # Validar que tenemos las columnas mínimas
    required = ['sector', 'pk', 'revancha']
    missing = [r for r in required if r not in columns]
    if missing:
        raise ValueError(f"Faltan columnas requeridas: {missing}")
    
    # Detectar inicio y fin de datos
    data_start_row = header_row + 1
    data_end_row = data_start_row
    
    # Buscar hasta dónde hay datos (buscar en columna PK)
    pk_col = columns['pk']
    for row in range(data_start_row, data_start_row + 100):  # Máximo 100 filas
        cell_value = worksheet[f"{pk_col}{row}"].value
        if cell_value:
            data_end_row = row
        elif data_end_row > data_start_row:
            # Si ya encontramos datos y ahora hay vacío, terminamos
            break
    
    return header_row, columns, data_start_row, data_end_row


def obtener_sector_por_fila(fila: int, config: dict) -> Optional[str]:
    """Determina el sector según la fila."""
    for sector_info in config['sectores']:
        if sector_info['start_row'] <= fila <= sector_info['end_row']:
            return str(sector_info['num'])
    return None


def extraer_datos(worksheet, config: dict) -> List[Dict]:
    """Extrae todas las mediciones del archivo."""
    mediciones = []
    cols = config['columns']
    
    for fila in range(config['data_start_row'], config['data_end_row'] + 1):
        sector = obtener_sector_por_fila(fila, config)
        if not sector:
            continue
        
        # Leer valores de celdas
        pk = worksheet[f"{cols['pk']}{fila}"].value
        if not pk:  # Si no hay PK, saltar fila
            continue
        
        medicion = {
            'sector': sector,
            'pk': str(pk).strip(),
            'coronamiento': worksheet[f"{cols['coronamiento']}{fila}"].value,
            'revancha': worksheet[f"{cols['revancha']}{fila}"].value,
            'lama': worksheet[f"{cols['lama']}{fila}"].value,
            'ancho': worksheet[f"{cols['ancho']}{fila}"].value,
            'geomembrana': worksheet[f"{cols['geomembrana']}{fila}"].value,
            'dist_geo_lama': worksheet[f"{cols['dist_geo_lama']}{fila}"].value,
            'dist_geo_coronamiento': worksheet[f"{cols['dist_geo_coronamiento']}{fila}"].value,
        }
        
        # Convertir a float o None
        for key in ['coronamiento', 'revancha', 'lama', 'ancho', 'geomembrana', 
                    'dist_geo_lama', 'dist_geo_coronamiento']:
            val = medicion[key]
            if val is not None:
                try:
                    medicion[key] = float(val)
                except (ValueError, TypeError):
                    medicion[key] = None
        
        mediciones.append(medicion)
    
    return mediciones


def procesar_archivo(ruta: Path, muro: str) -> Optional[Dict]:
    """Procesa un archivo Excel y extrae los datos usando detección automática."""
    try:
        # Cargar workbook
        workbook = openpyxl.load_workbook(ruta, data_only=True)
        worksheet = workbook.active
        
        # Detectar estructura automáticamente
        header_row, columns, data_start_row, data_end_row = detectar_estructura_automatica(worksheet)
        
        # Extraer fecha (buscar en filas 6-7)
        fecha = extraer_fecha(worksheet, 'F6')
        if not fecha:
            raise ValueError("No se pudo extraer la fecha del archivo")
        
        # Extraer mediciones usando las columnas detectadas
        mediciones = []
        for fila in range(data_start_row, data_end_row + 1):
            # Leer valores de celdas usando columnas detectadas
            pk_value = worksheet[f"{columns['pk']}{fila}"].value
            if not pk_value:  # Si no hay PK, saltar fila
                continue
            
            # Convertir PK a string y limitar a 20 caracteres
            pk_str = str(pk_value).strip()
            if len(pk_str) > 20:
                pk_str = pk_str[:20]  # Truncar si es muy largo
            
            medicion = {
                'sector': str(worksheet[f"{columns.get('sector', 'A')}{fila}"].value or '').strip(),
                'pk': pk_str,
                'coronamiento': worksheet[f"{columns.get('coronamiento', 'C')}{fila}"].value,
                'revancha': worksheet[f"{columns.get('revancha', 'E')}{fila}"].value,
                'lama': worksheet[f"{columns.get('lama', 'F')}{fila}"].value,
                'ancho': worksheet[f"{columns.get('ancho', 'H')}{fila}"].value,
                'geomembrana': worksheet[f"{columns.get('geomembrana', 'J')}{fila}"].value,
                'dist_geo_lama': worksheet[f"{columns.get('dist_geo_lama', 'K')}{fila}"].value,
                'dist_geo_coronamiento': worksheet[f"{columns.get('dist_geo_coronamiento', 'L')}{fila}"].value,
            }
            
            # Convertir a float o None
            for key in ['coronamiento', 'revancha', 'lama', 'ancho', 'geomembrana', 
                        'dist_geo_lama', 'dist_geo_coronamiento']:
                val = medicion[key]
                if val is not None:
                    try:
                        medicion[key] = float(val)
                    except (ValueError, TypeError):
                        medicion[key] = None
            
            mediciones.append(medicion)
        
        if not mediciones:
            raise ValueError("No se encontraron mediciones válidas")
        
        # Obtener sectores únicos
        sectores = sorted(list(set(m['sector'] for m in mediciones if m['sector'])))
        
        return {
            'fecha': fecha,
            'mediciones': mediciones,
            'total_registros': len(mediciones),
            'sectores': sectores
        }
        
    except Exception as e:
        raise Exception(f"Error procesando archivo: {str(e)}")


def subir_a_supabase(supabase: Client, datos: Dict, archivo: str, muro: str) -> Tuple[bool, str]:
    """Sube los datos a Supabase. Si encuentra duplicado, lo reemplaza."""
    try:
        # 1. Verificar si ya existe un archivo con este muro y fecha
        existing = supabase.table('revanchas_archivos')\
            .select('id')\
            .eq('muro', muro)\
            .eq('fecha_medicion', datos['fecha'])\
            .execute()
        
        # Si existe, eliminarlo (CASCADE eliminará las mediciones)
        if existing.data and len(existing.data) > 0:
            old_id = existing.data[0]['id']
            supabase.table('revanchas_archivos').delete().eq('id', old_id).execute()
            print(f"🔄 Reemplazando archivo existente (ID: {old_id})... ", end='', flush=True)
        
        # 2. Insertar nuevo archivo en revanchas_archivos
        archivo_data = {
            'muro': muro,
            'fecha_medicion': datos['fecha'],
            'archivo_nombre': archivo,
            'archivo_tipo': 'XLSX' if archivo.endswith('.xlsx') else 'CSV',
            'total_registros': datos['total_registros'],
            'sectores_incluidos': datos['sectores'],
            'usuario_id': CONFIG['usuario_id']
        }
        
        response = supabase.table('revanchas_archivos').insert(archivo_data).execute()
        
        if not response.data:
            return False, "Error insertando archivo"
        
        archivo_id = response.data[0]['id']
        
        # 3. Insertar mediciones en batch
        mediciones_para_insertar = []
        for m in datos['mediciones']:
            mediciones_para_insertar.append({
                'archivo_id': archivo_id,
                'sector': m['sector'],
                'pk': m['pk'],
                'coronamiento': m['coronamiento'],
                'revancha': m['revancha'],
                'lama': m['lama'],
                'ancho': m['ancho'],
                'geomembrana': m['geomembrana'],
                'dist_geo_lama': m['dist_geo_lama'],
                'dist_geo_coronamiento': m['dist_geo_coronamiento']
            })
        
        supabase.table('revanchas_mediciones').insert(mediciones_para_insertar).execute()
        
        return True, f"Archivo ID: {archivo_id}"
        
    except Exception as e:
        error_msg = str(e)
        return False, f"Error: {error_msg}"


# ============================================
# FUNCIÓN PRINCIPAL
# ============================================

def main():
    """Función principal del script."""
    print("=" * 70)
    print("📤 CARGA MASIVA DE REVANCHAS HISTÓRICAS")
    print("=" * 70)
    print()
    
    # Validar configuración
    if not validar_configuracion():
        sys.exit(1)
    
    # Conectar a Supabase
    print("🔌 Conectando a Supabase...")
    supabase = create_client(CONFIG['supabase_url'], CONFIG['supabase_key'])
    print("✅ Conectado\n")
    
    # Modo dry-run
    if CONFIG['dry_run']:
        print("⚠️  MODO DRY-RUN: Solo validación, no se guardará nada\n")
    
    # Reporte
    reporte = {
        'exitosos': [],
        'duplicados': [],
        'errores': [],
        'estadisticas': {'Principal': 0, 'Este': 0, 'Oeste': 0},
        'inicio': datetime.now().isoformat(),
    }
    
    # Procesar cada muro
    for muro in CONFIG['muros']:
        carpeta_muro = Path(CONFIG['carpeta_base']) / muro
        
        if not carpeta_muro.exists():
            print(f"⚠️  Carpeta no encontrada: {carpeta_muro}")
            continue
        
        # Obtener archivos
        archivos = list(carpeta_muro.glob('*.xlsx')) + list(carpeta_muro.glob('*.csv'))
        
        print(f"\n{'=' * 70}")
        print(f"📁 {muro.upper()}: {len(archivos)} archivos")
        print(f"{'=' * 70}\n")
        
        # Procesar archivos
        for i, ruta_archivo in enumerate(archivos, 1):
            archivo = ruta_archivo.name
            print(f"[{i}/{len(archivos)}] {archivo}... ", end='', flush=True)
            
            try:
                # Procesar archivo
                datos = procesar_archivo(ruta_archivo, muro)
                
                if CONFIG['dry_run']:
                    print(f"✅ Válido ({datos['total_registros']} registros, {datos['fecha']})")
                    reporte['exitosos'].append({
                        'archivo': archivo,
                        'muro': muro,
                        'fecha': datos['fecha'],
                        'registros': datos['total_registros']
                    })
                else:
                    # Subir a Supabase (reemplaza duplicados automáticamente)
                    exito, mensaje = subir_a_supabase(supabase, datos, archivo, muro)
                    
                    if exito:
                        print(f"✅ {datos['total_registros']} registros ({datos['fecha']})")
                        reporte['exitosos'].append({
                            'archivo': archivo,
                            'muro': muro,
                            'fecha': datos['fecha'],
                            'registros': datos['total_registros']
                        })
                        reporte['estadisticas'][muro] += 1
                    else:
                        print(f"❌ {mensaje}")
                        reporte['errores'].append({
                            'archivo': archivo,
                            'muro': muro,
                            'error': mensaje
                        })
                
                # Pequeña pausa para no sobrecargar
                time.sleep(0.1)
                
            except Exception as e:
                print(f"❌ {str(e)}")
                reporte['errores'].append({
                    'archivo': archivo,
                    'muro': muro,
                    'error': str(e)
                })
    
    # Reporte final
    reporte['fin'] = datetime.now().isoformat()
    
    print(f"\n{'=' * 70}")
    print("📊 REPORTE FINAL")
    print(f"{'=' * 70}\n")
    print(f"✅ Exitosos:   {len(reporte['exitosos'])}")
    print(f"⚠️  Duplicados: {len(reporte['duplicados'])}")
    print(f"❌ Errores:    {len(reporte['errores'])}")
    
    print(f"\n📈 Por Muro:")
    for muro, count in reporte['estadisticas'].items():
        print(f"   {muro}: {count} archivos")
    
    # Guardar reporte
    with open('reporte_carga_masiva.json', 'w', encoding='utf-8') as f:
        json.dump(reporte, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Reporte guardado en: reporte_carga_masiva.json")
    print()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Proceso cancelado por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Error fatal: {e}")
        sys.exit(1)
