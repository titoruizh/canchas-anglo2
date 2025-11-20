# 🚀 Sistema de Autenticación de Usuarios - Guía Completa

## 📋 Resumen del Sistema Implementado

Se ha implementado un sistema completo de autenticación de usuarios con roles por empresa, reemplazando el sistema básico anterior. El nuevo sistema incluye:

### ✅ **Componentes Implementados**

1. **Página de Login** (`/login`) - Interfaz completa con selección de empresa y usuario
2. **Sistema de Autenticación** - Backend con APIs REST y validación de sesiones
3. **Protección de Rutas** - Middleware que verifica autenticación antes de acceder
4. **Gestión de Usuarios** (`/admin/usuarios`) - Panel administrativo para gestionar usuarios
5. **Integración PDF** - Los PDFs ahora muestran nombres reales de usuarios

---

## 🏗️ **Arquitectura del Sistema**

### **Frontend (Astro.js + TypeScript)**
```
/login                  → Página de autenticación
/                       → Página principal (protegida)
/admin/usuarios         → Panel de administración (solo Admins)
/components/AuthGuard   → Protección automática de rutas
/utils/authStore        → Store global de autenticación
```

### **Backend (Supabase + APIs REST)**
```
/api/usuarios           → CRUD de usuarios
/api/usuarios/[id]      → Operaciones por usuario específico
/api/roles              → Gestión de roles por empresa
/api/auth/login         → Autenticación y validación
```

### **Base de Datos (PostgreSQL)**
```sql
usuarios    → Información de usuarios con empresa y rol
roles       → Roles específicos por empresa
empresas    → Empresas existentes (AngloAmerican, Besalco, etc.)
```

---

## 🎯 **Flujo de Autenticación**

### **1. Acceso al Sistema**
1. Usuario visita cualquier página del sistema
2. `AuthGuard` verifica si hay sesión válida en localStorage
3. Si no hay sesión → Redirige a `/login`
4. Si hay sesión expirada → Limpia localStorage y redirige a `/login`
5. Si hay sesión válida → Permite acceso y carga datos del usuario

### **2. Proceso de Login**
1. Usuario accede a `/login`
2. Selecciona su **empresa** del dropdown (carga automáticamente)
3. Selecciona su **usuario** de la empresa (carga según empresa)
4. Ingresa **password** (desarrollo: todos usan '123')
5. Sistema valida credenciales via `/api/auth/login`
6. Si es válido → Guarda sesión en localStorage (8 horas) y redirige a `/`

### **3. Sesión Activa**
- **Duración**: 8 horas por defecto
- **Storage**: localStorage como `userSession`
- **Verificación**: Automática en cada carga de página
- **Renovación**: Manual (puede implementarse auto-renovación)

---

## 👥 **Usuarios y Roles por Empresa**

### **AngloAmerican** (Empresa Principal)
- **Ingeniero QA/QC**: Juan Pérez González
- **Jefe de Operaciones**: María Rodriguez Silva

**Permisos Especiales**:
- ✅ Crear nuevas canchas
- ✅ Cerrar canchas definitivamente  
- ✅ Generar PDFs con sus nombres reales
- ❌ No tienen acceso a gestión de usuarios (no son Admin)

### **Besalco** (Trabajo de Maquinaria)
- **Admin**: Carlos Mendez Torres
- **Operador**: Ana López Morales

### **Linkapsis** (Validación de Espesores)
- **Admin**: Roberto Sanchez Castro  
- **Operador**: Patricia Díaz Herrera

### **LlayLlay** (Validación de Densidad)
- **Admin**: Miguel Fernandez Ramos
- **Operador**: Valentina Castro Núñez

---

## 🔑 **Sistema de Permisos**

### **Por Rol**
| Rol | Crear Canchas | Validar | Admin Usuarios | Generar PDF |
|-----|---------------|---------|----------------|-------------|
| **Ingeniero QA/QC** | ✅ | ❌ | ❌ | ✅ |
| **Jefe de Operaciones** | ✅ | ❌ | ❌ | ✅ |
| **Admin** | ❌ | ✅ | ✅ | ✅ |
| **Operador** | ❌ | ✅ | ❌ | ✅ |

### **Por Empresa**
- **AngloAmerican**: Control total del proceso (crear/cerrar canchas)
- **Besalco/Linkapsis/LlayLlay**: Solo validaciones según su especialidad

---

## 📱 **Guía de Uso**

### **Para Usuarios Finales**

#### **1. Primer Acceso**
1. Ir a la URL del sistema
2. Se redirigirá automáticamente a `/login`
3. Seleccionar empresa del dropdown
4. Seleccionar usuario (se filtra por empresa)
5. Ingresar password: `123`
6. Click en "Iniciar Sesión"

#### **2. Trabajando en el Sistema**
- **Header Superior**: Muestra nombre del usuario, rol y empresa
- **Botón Admin** (solo si es Admin): Acceso a gestión de usuarios
- **Botón Logout**: Cierra sesión y limpia datos

