"""
Script Mejorado: Detección Automática de Estructura
===================================================

Este script detecta automáticamente:
1. Fila de headers (busca "Sector", "PK", "Revancha", etc.)
2. Columnas de datos (busca los headers y usa esas columnas)
3. Filas de datos (desde header+1 hasta encontrar filas vacías)

Funciona con archivos de cualquier año (2022-2025)
"""

import openpyxl
from pathlib import Path

def detectar_estructura_automatica(worksheet):
    """
    Detecta automáticamente la estructura del archivo Excel.
    Retorna: (header_row, columns_dict, data_start_row, data_end_row)
    """
    # Buscar fila de headers (busca "Sector" o "PK")
    header_row = None
    for row in range(1, 20):  # Buscar en las primeras 20 filas
        for col in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']:
            cell_value = worksheet[f"{col}{row}"].value
            if cell_value and isinstance(cell_value, str):
                if 'sector' in cell_value.lower() or 'pk' in cell_value.lower():
                    header_row = row
                    break
        if header_row:
            break
    
    if not header_row:
        raise ValueError("No se encontró fila de headers")
    
    print(f"   📍 Header encontrado en fila: {header_row}")
    
    # Detectar columnas buscando los headers
    columns = {}
    headers_a_buscar = {
        'sector': ['sector', 'sec'],
        'pk': ['pk', 'progresiva', 'prog'],
        'coronamiento': ['coronamiento', 'coron', 'cota coronamiento'],
        'revancha': ['revancha', 'rev'],
        'lama': ['lama', 'cota lama'],
        'ancho': ['ancho', 'ancho cubeta'],
        'geomembrana': ['geomembrana', 'geo', 'cota geo'],
        'dist_geo_lama': ['dist', 'distancia'],
        'dist_geo_coronamiento': ['dist']
    }
    
    for col in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O']:
        cell_value = worksheet[f"{col}{header_row}"].value
        if cell_value and isinstance(cell_value, str):
            cell_lower = cell_value.lower().strip()
            
            for key, keywords in headers_a_buscar.items():
                if any(kw in cell_lower for kw in keywords):
                    if key not in columns:  # Solo tomar la primera coincidencia
                        columns[key] = col
                        print(f"   ✅ {key}: columna {col}")
    
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
    
    print(f"   📊 Datos desde fila {data_start_row} hasta {data_end_row}")
    print(f"   📈 Total filas de datos: {data_end_row - data_start_row + 1}")
    
    return header_row, columns, data_start_row, data_end_row


# Probar con un archivo
archivo_test = Path(r'E:\TITO\1 Astro\REVANCHAS HISTORICAS\Principal\Reporte_Rev_MP_220113.xlsx')

if archivo_test.exists():
    print(f"\n🔍 Analizando: {archivo_test.name}\n")
    workbook = openpyxl.load_workbook(archivo_test, data_only=True)
    worksheet = workbook.active
    
    try:
        header_row, columns, data_start, data_end = detectar_estructura_automatica(worksheet)
        
        print(f"\n✅ ESTRUCTURA DETECTADA:")
        print(f"   Header: fila {header_row}")
        print(f"   Datos: filas {data_start} a {data_end}")
        print(f"   Columnas: {columns}")
        
        # Mostrar primeras 3 filas de datos
        print(f"\n📋 Primeras 3 filas:")
        for row in range(data_start, min(data_start + 3, data_end + 1)):
            pk = worksheet[f"{columns['pk']}{row}"].value
            revancha = worksheet[f"{columns.get('revancha', 'E')}{row}"].value
            print(f"   Fila {row}: PK={pk}, Revancha={revancha}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
else:
    print(f"❌ Archivo no encontrado: {archivo_test}")
