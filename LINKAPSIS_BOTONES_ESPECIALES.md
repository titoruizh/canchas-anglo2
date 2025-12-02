# Botones Especiales para Linkapsis

## 📋 Descripción General

Se han implementado dos botones especiales que solo aparecen cuando el usuario logueado pertenece a la empresa **Linkapsis**. Estos botones permiten funcionalidades de carga de datos:

1. **📤 Subir Revanchas** - Modal para cargar información de revanchas
2. **📁 Subir Canchas** - Modal para carga masiva de canchas

---

## 🎨 Ubicación Visual

Los botones se encuentran en el **header** de la aplicación, ubicados entre:
- Botón "Gestión Usuarios" (solo para AngloAmerican)
- Botón "Cerrar Sesión"

---

## 🏗️ Estructura de Código

### 1. HTML - Botones en Header

**Ubicación:** `src/pages/index.astro` - Líneas ~3045-3066

```html
<!-- === BOTONES ESPECIALES PARA LINKAPSIS === -->
<button
  id="btn-subir-revanchas"
  type="button"
  class="header-btn header-btn-linkapsis"
  style="display: none;">📤 Subir Revanchas</button>

<button
  id="btn-subir-canchas"
  type="button"
  class="header-btn header-btn-linkapsis"
  style="display: none;">📁 Subir Canchas</button>
```

### 2. CSS - Estilos de Botones

**Ubicación:** `src/pages/index.astro` - Líneas ~225-240

```css
.header-btn-linkapsis {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  font-size: 0.9rem;
}

.header-btn-linkapsis:hover {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(139, 92, 246, 0.4);
}

.header-btn-linkapsis:active {
  transform: translateY(0);
  box-shadow: 0 1px 5px rgba(139, 92, 246, 0.3);
}
```

