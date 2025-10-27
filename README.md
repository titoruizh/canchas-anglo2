# Sistema de Gestión de Canchas - AngloAmerican

## 🎯 Descripción

Sistema completo de gestión de canchas que maneja el flujo de trabajo entre AngloAmerican, Besalco, Linkapsis y LlayLlay. Incluye trazabilidad completa, validaciones y rechazos con historial.

## 🏗️ Arquitectura

- **Frontend**: Astro (Single Page Application)
- **Backend**: Supabase (PostgreSQL + APIs REST)
- **Estilo**: CSS vanilla con diseño responsivo

## � Flujo de Trabajo

1. **AngloAmerican** crea canchas → Estado: "Creada"
2. **AngloAmerican** envía a Besalco → Estado: "En Proceso"
3. **Besalco** realiza trabajos → Estado: "Finalizada" (pasa a Linkapsis)
4. **Linkapsis** valida espesores:
   - ✅ Validada → pasa a LlayLlay
   - ❌ Rechazada → vuelve a Besalco
5. **LlayLlay** valida densidad:
   - ✅ Validada → vuelve a AngloAmerican
   - ❌ Rechazada → vuelve a Besalco
6. **AngloAmerican** cierra la cancha → Estado: "Cerrada"

## 🗄️ Base de Datos

### Configuración de Supabase

**URL**: https://chzlwqxjdcydnndrnfjk.supabase.co
**Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoemx3cXhqZGN5ZG5uZHJuZmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjQxMDMsImV4cCI6MjA3NjEwMDEwM30.uyI7C2j8yz1WqAWXft4cbZTBdliJlYVhHv4oL1Nthxo

### Ejecutar Script SQL

1. Ve a tu dashboard de Supabase (https://supabase.com/dashboard/projects)
2. Navega a SQL Editor
3. Ejecuta el archivo `supabase_setup.sql` completo
4. Esto creará todas las tablas, relaciones, triggers y datos iniciales

### Estructura de Tablas

- **empresas**: Catálogo de empresas participantes
- **estados_cancha**: Estados posibles de las canchas
- **canchas**: Tabla principal con información de canchas
- **historial_cancha**: Trazabilidad completa de cambios
- **validaciones**: Registro de validaciones/rechazos específicos

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- pnpm (o npm/yarn)

### Pasos de Instalación

1. **Instalar dependencias**
   ```bash
   pnpm install
   ```

2. **Configurar variables de entorno**
   El archivo `.env` ya está configurado con las credenciales correctas.

3. **Ejecutar el script SQL en Supabase**
   - Copia todo el contenido de `supabase_setup.sql`
   - Pégalo en el SQL Editor de Supabase
   - Ejecuta el script

4. **Iniciar el servidor de desarrollo**
   ```bash
   pnpm dev
   ```

5. **Acceder a la aplicación**
   - Abre http://localhost:4323 en tu navegador

## 💻 Uso de la Aplicación

### Selección de Empresa

1. Al ingresar, selecciona tu empresa en el dropdown superior
2. Las acciones disponibles cambiarán según tu empresa

### AngloAmerican

- **Crear canchas**: Completa Muro, Sector y Nombre
- **Enviar a Besalco**: Cuando la cancha esté creada
- **Cerrar cancha**: Cuando vuelva validada

### Besalco

- **Finalizar trabajo**: Para canchas en proceso o rechazadas

### Linkapsis

- **Validar espesores**: Aprueba y envía a LlayLlay
- **Rechazar**: Devuelve a Besalco con observaciones

### LlayLlay

- **Validar densidad**: Aprueba y envía a AngloAmerican
- **Rechazar**: Devuelve a Besalco con observaciones

## 🔍 Características del Sistema

### Trazabilidad Completa

- Cada cambio se registra automáticamente
- Historial detallado con timestamps
- Registro de quién realizó cada acción

### Validaciones y Rechazos

- Observaciones obligatorias en rechazos
- Tipos específicos de validación (espesores, densidad)
- Mantenimiento del estado histórico

### Nomenclatura de Canchas

Las canchas siguen el formato: `MURO_SECTOR_NOMBRE`

Ejemplos:
- `MP_S5_TALUD` (Muro Principal, Sector 5, Talud)
- `MS_S3_BERMA` (Muro Secundario, Sector 3, Berma)
- `MT_S1_PISTA` (Muro Terciario, Sector 1, Pista)

### Estados de Cancha

- **Creada**: Recién creada por AngloAmerican
- **En Proceso**: Trabajándose por Besalco
- **Finalizada**: Trabajo completado, esperando validación
- **Validada**: Aprobada por validador correspondiente
- **Rechazada**: Rechazada, requiere retrabajo
- **Cerrada**: Proceso completo, cancha cerrada

## 🎨 Interfaz de Usuario

### Diseño Responsivo

- Adaptable a dispositivos móviles
- Tabla scrolleable en pantallas pequeñas
- Botones optimizados para touch

### Indicadores Visuales

- Estados con colores distintivos
- Empresas identificadas por colores
- Botones contextuales según permisos

### Experiencia de Usuario

- Confirmaciones para acciones críticas
- Mensajes de éxito/error claros
- Loading states durante operaciones

---

**Sistema desarrollado para AngloAmerican** 🏗️⚡
