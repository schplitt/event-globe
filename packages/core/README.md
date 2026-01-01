# @event-globe/core

Core EventGlobe component for framework-agnostic globe visualizations. A Three.js `Group` containing a 3D globe with animated arcs, land masses, and atmospheric effects.

## Installation

```sh
npm install @event-globe/core three
```

## Overview

`EventGlobe` is a Three.js `Group` that includes:

- **Globe sphere** - Textured sphere mesh with configurable appearance
- **Lighting system** - Ambient, directional, and point lights for realistic illumination
- **Atmosphere** - Optional glow effect around the globe
- **Land polygons** - H3 hexagon-based land mass visualization
- **Animated arcs** - Flying arcs between coordinates with customizable animations
- **Point markers** - Optional start/end point indicators
- **Ripple rings** - Animated expanding rings at arc endpoints

## Usage

```ts
import { Scene, PerspectiveCamera, WebGLRenderer } from 'three'
import { EventGlobe } from '@event-globe/core'
import type { GlobeConfig, ArcOptions } from '@event-globe/core'

// Setup Three.js scene
const scene = new Scene()
const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000)
const renderer = new WebGLRenderer()

// Create and add globe
const config: GlobeConfig = {
  globeColor: '#3a228a',
  showLandPolygons: true,
  showAtmosphere: true,
}

const globe = new EventGlobe(config)
scene.add(globe)

// Add an arc
globe.addArc({
  startLat: 40.7128,
  startLng: -74.0060,
  endLat: 51.5074,
  endLng: -0.1278,
  color: '#DD63AF',
  showEndRing: true,
})

// In your render loop
function animate() {
  requestAnimationFrame(animate)
  globe.update() // Update arc animations
  renderer.render(scene, camera)
}
animate()
```

## Configuration

### GlobeConfig

Configuration options for the globe appearance and behavior:

| Option               | Type      | Default                   | Description                                                    |
| -------------------- | --------- | ------------------------- | -------------------------------------------------------------- |
| `globeRadius`        | `number`  | `100`                     | Radius of the globe in Three.js units                          |
| `globeColor`         | `string`  | `"#3a228a"`               | Main color of the globe surface (hex string)                   |
| `emissive`           | `string`  | `"#220038"`               | Emissive (self-illumination) color (hex string)                |
| `emissiveIntensity`  | `number`  | `0.1`                     | Intensity of the emissive color (0-1)                          |
| `shininess`          | `number`  | `0.7`                     | Shininess of the globe surface material (0-100)                |
| `showLandPolygons`   | `boolean` | `true`                    | Whether to show land masses as hexagon patterns                |
| `landPolygonColor`   | `string`  | `"rgba(255,255,255,0.7)"` | Color for land polygon hexagons (hex or rgba string)           |
| `landPolygonOpacity` | `number`  | `0.7`                     | Opacity for land polygons (0-1)                                |
| `hexResolution`      | `number`  | `3`                       | H3 hexagon resolution for land (0-15, higher = more detail)    |
| `hexMargin`          | `number`  | `0.7`                     | Margin between hexagons (0-1, higher = more spacing)           |
| `hexUseDots`         | `boolean` | `false`                   | Use circular dots instead of hexagons for land                 |
| `hexAltitude`        | `number`  | `0.0005`                  | Altitude of hexagons above globe surface                       |
| `showAtmosphere`     | `boolean` | `true`                    | Whether to show atmospheric glow effect around globe           |
| `atmosphereColor`    | `string`  | `"#3a228a"`               | Color of the atmosphere glow (hex string)                      |
| `atmosphereAltitude` | `number`  | `0.25`                    | Size of atmosphere relative to globe radius (0-1)              |
| `defaultArcColor`    | `string`  | `"#DD63AF"`               | Default color for arcs when not specified (hex string)         |
| `defaultRingColor`   | `string`  | same as `defaultArcColor` | Default color for ripple rings when not specified (hex string) |
| `ringMaxScale`       | `number`  | `3.5`                     | Maximum scale for ring expansion animation                     |
| `ringExpansionSpeed` | `number`  | `0.08`                    | Speed of ring expansion (0-1, higher = faster)                 |

### ArcOptions

Configuration options for arc animations:

