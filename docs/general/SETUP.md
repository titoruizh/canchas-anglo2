# Guía de Configuración - Setup del Proyecto

## 🚀 Requisitos Previos

### Software Necesario

- **Node.js** 18.0 o superior
- **pnpm** (recomendado) o npm
- **Git**
- Editor de código (recomendado: VS Code)

### Cuentas Requeridas

- **Supabase** (gratis) - https://supabase.com
- **Mapbox** (gratis para desarrollo) - https://mapbox.com

---

## 📦 Instalación

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd canchas-anglo2
```

### 2. Instalar Dependencias

```bash
# Con pnpm (recomendado)
pnpm install

# O con npm
npm install
```

### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
```

**Archivo `.env`:**
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-aqui
MAPBOX_ACCESS_TOKEN=tu-token-mapbox (opcional)
```

---

## 🗄️ Configuración de Supabase

### 1. Crear Proyecto

1. Ve a https://supabase.com/dashboard
2. Click en "New Project"
3. Elige un nombre y contraseña
4. Selecciona región (más cercana a Chile: `South America (São Paulo)`)

### 2. Obtener Credenciales

1. En el dashboard de tu proyecto
2. Ve a **Settings** → **API**
3. Copia:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
4. Pégalos en tu archivo `.env`

### 3. Ejecutar Script SQL

1. En el dashboard, ve a **SQL Editor**
2. Click en **New Query**
3. Copia todo el contenido de `docs/database/supabase_setup.sql`
4. Pégalo en el editor
5. Click en **Run** (o F5)

Esto creará:
- ✅ Todas las tablas
- ✅ Relaciones y constraints
- ✅ Triggers automáticos
- ✅ Políticas RLS
- ✅ Datos de ejemplo

### 4. Verificar Instalación

```sql
-- En SQL Editor, ejecuta:
SELECT * FROM empresas;
SELECT * FROM estados_cancha;
SELECT * FROM usuarios;
```

Deberías ver datos de ejemplo.

---

## 🗺️ Configuración de Mapbox

### 1. Obtener Token

1. Ve a https://account.mapbox.com
2. Inicia sesión o crea cuenta
3. Ve a **Access Tokens**
4. Copia tu **Default Public Token**

### 2. Configurar Token

**Opción 1: Archivo público (recomendado para desarrollo)**

```bash
# Crear archivo de token
echo "tu-token-aqui" > public/mapbox-gis/token.txt
```

**Opción 2: Variable de entorno**

```env
# En .env
MAPBOX_ACCESS_TOKEN=tu-token-aqui
```

### 3. Archivos GeoJSON (Opcional)

Si tienes archivos GeoJSON personalizados:

```bash
# Colocar en:
public/mapbox-gis/
├── poligonos.geojson
├── sectores.geojson
└── token.txt
```

---

## 🐳 TileServer (Opcional)

Solo necesario si quieres servir tiles propios offline.

### Con Docker

```bash
# Build de la imagen
docker build -f Dockerfile.tileserver -t tileserver .

# Ejecutar container
docker run -d -p 8080:8080 --name tileserver tileserver
```

### Sin Docker

Ver: [docs/integraciones/TILESERVER_DEPLOY.md](docs/integraciones/TILESERVER_DEPLOY.md)

---

## ▶️ Ejecutar el Proyecto

### Modo Desarrollo

```bash
# Con pnpm
pnpm dev

# O con npm
npm run dev
```

Abre http://localhost:4321

### Modo Producción (Build)

```bash
# Build
pnpm build

# Preview
pnpm preview
```

---

## ✅ Verificar que Todo Funciona

### 1. Login

1. Ve a http://localhost:4321
2. Deberías ser redirigido a `/login`
3. Selecciona "AngloAmerican"
4. Ingresa credenciales de prueba:
   - Usuario: `admin`
   - Contraseña: `admin123` (cambiar en producción)

### 2. Dashboard

1. Deberías ver el dashboard principal
2. Lista de canchas (puede estar vacía al inicio)
3. Botón "Crear Nueva Cancha"

### 3. Mapbox

1. Click en una cancha con PKs
2. Click en "Ver PKs Georreferenciados"
3. Debería abrir ventana con mapa de Mapbox

---

## 🔧 Troubleshooting

### Error: "Cannot find module '@astrojs/node'"

```bash
pnpm install @astrojs/node
```

### Error: "Supabase client not found"

- Verifica que `.env` tenga las credenciales correctas
- Reinicia el servidor de desarrollo

### Error: "Mapbox token not found"

- Verifica que `public/mapbox-gis/token.txt` exista
- O configura `MAPBOX_ACCESS_TOKEN` en `.env`

### Error: "CORS policy"

- Verifica que Supabase esté configurado para permitir tu dominio
- En Supabase Dashboard → **Settings** → **API** → **CORS**

### El mapa no carga

1. Verifica token de Mapbox
2. Abre DevTools → Console para ver errores
3. Verifica conexión a internet (Mapbox necesita descargar tiles)

---

## 📁 Estructura Después del Setup

```
canchas-anglo2/
├── .env                    # Variables de entorno (NO commitear)
├── .env.example            # Template de variables
├── node_modules/           # Dependencias instaladas
├── public/
│   ├── mapbase.mbtiles
│   └── mapbox-gis/
│       ├── token.txt       # Token de Mapbox
│       ├── poligonos.geojson
│       └── sectores.geojson
├── src/
│   ├── pages/
│   ├── components/
│   └── ...
├── docs/                   # Documentación
├── package.json
└── README.md
```

---

## 🚀 Deploy a Producción

### Vercel (Recomendado)

1. **Conectar Repositorio**
   - Ve a https://vercel.com
   - Importa tu repositorio Git

2. **Configurar Variables**
   - En Vercel Dashboard → **Settings** → **Environment Variables**
   - Agrega todas las vars de `.env`

3. **Deploy**
   - Vercel hará deploy automático en cada push a `main`
   - URL de producción: `https://tu-proyecto.vercel.app`

### Otras Plataformas

Ver documentación de:
- Netlify
- Cloudflare Pages
- Railway

---

## 🔒 Seguridad en Producción

### ⚠️ Antes de Deploy

- [ ] Cambiar contraseñas por defecto en Supabase
- [ ] Configurar RLS policies correctamente
- [ ] Limitar CORS a dominios específicos
- [ ] Usar variables de entorno (no hardcodear)
- [ ] Habilitar HTTPS
- [ ] Configurar rate limiting en API

### Supabase RLS

Verificar que cada tabla tenga políticas:

```sql
-- Ver políticas existentes
SELECT * FROM pg_policies;

-- Ejemplo de política
ALTER TABLE canchas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company canchas"
ON canchas FOR SELECT
TO authenticated
USING (empresa_id = auth.uid()::text);
```

---

## 📚 Próximos Pasos

1. Lee la [Arquitectura](docs/ARCHITECTURE.md)
2. Revisa [Estándares de Código](docs/CODE_STANDARDS.md)
3. Explora la [Documentación de Componentes](docs/componentes/)
4. Consulta el [Índice de Documentación](docs/INDEX.md)

---

## 🆘 ¿Necesitas Ayuda?

- 📖 [Documentación Completa](docs/INDEX.md)
- 🐛 [Reportar un Bug](CONTRIBUTING.md#-reportar-bugs)
- 💡 [Sugerir Feature](CONTRIBUTING.md#-sugerir-features)
- 💬 Contactar a los maintainers

---

¡Listo! Ahora deberías tener el proyecto funcionando localmente. 🎉
