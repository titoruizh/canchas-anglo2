# 🛠️ CreateCanchaManager

**Ubicación:** `src/utils/CreateCanchaManager.ts`
**Tipo:** Class / Singleton Logic
**Dependencias:** `CreateCanchaModal.astro`, `api/canchas.ts`

## 📖 Descripción General

`CreateCanchaManager` centraliza toda la lógica necesaria para el flujo de creación de una nueva cancha en el dashboard. Su propósito es desacoplar la compleja lógica de validación, interacción con mapas y llamadas a API del archivo principal `index.astro`.

## ⚙️ Funcionalidades Principales

### 1. Gestión del Modal
Controla la visibilidad del modal y el ciclo de vida del iframe de Mapbox.

```typescript
// Abre el modal y resetea el formulario
manager.openModal();

// Cierra el modal y limpia el iframe para liberar memoria
manager.closeModal();
```

### 2. Comunicación con Mapbox
Utiliza `window.postMessage` para comunicarse con el iframe `mapbox-window.astro` en modo dibujo.

- **URL:** `/mapbox-window?drawing=true`
- **Eventos Escuchados:**
    - `polygon-drawn`: Recibe las coordenadas del polígono dibujado.
    - `polygon-deleted`: Limpia el estado interno si el usuario borra el dibujo.

### 3. Validación de Negocio
Implementa reglas específicas de la operación minera para los sectores:

- **Muro MP:** Sectores permitidos `S1` a `S7`.
- **Muro ME:** Sectores permitidos `S1` a `S3`.
- **Muro MO:** Sectores permitidos `S1` a `S3`.

### 4. Feedback al Usuario (Toast)
Reemplaza las alertas nativas con un sistema de notificaciones visuales (`showNotification`).

- **Éxito:** Icono verde ✅, fondo oscuro.
- **Error:** Icono rojo ❌, mensaje descriptivo (ej. "Nombre duplicado").

## 📋 API Pública

| Método | Descripción |
|--------|-------------|
| `constructor()` | Inicializa los listeners del DOM y del botón de creación. |
| `openModal()` | Muestra el modal y carga el mapa. |
| `closeModal()` | Oculta el modal y destruye el iframe. |
| `validateForm()` | Verifica que todos los campos y el polígono estén listos. Habilita/deshabilita el botón. |
| `createCancha()` | Envía el POST a la API. Maneja respuestas 201 y 409. |

## 🚀 Uso en `index.astro`

El manager se instancia una única vez al cargar la página:

```typescript
import { CreateCanchaManager } from "../utils/CreateCanchaManager";

document.addEventListener("DOMContentLoaded", () => {
    // Inicialización automática
    const createCanchaManager = new CreateCanchaManager();
    
    // Exponer globalmente si es necesario para depuración
    (window as any).createCanchaManager = createCanchaManager;
});
```

## ⚠️ Manejo de Errores

El manager captura errores de red y de lógica de negocio:

1. **Conflictos (409):** Si el nombre de la cancha ya existe, muestra un toast específico.
2. **Faltan Datos:** Si se intenta enviar sin dibujo o campos, bloquea el envío.
3. **Error Servidor (500):** Muestra el mensaje técnico si está disponible, o "Desconocido".