| Option              | Type                | Default        | Description                                                                   |
| ------------------- | ------------------- | -------------- | ----------------------------------------------------------------------------- |
| `startLat`          | `number`            | **required**   | Starting latitude in degrees (-90 to 90)                                      |
| `startLng`          | `number`            | **required**   | Starting longitude in degrees (-180 to 180)                                   |
| `endLat`            | `number`            | **required**   | Ending latitude in degrees (-90 to 90)                                        |
| `endLng`            | `number`            | **required**   | Ending longitude in degrees (-180 to 180)                                     |
| `color`             | `string`            | `"#DD63AF"`    | Color of the arc as a hex string                                              |
| `animationDuration` | `number`            | `2000`         | Duration of flight animation in milliseconds (ignored if arcVelocity is set)  |
| `arcVelocity`       | `number`            | `0` (disabled) | Velocity in units per second - if set, duration is calculated from arc length |
| `startDelay`        | `number`            | `0`            | Delay before animation starts in milliseconds                                 |
| `endDelay`          | `number`            | `500`          | Delay before removing arc after animation completes (ms)                      |
| `strokeWidth`       | `number`            | `0.4`          | Width of the arc stroke                                                       |
| `showStartPoint`    | `boolean \| string` | `false`        | Show marker dot at start point (true/false or color hex string)               |
| `showEndPoint`      | `boolean \| string` | `false`        | Show marker dot at end point (true/false or color hex string)                 |
| `pointRadius`       | `number`            | `1.5`          | Radius of point markers in Three.js units                                     |
| `showStartRing`     | `boolean \| string` | `false`        | Show ripple ring at start point (true/false or color hex string)              |
| `showEndRing`       | `boolean \| string` | `true`         | Show ripple ring at end point (true/false or color hex string)                |
| `flyingSegment`     | `boolean`           | `true`         | Show moving segment along the arc path                                        |
| `segmentLength`     | `number`            | `0.15`         | Length of flying segment as fraction of total arc (0.0-1.0)                   |

## API

### Methods

#### `addArc(options: ArcOptions): number`

Add an animated arc between two coordinates.

**Returns:** Arc ID for use with `removeArcById()`

```ts
const arcId = globe.addArc({
  startLat: 40.7128,
  startLng: -74.0060,
  endLat: 51.5074,
  endLng: -0.1278,
  color: '#DD63AF',
  animationDuration: 2000,
  showEndRing: true,
})
```

#### `removeArcById(id: number): void`

Remove a specific arc by its ID.

```ts
globe.removeArcById(arcId)
```

#### `clearAllArcs(): void`

Remove all arcs from the globe.

```ts
globe.clearAllArcs()
```

#### `getActiveArcCount(): number`

Get the current number of active arcs.

```ts
const count = globe.getActiveArcCount()
```

#### `onArcRemoved(callback: (id: number, options: ArcOptions) => void): void`

Set a callback to be invoked when an arc is removed (either manually or automatically after animation completes).

```ts
globe.onArcRemoved((id, options) => {
  console.log(`Arc ${id} removed:`, options)
})
```

#### `update(): void`

Update arc animations. **Must be called in your render loop.**

```ts
function animate() {
  requestAnimationFrame(animate)
  globe.update() // Update arc animations
  renderer.render(scene, camera)
}
```

#### `updateConfig(config: GlobeConfig): void`

Update the globe configuration dynamically.

```ts
globe.updateConfig({
  globeColor: '#ff0000',
  showAtmosphere: false,
})
```

#### `dispose(): void`

Clean up all resources and dispose of geometries and materials.

```ts
globe.dispose()
```

## Lighting

The EventGlobe includes its own lighting system:

- **Ambient Light** - Soft overall illumination (intensity: 1.1)
- **Directional Light** - Main light source positioned at (1, 1, 1) with intensity 0.5
- **Point Light** - Additional point light at (300, 300, 300) with intensity 1.0

These lights are automatically added to the globe's internal `lightsGroup` and do not affect other objects in your scene.

## Advanced Usage

### Using with Custom Three.js Setup

```ts
import { Scene, PerspectiveCamera, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EventGlobe } from '@event-globe/core'

const scene = new Scene()
const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight)
camera.position.z = 400

const renderer = new WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const globe = new EventGlobe({
  globeColor: '#3a228a',
  showLandPolygons: true,
  hexResolution: 4, // Higher detail
})
scene.add(globe)

function animate() {
  requestAnimationFrame(animate)
  globe.update()
  controls.update()
  renderer.render(scene, camera)
}
animate()
```

### Dynamic Arc Management

```ts
const activeArcs = new Map<number, NodeJS.Timeout>()

// Add arc with auto-removal tracking
function addTemporaryArc(startLat: number, startLng: number, endLat: number, endLng: number) {
  const arcId = globe.addArc({
    startLat,
    startLng,
    endLat,
    endLng,
    animationDuration: 2000,
    endDelay: 1000,
  })

  // Remove after total duration
  const timeout = setTimeout(() => {
    globe.removeArcById(arcId)
    activeArcs.delete(arcId)
  }, 3000)

  activeArcs.set(arcId, timeout)
}

// Listen for arc removal
globe.onArcRemoved((id, options) => {
  console.log(`Arc completed: ${options.startLat},${options.startLng} → ${options.endLat},${options.endLng}`)
})
```

## Higher-Level Packages

For easier integration, use one of the framework-specific packages:

- **[@event-globe/ts](../ts/README.md)** - Managed renderer with automatic setup
- **[@event-globe/react](../react/README.md)** - React component wrapper
- **[@event-globe/vue](../vue/README.md)** - Vue 3 component wrapper
- **[@event-globe/solid](../solid/README.md)** - Solid.js component wrapper
- **[@event-globe/svelte](../svelte/README.md)** - Svelte component wrapper

## License

MIT
