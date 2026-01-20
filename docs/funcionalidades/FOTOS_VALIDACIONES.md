# 📸 Sistema de Fotos para Validaciones - Guía de Implementación

## 🎯 Resumen

Sistema completo para que Besalco, Linkapsis y LlayLlay puedan subir fotos durante sus validaciones, manteniendo trazabilidad completa para reportes PDF.

---

## 📋 Archivos Creados

### 1. Migraciones SQL
- `docs/database/migrations/20251222_agregar_fotos_validaciones.sql`
  - Tabla `validaciones_fotos`
  - Índices y triggers
  - RLS policies
  - Vistas de reporte

- `docs/database/migrations/20251222_configurar_storage_fotos.sql`
  - Configuración de bucket `validaciones-fotos`
  - Políticas de Storage

### 2. API Endpoints
- `src/pages/api/validaciones/[id]/fotos.ts`
  - POST: Subir fotos (hasta 5, 5MB cada una)
  - GET: Obtener fotos de una validación

- `src/pages/api/canchas/[id]/fotos.ts`
  - GET: Obtener todas las fotos de una cancha (para reportes)

---

## 🚀 Pasos de Implementación

### Fase 1: Base de Datos (EJECUTAR PRIMERO)

#### 1.1 Ejecutar Migración Principal
```sql
-- En Supabase SQL Editor, ejecutar:
-- docs/database/migrations/20251222_agregar_fotos_validaciones.sql
```

**Resultado esperado:**
- ✅ Tabla `validaciones_fotos` creada
- ✅ 4 índices creados
- ✅ Trigger `update_validaciones_fotos_updated_at` creado
- ✅ 4 políticas RLS creadas
- ✅ 2 vistas creadas: `vista_fotos_reporte`, `vista_resumen_fotos_cancha`
- ✅ 1 función creada: `obtener_fotos_cancha()`

#### 1.2 Configurar Supabase Storage
```sql
-- En Supabase SQL Editor, ejecutar:
-- docs/database/migrations/20251222_configurar_storage_fotos.sql
```

**Resultado esperado:**
- ✅ Bucket `validaciones-fotos` creado (público, 5MB límite)
- ✅ 4 políticas de Storage creadas

#### 1.3 Verificar Instalación
```sql
-- Verificar tabla
SELECT COUNT(*) FROM validaciones_fotos;
-- Debe retornar: 0 (tabla vacía pero existente)

-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'validaciones-fotos';
-- Debe retornar: 1 fila con public=true

-- Verificar vistas
SELECT * FROM vista_resumen_fotos_cancha LIMIT 5;
-- Debe retornar: Resumen de fotos por cancha
```

---

### Fase 2: Frontend (PENDIENTE)

#### 2.1 Modificar Modal de Besalco

**Archivo:** `src/pages/index.astro` (líneas 4774-4810)

**Agregar ANTES de los botones de acción:**

```html
<!-- Agregar después de la línea 4798 (textarea de observaciones) -->
<div class="form-group">
  <label for="fotos-besalco">
    📸 Fotos de Terreno (Opcional):
    <small>Máximo 5 fotos, 5MB cada una</small>
  </label>
  <input 
    type="file" 
    id="fotos-besalco" 
    name="fotos"
    accept="image/jpeg,image/png,image/webp"
    multiple
    class="file-input"
  />
  <div id="preview-fotos-besalco" class="fotos-preview"></div>
</div>
```

#### 2.2 Modificar Modal de Linkapsis

**Archivo:** `src/pages/index.astro` (líneas 4000-4220)

**Agregar ANTES de los botones de acción (después de las coordenadas):**

```html
<!-- Agregar después de la línea 4201 (coordenadas P4) -->
<div class="form-group">
  <label for="fotos-linkapsis">
    📸 Fotos de Terreno (Opcional):
    <small>Máximo 5 fotos, 5MB cada una</small>
  </label>
  <input 
    type="file" 
    id="fotos-linkapsis" 
    name="fotos"
    accept="image/jpeg,image/png,image/webp"
    multiple
    class="file-input"
  />
  <div id="preview-fotos-linkapsis" class="fotos-preview"></div>
</div>
```