#### **3. Funcionalidades por Empresa**
- **AngloAmerican**: Verá botón "Crear Nueva Cancha" y opciones de cierre
- **Otras Empresas**: Solo verá canchas que pueden validar según su especialidad

### **Para Administradores**

#### **1. Acceso al Panel Admin**
1. Iniciar sesión con usuario **Admin** de cualquier empresa
2. Click en "👥 Gestión Usuarios" en el header
3. Se abrirá `/admin/usuarios`

#### **2. Gestión de Usuarios**
- **Ver Todos**: Lista completa con filtros por empresa/estado
- **Crear Usuario**: Formulario completo con validaciones
- **Editar Usuario**: Modificar datos existentes
- **Activar/Desactivar**: Cambiar estado sin eliminar

#### **3. Funcionalidades Admin**
```typescript
// Crear usuario
POST /api/usuarios
{
  "nombre_completo": "Nuevo Usuario",
  "email": "usuario@empresa.com", 
  "empresa_id": 1,
  "rol_id": 2
}

// Editar usuario  
PUT /api/usuarios/[id]

// Cambiar estado
PATCH /api/usuarios/[id] 
{ "activo": false }
```

---

## 🔧 **Configuración Técnica**

### **Variables de Entorno**
```bash
# Supabase (ya configurado)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### **Instalación de la Base de Datos**
```sql
-- 1. Ejecutar en Supabase SQL Editor
\i usuarios_roles_setup.sql

-- 2. Verificar instalación  
\i test_usuarios_roles.sql

-- 3. Verificar datos
SELECT * FROM vista_usuarios_completa;
```

### **Desarrollo Local**
```bash
# Iniciar servidor de desarrollo
npm run dev

# El sistema estará disponible en:
# http://localhost:4321/login     (Login)
# http://localhost:4321/          (Sistema principal) 
# http://localhost:4321/admin/usuarios  (Panel admin)
```

---

## 🎨 **Personalización**

### **Agregar Nueva Empresa**
1. **Base de Datos**: Insertar en tabla `empresas`
2. **Roles**: Crear roles específicos en tabla `roles`  
3. **Usuarios**: Agregar usuarios iniciales
4. **Frontend**: Los dropdowns se actualizarán automáticamente

### **Crear Nuevo Rol**
```sql
INSERT INTO roles (nombre, empresa_id, descripcion) 
VALUES ('Supervisor', 1, 'Supervisor de campo');
```

### **Modificar Duración de Sesión**
```javascript
// En authStore.ts, línea ~60
const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 horas
// Cambiar el 8 por las horas deseadas
```

---

## 🚨 **Seguridad**

### **Implementado**
- ✅ Validación de sesiones con expiración
- ✅ Protección automática de rutas
- ✅ Row Level Security (RLS) en base de datos
- ✅ Validación de roles para funcionalidades específicas
- ✅ Sanitización de inputs en APIs

### **Pendiente para Producción**
- 🔄 Hash real de passwords (bcrypt/argon2)
- 🔄 JWT tokens en lugar de localStorage
- 🔄 Rate limiting en APIs
- 🔄 HTTPS obligatorio
- 🔄 Logs de auditoría detallados

---

## 🐛 **Resolución de Problemas**

### **Usuario no puede acceder**
1. Verificar que existe en tabla `usuarios`
2. Verificar que `activo = true`
3. Verificar que la empresa existe
4. Verificar que el rol existe y pertenece a la empresa

### **Página se redirige constantemente a login**
1. Verificar formato de `userSession` en localStorage
2. Verificar fechas de expiración
3. Limpiar localStorage completamente: `localStorage.clear()`

### **Admin no puede ver panel de usuarios**
1. Verificar que `rol_nombre` contenga "Admin"
2. Verificar permisos de la base de datos
3. Verificar que la vista `vista_usuarios_completa` funciona

### **PDF no muestra nombres reales**
1. Verificar que usuarios de AngloAmerican existan
2. Verificar roles "Ingeniero QA/QC" y "Jefe de Operaciones"
3. Ver logs en consola del navegador durante generación PDF

---

## 📞 **Soporte**

Para problemas específicos:

1. **Errores de Base de Datos**: Verificar logs de Supabase
2. **Problemas de Autenticación**: Revisar localStorage y sessionStorage
3. **Errores de API**: Abrir DevTools → Network para ver requests fallidos
4. **Problemas de Permisos**: Verificar datos en `vista_usuarios_completa`

---

## 🎉 **Sistema Completamente Funcional**

El sistema de autenticación está **100% operativo** y listo para uso en producción (con las mejoras de seguridad pendientes). Todos los usuarios pueden:

- ✅ **Autenticarse** con sus credenciales
- ✅ **Trabajar** según sus permisos específicos  
- ✅ **Generar PDFs** con sus nombres reales
- ✅ **Administrar usuarios** (si son Admin)
- ✅ **Mantener sesiones** por 8 horas
- ✅ **Navegar seguramente** con protección automática

**¡El sistema está listo para ser usado! 🚀**