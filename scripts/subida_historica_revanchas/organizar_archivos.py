"""
Script para Organizar Archivos Después de la Carga Masiva
==========================================================

Este script:
1. Lee el reporte de carga masiva
2. Mueve archivos exitosos a carpeta _SUBIDOS
3. Deja solo archivos con errores para revisión manual
4. Genera reporte de errores detallado

Uso:
    python organizar_archivos.py
"""

import json
import shutil
from pathlib import Path
import os

# Configuración
CARPETA_BASE = r'E:\TITO\1 Astro\REVANCHAS HISTORICAS'
REPORTE_JSON = 'reporte_carga_masiva.json'

def main():
    print("=" * 70)
    print("📁 ORGANIZANDO ARCHIVOS POST-CARGA")
    print("=" * 70)
    print()
    
    # Leer reporte
    if not os.path.exists(REPORTE_JSON):
        print(f"❌ Error: No se encontró {REPORTE_JSON}")
        print("   Ejecuta primero carga_masiva.py")
        return
    
    with open(REPORTE_JSON, 'r', encoding='utf-8') as f:
        reporte = json.load(f)
    
    print(f"📊 Resumen del reporte:")
    print(f"   ✅ Exitosos: {len(reporte['exitosos'])}")
    print(f"   ⚠️  Duplicados: {len(reporte['duplicados'])}")
    print(f"   ❌ Errores: {len(reporte['errores'])}")
    print()
    
    # Crear carpetas _SUBIDOS
    muros = ['Oeste', 'Este', 'Principal']
    for muro in muros:
        carpeta_muro = Path(CARPETA_BASE) / muro
        if carpeta_muro.exists():
            carpeta_subidos = carpeta_muro / '_SUBIDOS'
            carpeta_subidos.mkdir(exist_ok=True)
    
    # Mover archivos exitosos
    print("📦 Moviendo archivos exitosos a _SUBIDOS...")
    movidos = 0
    for item in reporte['exitosos']:
        archivo = item['archivo']
        muro = item['muro']
        
        origen = Path(CARPETA_BASE) / muro / archivo
        destino = Path(CARPETA_BASE) / muro / '_SUBIDOS' / archivo
        
        if origen.exists():
            shutil.move(str(origen), str(destino))
            movidos += 1
            print(f"   ✅ {muro}/{archivo}")
    
    print(f"\n✅ {movidos} archivos movidos a _SUBIDOS")
    print()
    
    # Mover duplicados también
    print("📦 Moviendo archivos duplicados a _SUBIDOS...")
    duplicados_movidos = 0
    for item in reporte['duplicados']:
        archivo = item['archivo']
        muro = item['muro']
        
        origen = Path(CARPETA_BASE) / muro / archivo
        destino = Path(CARPETA_BASE) / muro / '_SUBIDOS' / archivo
        
        if origen.exists():
            shutil.move(str(origen), str(destino))
            duplicados_movidos += 1
            print(f"   ⚠️  {muro}/{archivo}")
    
    print(f"\n⚠️  {duplicados_movidos} duplicados movidos a _SUBIDOS")
    print()
    
    # Generar reporte de errores
    print("📝 Generando reporte de errores...")
    
    with open('ERRORES_DETALLADOS.txt', 'w', encoding='utf-8') as f:
        f.write("=" * 70 + "\n")
        f.write("REPORTE DE ARCHIVOS CON ERRORES\n")
        f.write("=" * 70 + "\n\n")
        f.write(f"Total de errores: {len(reporte['errores'])}\n\n")
        
        # Agrupar por muro
        errores_por_muro = {}
        for item in reporte['errores']:
            muro = item['muro']
            if muro not in errores_por_muro:
                errores_por_muro[muro] = []
            errores_por_muro[muro].append(item)
        
        for muro, errores in errores_por_muro.items():
            f.write(f"\n{'=' * 70}\n")
            f.write(f"{muro.upper()} - {len(errores)} errores\n")
            f.write(f"{'=' * 70}\n\n")
            
            for item in errores:
                f.write(f"Archivo: {item['archivo']}\n")
                f.write(f"Error:   {item['error']}\n")
                f.write(f"Ruta:    {CARPETA_BASE}\\{muro}\\{item['archivo']}\n")
                f.write("-" * 70 + "\n")
        
        f.write("\n" + "=" * 70 + "\n")
        f.write("INSTRUCCIONES PARA CORREGIR\n")
        f.write("=" * 70 + "\n\n")
        f.write("1. Abre cada archivo con error en Excel\n")
        f.write("2. Verifica que la celda F6 contenga una fecha válida\n")
        f.write("3. Formatos aceptados:\n")
        f.write("   - DD/MM/YYYY (ej: 15/12/2024)\n")
        f.write("   - DD-MM-YYYY (ej: 15-12-2024)\n")
        f.write("   - YYYY-MM-DD (ej: 2024-12-15)\n")
        f.write("4. Guarda el archivo\n")
        f.write("5. Vuelve a ejecutar: python carga_masiva.py\n\n")
    
    print("✅ Reporte guardado en: ERRORES_DETALLADOS.txt")
    print()
    
    # Resumen final
    print("=" * 70)
    print("📊 RESUMEN FINAL")
    print("=" * 70)
    print()
    print(f"📁 Archivos organizados en: {CARPETA_BASE}")
    print()
    for muro in muros:
        carpeta_muro = Path(CARPETA_BASE) / muro
        if carpeta_muro.exists():
            archivos_restantes = len([f for f in carpeta_muro.glob('*.xlsx') if f.is_file()])
            archivos_subidos = len(list((carpeta_muro / '_SUBIDOS').glob('*.xlsx'))) if (carpeta_muro / '_SUBIDOS').exists() else 0
            
            print(f"{muro}:")
            print(f"  ✅ Subidos: {archivos_subidos} (en _SUBIDOS/)")
            print(f"  ❌ Con errores: {archivos_restantes} (en raíz)")
            print()
    
    print("📝 Revisa ERRORES_DETALLADOS.txt para ver qué corregir")
    print()

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
