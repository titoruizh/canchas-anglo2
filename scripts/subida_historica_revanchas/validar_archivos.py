"""
Script de Prueba: Validar Primer y Último Archivo
=================================================

Valida que la detección automática funcione correctamente
con el primer y último archivo de Principal.
"""

import openpyxl
from pathlib import Path
import sys

# Agregar funciones del script principal
sys.path.insert(0, str(Path(__file__).parent))

def detectar_estructura_automatica(worksheet):
    """Detecta automáticamente la estructura del archivo Excel."""
    header_row = None
    for row in range(1, 20):
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
    
    columns = {}
    for col in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O']:
        cell_value = worksheet[f"{col}{header_row}"].value
        if cell_value and isinstance(cell_value, str):
            cell_lower = cell_value.lower().strip()
            
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
    
    required = ['sector', 'pk', 'revancha']
    missing = [r for r in required if r not in columns]
    if missing:
        raise ValueError(f"Faltan columnas requeridas: {missing}")
    
    data_start_row = header_row + 1
    data_end_row = data_start_row
    
    pk_col = columns['pk']
    for row in range(data_start_row, data_start_row + 100):
        cell_value = worksheet[f"{pk_col}{row}"].value
        if cell_value:
            data_end_row = row
        elif data_end_row > data_start_row:
            break
    
    return header_row, columns, data_start_row, data_end_row


def probar_archivo(ruta_archivo):
    """Prueba un archivo y retorna la estructura detectada."""
    print(f"\n{'='*70}")
    print(f"📄 {ruta_archivo.name}")
    print(f"{'='*70}")
    
    try:
        workbook = openpyxl.load_workbook(ruta_archivo, data_only=True)
        worksheet = workbook.active
        
        header_row, columns, data_start, data_end = detectar_estructura_automatica(worksheet)
        
        total_filas = data_end - data_start + 1
        
        print(f"✅ Header en fila: {header_row}")
        print(f"✅ Datos: filas {data_start} a {data_end} ({total_filas} registros)")
        print(f"✅ Columnas detectadas:")
        for key, col in sorted(columns.items()):
            print(f"   - {key}: columna {col}")
        
        # Mostrar primeras 2 filas
        print(f"\n📋 Primeras 2 filas de datos:")
        for row in range(data_start, min(data_start + 2, data_end + 1)):
            sector = worksheet[f"{columns.get('sector', 'A')}{row}"].value
            pk = worksheet[f"{columns['pk']}{row}"].value
            revancha = worksheet[f"{columns['revancha']}{row}"].value
            print(f"   Fila {row}: Sector={sector}, PK={pk}, Revancha={revancha}")
        
        return {
            'header_row': header_row,
            'columns': columns,
            'total_filas': total_filas,
            'exito': True
        }
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return {'exito': False, 'error': str(e)}


# Obtener archivos de Principal
carpeta_principal = Path(r'E:\TITO\1 Astro\REVANCHAS HISTORICAS\Principal')
archivos = sorted(list(carpeta_principal.glob('*.xlsx')))

if not archivos:
    print("❌ No se encontraron archivos en la carpeta Principal")
    sys.exit(1)

print(f"\n🔍 PRUEBA DE VALIDACIÓN")
print(f"Total de archivos encontrados: {len(archivos)}")

# Probar primer archivo
primer_archivo = archivos[0]
resultado_primero = probar_archivo(primer_archivo)

# Probar último archivo
ultimo_archivo = archivos[-1]
resultado_ultimo = probar_archivo(ultimo_archivo)

# Comparar resultados
print(f"\n{'='*70}")
print("📊 COMPARACIÓN DE RESULTADOS")
print(f"{'='*70}")

if resultado_primero['exito'] and resultado_ultimo['exito']:
    # Comparar headers
    headers_iguales = resultado_primero['header_row'] == resultado_ultimo['header_row']
    
    # Comparar columnas (solo las que están en ambos)
    columnas_primero = set(resultado_primero['columns'].keys())
    columnas_ultimo = set(resultado_ultimo['columns'].keys())
    columnas_comunes = columnas_primero & columnas_ultimo
    
    columnas_iguales = all(
        resultado_primero['columns'][col] == resultado_ultimo['columns'][col]
        for col in columnas_comunes
    )
    
    print(f"\n✅ Ambos archivos procesados exitosamente")
    print(f"\nFila de header:")
    print(f"  Primer archivo: fila {resultado_primero['header_row']}")
    print(f"  Último archivo: fila {resultado_ultimo['header_row']}")
    print(f"  {'✅ IGUALES' if headers_iguales else '⚠️  DIFERENTES'}")
    
    print(f"\nColumnas detectadas:")
    print(f"  Primer archivo: {sorted(resultado_primero['columns'].keys())}")
    print(f"  Último archivo: {sorted(resultado_ultimo['columns'].keys())}")
    
    if columnas_comunes:
        print(f"\n  Columnas en común: {sorted(columnas_comunes)}")
        print(f"  {'✅ POSICIONES IGUALES' if columnas_iguales else '⚠️  POSICIONES DIFERENTES'}")
    
    print(f"\nTotal de registros:")
    print(f"  Primer archivo: {resultado_primero['total_filas']} filas")
    print(f"  Último archivo: {resultado_ultimo['total_filas']} filas")
    
    # Decisión final
    print(f"\n{'='*70}")
    if headers_iguales and len(columnas_comunes) >= 3:
        print("✅ VALIDACIÓN EXITOSA")
        print("✅ Los archivos tienen estructura compatible")
        print("✅ Se puede proceder con la carga masiva")
        print(f"\n🚀 Para ejecutar la carga masiva:")
        print(f"   python carga_masiva.py")
    else:
        print("⚠️  ADVERTENCIA: Estructuras diferentes detectadas")
        print("⚠️  Revisa manualmente antes de proceder")
else:
    print("❌ ERROR: No se pudieron procesar ambos archivos")
    print("❌ Revisa los errores arriba")
