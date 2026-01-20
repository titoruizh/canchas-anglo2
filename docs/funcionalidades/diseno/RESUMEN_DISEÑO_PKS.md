# Resumen Ejecutivo - Visualización PKs

## TL;DR

**Archivo:** `e:\TITO\1 Astro\canchas-anglo2\src\components\MiningMap.astro`
**Líneas:** 1289-1497
**Objetivo:** Crear efecto sonar elegante y profesional (no "neon")

## Paleta de Colores (OBLIGATORIA)

```javascript
Verde #10b981  → Revancha > 3.5m (OK)
Amarillo #fbbf24 → Revancha 3.0-3.5m (Precaución)  
Rojo #ef4444   → Revancha < 3.0m (Crítico)
Gris #94a3b8   → Sin datos
```

## Efecto Deseado

**Inspiración:** Radares meteorológicos (Windy.com), Flightradar24, dashboards Tesla

**Características:**
- Ondas que nacen en el centro y se expanden
- Se desvanecen progresivamente al crecer
- Muy sutiles (opacidades <0.15)
- Blur alto (>1.0)
- Animación lenta y contemplativa
- Sin punto central sólido

## Valores Actuales (No Funcionan)

```javascript
// Opacidades actuales
Onda 4: 0.02
Onda 3: 0.04  
Onda 2: 0.08
Onda 1: 0.15
Núcleo: 0.25

// Blur actual
1.0 - 1.5

// Velocidad
sonarPhase += 0.006
```

## Qué Entregar

Código JavaScript completo para:
1. Capas de Mapbox GL (4 ondas + núcleo + etiquetas)
2. Función de animación con `requestAnimationFrame`
3. Valores optimizados de opacidad, blur, radios y velocidad

## Restricciones

- Mantener IDs de capas: `revanchas-pulse-1/2/3/4`, `revanchas-glow-inner`, `revanchas-labels`
- Colores desde `["get", "dynamic_color"]`
- Compatible con Mapbox GL JS