#### 2.3 Modificar Modal de LlayLlay

**Archivo:** `src/pages/index.astro` (líneas 4727-4770)

**Agregar ANTES de los botones de acción:**

```html
<!-- Agregar después de la línea 4761 (input de densidad) -->
<div class="form-group">
  <label for="fotos-llayllay">
    📸 Fotos de Terreno (Opcional):
    <small>Máximo 5 fotos, 5MB cada una</small>
  </label>
  <input 
    type="file" 
    id="fotos-llayllay" 
    name="fotos"
    accept="image/jpeg,image/png,image/webp"
    multiple
    class="file-input"
  />
  <div id="preview-fotos-llayllay" class="fotos-preview"></div>
</div>
```

#### 2.4 Agregar CSS para Fotos

**Archivo:** `src/pages/index.astro` (en la sección `<style>`)

```css
/* Estilos para input de fotos */
.file-input {
  display: block;
  width: 100%;
  padding: 0.75rem;
  border: 2px dashed #3498db;
  border-radius: 8px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.file-input:hover {
  border-color: #2980b9;
  background: #e8f4f8;
}

/* Preview de fotos */
.fotos-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.foto-preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
  background: #f5f5f5;
}

.foto-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.foto-preview-item .remove-foto {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(231, 76, 60, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.foto-preview-item .remove-foto:hover {
  background: rgba(192, 57, 43, 1);
}
```

#### 2.5 Agregar JavaScript para Preview

**Archivo:** `src/pages/index.astro` (en la sección `<script>`)

**Agregar esta función:**

```javascript
// Función para manejar preview de fotos
function setupFotoPreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  
  if (!input || !preview) return;
  
  input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    preview.innerHTML = '';
    
    if (files.length > 5) {
      alert('Máximo 5 fotos permitidas');
      input.value = '';
      return;
    }
    
    files.forEach((file, index) => {
      // Validar tamaño
      if (file.size > 5 * 1024 * 1024) {
        alert(`La foto "${file.name}" excede 5MB`);
        return;
      }
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const div = document.createElement('div');
        div.className = 'foto-preview-item';
        div.innerHTML = `
          <img src="${e.target.result}" alt="Preview ${index + 1}">
          <button type="button" class="remove-foto" data-index="${index}">×</button>
        `;
        preview.appendChild(div);
        
        // Botón para remover foto
        div.querySelector('.remove-foto').addEventListener('click', () => {
          const dt = new DataTransfer();
          const files = Array.from(input.files);
          files.splice(index, 1);
          files.forEach(f => dt.items.add(f));
          input.files = dt.files;
          input.dispatchEvent(new Event('change'));
        });
      };
      reader.readAsDataURL(file);
    });
  });
}

// Inicializar previews cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
  setupFotoPreview('fotos-besalco', 'preview-fotos-besalco');
  setupFotoPreview('fotos-linkapsis', 'preview-fotos-linkapsis');
  setupFotoPreview('fotos-llayllay', 'preview-fotos-llayllay');
});
```

#### 2.6 Modificar Funciones de Envío de Formularios

**Buscar las funciones que envían los formularios de validación y agregar la subida de fotos:**

**Ejemplo para Besalco (adaptar para Linkapsis y LlayLlay):**

