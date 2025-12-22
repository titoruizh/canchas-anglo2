from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

supabase = create_client(
    os.getenv('PUBLIC_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

# Verificar archivos de Principal
result = supabase.table('revanchas_archivos').select('*').eq('muro', 'Principal').execute()

print(f"\n📊 ARCHIVOS DE PRINCIPAL EN SUPABASE: {len(result.data)}\n")

if result.data:
    print("Primeros 20 archivos:")
    for r in result.data[:20]:
        print(f"  {r['id']}: {r['fecha_medicion']} - {r['archivo_nombre']}")
    
    print(f"\n... y {len(result.data) - 20} más") if len(result.data) > 20 else None
else:
    print("✅ No hay archivos de Principal en la BD")

# Verificar constraint del campo pk
print("\n🔍 VERIFICANDO CONSTRAINT DE PK...")
mediciones = supabase.table('revanchas_mediciones').select('pk').limit(5).execute()
if mediciones.data:
    for m in mediciones.data:
        print(f"  PK ejemplo: '{m['pk']}' (longitud: {len(m['pk'])})")
