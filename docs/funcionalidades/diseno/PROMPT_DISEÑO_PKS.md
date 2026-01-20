# Prompt para Diseñador Web: Visualización Elegante de PKs en Mapa

## Contexto del Proyecto

Estoy trabajando en una aplicación de monitoreo de muros de contención mineros. Necesito mejorar la visualización de puntos kilométricos (PKs) en un mapa Mapbox GL cuando el usuario activa el toggle "Revanchas".

## Archivo a Modificar

**Ruta:** `e:\TITO\1 Astro\canchas-anglo2\src\components\MiningMap.astro`

**Sección específica:** Líneas 1289-1497 (función `mostrarRevanchasEnMapa`)

## Problema Actual

La visualización actual tiene un aspecto "neon" y contaminante visualmente. Las ondas pulsantes no se ven elegantes ni profesionales.

## Objetivo

Crear una visualización **elegante, sutil y profesional** de PKs en el mapa con las siguientes características:

### Requisitos Funcionales

1. **Colores según estado** (CRÍTICO - NO CAMBIAR):
   - 🟢 Verde `#10b981`: Revancha > 3.5m (OK)
   - 🟡 Amarillo `#fbbf24`: Revancha 3.0-3.5m (Precaución)
   - 🔴 Rojo `#ef4444`: Revancha < 3.0m (Crítico)
   - ⚪ Gris `#94a3b8`: Sin datos

2. **Efecto Sonar Real**:
   - Ondas que se expanden desde el centro (radio crece)
   - Se desvanecen progresivamente al expandirse (opacidad disminuye)
   - Efecto contemplativo y elegante, NO agresivo
   - Sin punto central sólido/definido

3. **Líneas de Conexión**:
   - Conectan PKs cercanos (<100m de distancia)
   - Muy sutiles, no contaminantes
   - Color del PK de origen

4. **Popup Informativo**:
   - Se activa al hacer click en un PK
   - Muestra: PK número, muro, sector, valores de revancha/ancho/coronamiento/lama
   - Diseño moderno con badges de estado

### Requisitos de Diseño

**Estilo deseado:**
- Minimalista y refinado
- Opacidades muy bajas (máximo 0.15-0.20)
- Blur alto para suavidad
- Transiciones fluidas y naturales
- Inspiración: Interfaces de radar militar, sistemas de monitoreo aeronáutico, dashboards de Tesla

**Lo que NO queremos:**
- Aspecto "neon" brillante
- Colores saturados o intensos
- Animaciones bruscas o rápidas
- Contaminación visual
- Puntos centrales sólidos con bordes duros

## Estructura Técnica Actual

### Capas de Mapbox GL (en orden):

```javascript
// 1. Líneas de conexión
map.addLayer({
  id: "revanchas-connections",
  type: "line",
  source: "revanchas-lines",
  paint: {
    "line-color": ["get", "from_color"],
    "line-width": [...],
    "line-opacity": 0.25,
    "line-blur": 2
  }
});

// 2-5. Cuatro capas de ondas pulsantes (pulse-4, pulse-3, pulse-2, pulse-1)
// 6. Glow central (revanchas-glow-inner)
// 7. Etiquetas (revanchas-labels)
```

### Animación Actual

```javascript
function animateElegantSonar() {
  // Fase de 0 a 1 para cada onda
  // Opacidad disminuye con fadeOut(phase)
  // Radio se expande: baseRadius * (1 + phase * expandFactor)
}
```

## Lo que Necesito

Por favor, proporciona:

1. **Código completo** para las capas de Mapbox GL (líneas 1262-1395)
2. **Código completo** para la función de animación (líneas 1427-1497)
3. **Valores específicos** para:
   - Opacidades base de cada capa
   - Valores de blur
   - Radios base y factores de expansión
   - Velocidad de animación
   - Función de easing/transición

4. **Explicación breve** de las decisiones de diseño

## Restricciones Técnicas

- Usar Mapbox GL JS (ya importado)
- Mantener los IDs de capas existentes (para compatibilidad con función de ocultación)
- La animación debe usar `requestAnimationFrame`
- Los colores deben venir de `["get", "dynamic_color"]` (ya calculados)

## Ejemplo de Referencia Visual

Buscar inspiración en:
- Radares meteorológicos modernos (Weather.com, Windy.com)
- Sistemas de tráfico aéreo (Flightradar24)
- Dashboards de Tesla/Rivian
- Mapas de calor sutiles de Strava

## Datos Disponibles

Cada PK tiene:
```javascript
{
  pk: "123",           // Número del PK
  muro: "MP",          // Muro Poniente/Este/Oeste
  sector: "A",         // Sector
  revancha: 3.2,       // Metros
  ancho: 16.5,         // Metros
  coronamiento: 0.8,   // Metros
  lama: 2.1,          // Metros
  dynamic_color: "#fbbf24"  // Color calculado
}
```

## Entrega

Proporciona el código JavaScript completo y listo para reemplazar en las líneas indicadas, con comentarios explicativos de las decisiones de diseño visual.