**Color:** Gradiente púrpura (#8b5cf6 → #7c3aed → #6d28d9)

### 3. HTML - Modales

**Ubicación:** `src/pages/index.astro` - Líneas ~3557-3650

#### Modal Subir Revanchas
```html
<div id="modal-subir-revanchas" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 class="modal-title">📤 Subir Revanchas - Linkapsis</h3>
      <button class="close-btn">×</button>
    </div>
    <div class="modal-body">
      <!-- TODO: Formulario de carga -->
    </div>
    <div class="form-actions">
      <button type="button" class="btn-cancel">Cerrar</button>
    </div>
  </div>
</div>
```

#### Modal Subir Canchas
```html
<div id="modal-subir-canchas" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 class="modal-title">📁 Subir Canchas - Linkapsis</h3>
      <button class="close-btn">×</button>
    </div>
    <div class="modal-body">
      <!-- TODO: Formulario de carga masiva -->
    </div>
    <div class="form-actions">
      <button type="button" class="btn-cancel">Cerrar</button>
    </div>
  </div>
</div>
```

### 4. JavaScript - Lógica de Control

**Ubicación:** `src/pages/index.astro`

#### A. Mostrar botones solo para Linkapsis

**Líneas ~4394-4410**

```javascript
// === MOSTRAR BOTONES ESPECIALES PARA LINKAPSIS ===
const btnSubirRevanchas = document.getElementById("btn-subir-revanchas");
const btnSubirCanchas = document.getElementById("btn-subir-canchas");

if (usuario.empresa_nombre === "Linkapsis") {
  console.log("Mostrando botones especiales para Linkapsis");
  if (btnSubirRevanchas) btnSubirRevanchas.style.display = "inline-flex";
  if (btnSubirCanchas) btnSubirCanchas.style.display = "inline-flex";
} else {
  if (btnSubirRevanchas) btnSubirRevanchas.style.display = "none";
  if (btnSubirCanchas) btnSubirCanchas.style.display = "none";
}
```

#### B. Configuración de Event Listeners

**Líneas ~4467-4569**

```javascript
/**
 * Configurar event listeners para los botones especiales de Linkapsis
 */
function configurarBotonesLinkapsis() {
  const btnSubirRevanchas = document.getElementById("btn-subir-revanchas");
  const btnSubirCanchas = document.getElementById("btn-subir-canchas");
  
  // Event listener para Subir Revanchas
  if (btnSubirRevanchas) {
    btnSubirRevanchas.addEventListener("click", () => {
      console.log("Abriendo modal de Subir Revanchas");
      abrirModalSubirRevanchas();
    });
  }

  // Event listener para Subir Canchas
  if (btnSubirCanchas) {
    btnSubirCanchas.addEventListener("click", () => {
      console.log("Abriendo modal de Subir Canchas");
      abrirModalSubirCanchas();
    });
  }

  // Configurar cierre de modales
  configurarCierreModalesLinkapsis();
}
```

#### C. Funciones de Apertura de Modales

```javascript
/**
 * Abrir modal de Subir Revanchas
 * TODO: Implementar lógica de carga y procesamiento de revanchas
 */
function abrirModalSubirRevanchas() {
  const modal = document.getElementById("modal-subir-revanchas");
  if (modal) {
    modal.classList.add("show");
    // TODO: Inicializar formulario, limpiar campos previos
    // TODO: Configurar validaciones de archivo
  }
}

/**
 * Abrir modal de Subir Canchas
 * TODO: Implementar lógica de carga masiva de canchas
 */
function abrirModalSubirCanchas() {
  const modal = document.getElementById("modal-subir-canchas");
  if (modal) {
    modal.classList.add("show");
    // TODO: Inicializar formulario, limpiar campos previos
    // TODO: Configurar validaciones de archivo y geometrías
  }
}
```

#### D. Cierre de Modales

```javascript
/**
 * Configurar event listeners para cerrar modales de Linkapsis
 * Permite cerrar con:
 * - Botón X (close-btn)
 * - Botón Cancelar/Cerrar (btn-cancel)
 * - Click fuera del modal (backdrop)
 */
function configurarCierreModalesLinkapsis() {
  const modales = [
    { id: "modal-subir-revanchas", nombre: "Subir Revanchas" },
    { id: "modal-subir-canchas", nombre: "Subir Canchas" }
  ];

  modales.forEach(modalInfo => {
    const modal = document.getElementById(modalInfo.id);
    if (!modal) {
      console.warn(`Modal ${modalInfo.nombre} no encontrado`);
      return;
    }

    const closeBtn = modal.querySelector(".close-btn");
    const cancelBtn = modal.querySelector(".btn-cancel");
    
    // Cerrar con botón X
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.classList.remove("show");
      });
    }
    
    // Cerrar con botón Cancelar/Cerrar
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        modal.classList.remove("show");
      });
    }
    
    // Cerrar al hacer click en el backdrop
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("show");
      }
    });
  });
}
```

---

## 🔄 Flujo de Funcionamiento

```
1. Usuario se autentica como Linkapsis
   ↓
2. Sistema detecta empresa_nombre === "Linkapsis"
   ↓
3. Botones "Subir Revanchas" y "Subir Canchas" se hacen visibles
   ↓
4. Usuario hace click en uno de los botones
   ↓
5. Se ejecuta abrirModalSubirRevanchas() o abrirModalSubirCanchas()
   ↓
6. Modal correspondiente se abre (classList.add("show"))
   ↓
7. Usuario puede cerrar con X, Cancelar o click fuera
   ↓
8. Modal se cierra (classList.remove("show"))
```

---

## ✅ Estado Actual de Implementación

### ✅ COMPLETADO
- [x] Botones HTML creados con IDs únicos
- [x] Estilos CSS con gradiente púrpura
- [x] Modales HTML con estructura base
- [x] Lógica de visibilidad según empresa
- [x] Event listeners para abrir modales
- [x] Event listeners para cerrar modales (3 formas)
- [x] Logging en consola para debugging
- [x] Documentación completa

### 🚧 PENDIENTE (TODO)
- [ ] **Modal Subir Revanchas:**
  - [ ] Formulario de selección de archivo (CSV/Excel)
  - [ ] Preview de datos cargados
  - [ ] Validación de formato de archivo
  - [ ] Procesamiento y envío a API
  - [ ] Mensajes de éxito/error
  - [ ] Barra de progreso de carga

- [ ] **Modal Subir Canchas:**
  - [ ] Formulario de selección de archivo (CSV/Excel/GeoJSON)
  - [ ] Preview de datos con vista de mapa
  - [ ] Validación de geometrías (polígonos)
  - [ ] Asignación de campos (mapping)
  - [ ] Procesamiento y creación masiva
  - [ ] Mensajes de éxito/error
  - [ ] Reporte de canchas creadas/fallidas

---

## 🎯 Próximos Pasos para Desarrollo

### 1. Implementar Modal Subir Revanchas

**Estructura sugerida:**

```html
<div class="modal-body">
  <div class="upload-section">
    <label for="file-revanchas" class="upload-label">
      📎 Seleccionar archivo de revanchas
    </label>
    <input type="file" id="file-revanchas" accept=".csv,.xlsx,.xls" />
    <p class="file-hint">Formatos permitidos: CSV, Excel (.xlsx, .xls)</p>
  </div>

  <div id="preview-revanchas" class="preview-section" style="display: none;">
    <!-- Tabla de preview de datos -->
  </div>

  <div id="error-revanchas" class="error-section" style="display: none;">
    <!-- Mensajes de error de validación -->
  </div>
</div>

<div class="form-actions">
  <button type="button" class="btn-cancel">Cancelar</button>
  <button type="button" class="btn-primary" id="btn-procesar-revanchas" disabled>
    Procesar Revanchas
  </button>
</div>
```

**Funciones JavaScript necesarias:**

```javascript
// Manejar selección de archivo
function handleFileSelectRevanchas(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validar formato
  if (!validateFileFormat(file, ['csv', 'xlsx', 'xls'])) {
    mostrarError("Formato de archivo no válido");
    return;
  }
  
  // Leer y parsear archivo
  parseRevanchasFile(file);
}

// Parsear archivo de revanchas
async function parseRevanchasFile(file) {
  // Implementar lectura con FileReader o library (Papa Parse para CSV)
  // Mostrar preview de datos
  // Habilitar botón de procesar
}

// Procesar y enviar revanchas a API
async function procesarRevanchas(data) {
  try {
    const response = await fetch('/api/revanchas/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revanchas: data })
    });
    
    if (response.ok) {
      mostrarMensaje("Revanchas cargadas exitosamente", "success");
      cerrarModal();
    } else {
      mostrarMensaje("Error al cargar revanchas", "error");
    }
  } catch (error) {
    console.error("Error:", error);
    mostrarMensaje("Error de conexión", "error");
  }
}
```

### 2. Implementar Modal Subir Canchas

Similar al anterior pero con:
- Validación de geometrías (GeoJSON)
- Vista previa en mapa (usando Mapbox)
- Asignación de campos adicionales (Muro, Sector, etc.)

---

## 🔍 Testing

### Casos de Prueba

1. **Visibilidad de Botones:**
   - ✅ Login como AngloAmerican → Botones NO visibles
   - ✅ Login como Besalco → Botones NO visibles
   - ✅ Login como Linkapsis → Botones SÍ visibles
   - ✅ Login como LlayLlay → Botones NO visibles

2. **Apertura de Modales:**
   - ✅ Click en "Subir Revanchas" → Modal correcto se abre
   - ✅ Click en "Subir Canchas" → Modal correcto se abre

3. **Cierre de Modales:**
   - ✅ Click en X → Modal se cierra
   - ✅ Click en Cancelar → Modal se cierra
   - ✅ Click fuera del modal → Modal se cierra
   - ✅ ESC key → (TODO: implementar si es necesario)

---

## 📝 Notas de Desarrollo

- Los modales usan la misma clase `.modal` que otros modales del sistema
- Los botones siguen el mismo patrón de diseño que "Gestión Usuarios"
- El color púrpura (#8b5cf6) diferencia visualmente de otros botones
- Los modales están preparados estructuralmente pero requieren implementación funcional
- Se agregó logging en consola para facilitar debugging
- La estructura permite fácil extensión para agregar más botones en el futuro

---

## 🤝 Contribución Futura

Para agregar funcionalidad a los modales:

1. Editar el contenido de `.modal-body` en el HTML
2. Crear funciones de procesamiento en JavaScript
3. Crear endpoints API en `/src/pages/api/` si es necesario
4. Actualizar esta documentación con los cambios

---

**Última actualización:** 2 de diciembre de 2025
**Autor:** Sistema de IA - GitHub Copilot
**Versión:** 1.0