```javascript
// Dentro de la función que maneja el submit del formulario de Besalco
async function enviarValidacionBesalco(canchaId, observaciones, resultado) {
  try {
    // 1. Enviar validación (código existente)
    const responseValidacion = await fetch(`/api/canchas/${canchaId}/validar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa_validadora_id: 2, // Besalco
        tipo_validacion: 'trabajo',
        resultado: resultado,
        observaciones: observaciones
      })
    });
    
    const dataValidacion = await responseValidacion.json();
    const validacionId = dataValidacion.validacion_id;
    
    // 2. Subir fotos si hay
    const inputFotos = document.getElementById('fotos-besalco');
    if (inputFotos && inputFotos.files.length > 0) {
      const formData = new FormData();
      Array.from(inputFotos.files).forEach(file => {
        formData.append('fotos', file);
      });
      
      const responseFotos = await fetch(`/api/validaciones/${validacionId}/fotos`, {
        method: 'POST',
        body: formData
      });
      
      const dataFotos = await responseFotos.json();
      console.log('Fotos subidas:', dataFotos);
    }
    
    // 3. Continuar con el flujo normal...
    alert('Validación enviada exitosamente');
    location.reload();
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error al enviar validación');
  }
}
```

---

## 📊 Uso en Reportes PDF

### Obtener Fotos para Reporte

```javascript
// Obtener todas las fotos de una cancha
const response = await fetch(`/api/canchas/${canchaId}/fotos`);
const data = await response.json();

// data.fotos_por_empresa contiene:
// {
//   Besalco: [...],
//   Linkapsis: [...],
//   LlayLlay: [...]
// }

// Generar HTML para PDF
const htmlBesalco = data.fotos_por_empresa.Besalco.map(foto => `
  <div class="foto-reporte">
    <img src="${foto.storage_url}" alt="${foto.nombre_archivo}" />
    <p>${foto.observaciones}</p>
    <small>Subida: ${new Date(foto.foto_created_at).toLocaleDateString()}</small>
  </div>
`).join('');
```

---

## ✅ Checklist de Implementación

### Base de Datos
- [ ] Ejecutar `20251222_agregar_fotos_validaciones.sql`
- [ ] Ejecutar `20251222_configurar_storage_fotos.sql`
- [ ] Verificar tabla `validaciones_fotos` existe
- [ ] Verificar bucket `validaciones-fotos` existe
- [ ] Probar subida manual de foto en Supabase Storage

### API
- [x] Endpoint POST `/api/validaciones/[id]/fotos` creado
- [x] Endpoint GET `/api/validaciones/[id]/fotos` creado
- [x] Endpoint GET `/api/canchas/[id]/fotos` creado
- [ ] Probar endpoints con Postman/Thunder Client

### Frontend
- [ ] Agregar input de fotos a modal Besalco
- [ ] Agregar input de fotos a modal Linkapsis
- [ ] Agregar input de fotos a modal LlayLlay
- [ ] Agregar CSS para preview
- [ ] Agregar JavaScript para preview
- [ ] Modificar función de envío Besalco
- [ ] Modificar función de envío Linkapsis
- [ ] Modificar función de envío LlayLlay

### Testing
- [ ] Probar subida de 1 foto
- [ ] Probar subida de 5 fotos
- [ ] Probar subida de foto >5MB (debe rechazar)
- [ ] Probar subida de archivo no-imagen (debe rechazar)
- [ ] Verificar fotos en Supabase Storage
- [ ] Verificar registros en tabla `validaciones_fotos`
- [ ] Probar obtención de fotos para reporte

---

## 🔍 Queries Útiles para Testing

```sql
-- Ver todas las fotos subidas
SELECT * FROM validaciones_fotos ORDER BY created_at DESC;

-- Ver resumen por cancha
SELECT * FROM vista_resumen_fotos_cancha;

-- Ver fotos para reporte de una cancha específica
SELECT * FROM vista_fotos_reporte WHERE cancha_id = 227;

-- Obtener fotos de una cancha usando la función
SELECT * FROM obtener_fotos_cancha(227);

-- Eliminar fotos de prueba
DELETE FROM validaciones_fotos WHERE cancha_id = 227;
```

---

## 📝 Próximos Pasos

1. **Ejecutar migraciones SQL** en Supabase
2. **Probar APIs** con herramienta de testing
3. **Modificar modales HTML** con inputs de fotos
4. **Agregar CSS y JavaScript** para preview
5. **Modificar funciones de envío** para incluir fotos
6. **Probar flujo completo** con datos reales
7. **Integrar en reportes PDF**

---

**Estado:** Backend completado ✅ | Frontend pendiente ⏳
