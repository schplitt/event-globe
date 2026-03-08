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
- **Animated events** - Arc events between coordinates with customizable animations
- **Point markers** - Optional start/end point indicators
- **Ripples** - Animated expanding ripple effects at arc endpoints

## Usage

```ts
import { Scene, PerspectiveCamera, WebGLRenderer } from 'three'
import { EventGlobe } from '@event-globe/core'
import type { GlobeConfig } from '@event-globe/core'

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

// Add an event
const event = globe.addEvent('arc', {
  lat: 40.7128,
  lng: -74.0060,
  endLat: 51.5074,
  endLng: -0.1278,
  color: '#DD63AF',
  showEndRipple: true,
})

event.removed.then((result) => {
  console.log('Event removed:', event.event, result.reason)
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

- `globeRadius`: `number`, default `100`. Radius of the globe in Three.js units.
- `globeColor`: `string`, default `"#3a228a"`. Main color of the globe surface.
- `emissive`: `string`, default `"#220038"`. Emissive color for the globe material.
- `emissiveIntensity`: `number`, default `0.1`. Intensity of the emissive color.
- `shininess`: `number`, default `0.7`. Shininess of the globe surface material.
- `showLandPolygons`: `boolean`, default `true`. Whether land masses render as hexagon patterns.
- `landPolygonColor`: `string`, default `"rgba(255,255,255,0.7)"`. Color for land polygon hexagons.
- `landPolygonOpacity`: `number`, default `0.7`. Opacity for land polygons.
- `hexResolution`: `number`, default `3`. H3 hexagon resolution for land rendering.
- `hexMargin`: `number`, default `0.7`. Margin between hexagons.
- `hexUseDots`: `boolean`, default `false`. Use circular dots instead of hexagons for land.
- `hexAltitude`: `number`, default `0.0005`. Altitude of hexagons above the globe surface.
- `showAtmosphere`: `boolean`, default `true`. Whether to show the atmospheric glow effect.
- `atmosphereColor`: `string`, default `"#3a228a"`. Color of the atmosphere glow.
- `atmosphereAltitude`: `number`, default `0.25`. Size of the atmosphere relative to globe radius.
- `defaultArcColor`: `string`, default `"#DD63AF"`. Default color for arcs.
- `defaultRippleColor`: `string`, default same as `defaultArcColor`. Default color for ripples.
- `rippleMaxScale`: `number`, default `3.5`. Maximum scale for ripple expansion.
- `rippleExpansionSpeed`: `number`, default `0.08`. Speed of ripple expansion.

### GlobeEventOptions

Configuration options for core events. `addEvent()` takes the event type as its first argument and an event-specific options object as its second argument.

### ArcEventOptions

| Option              | Type                | Default        | Description                                                                   |
| ------------------- | ------------------- | -------------- | ----------------------------------------------------------------------------- |
| `lat`               | `number`            | **required**   | Origin latitude in degrees (-90 to 90)                                        |
| `lng`               | `number`            | **required**   | Origin longitude in degrees (-180 to 180)                                     |
| `endLat`            | `number`            | **required**   | Destination latitude in degrees (-90 to 90)                                   |
| `endLng`            | `number`            | **required**   | Destination longitude in degrees (-180 to 180)                                |
| `color`             | `string`            | `"#DD63AF"`    | Color of the arc as a hex string                                              |
| `animationDuration` | `number`            | `2000`         | Duration of flight animation in milliseconds (ignored if arcVelocity is set)  |
| `arcVelocity`       | `number`            | `0` (disabled) | Velocity in units per second - if set, duration is calculated from arc length |
| `startDelay`        | `number`            | `0`            | Delay before animation starts in milliseconds                                 |
| `endDelay`          | `number`            | `500`          | Delay before removing arc after animation completes (ms)                      |
| `strokeWidth`       | `number`            | `0.4`          | Width of the arc stroke                                                       |
| `showPoint`         | `boolean \| string` | `false`        | Show marker dot at the event origin (true/false or color hex string)          |
| `showEndPoint`      | `boolean \| string` | `false`        | Show marker dot at end point (true/false or color hex string)                 |
| `pointRadius`       | `number`            | `1.5`          | Radius of point markers in Three.js units                                     |
| `showRipple`        | `boolean \| string` | `false`        | Show a ripple at the event origin (true/false or color hex string)            |
| `showEndRipple`     | `boolean \| string` | `true`         | Show a ripple at the end point (true/false or color hex string)               |
| `flyingSegment`     | `boolean`           | `true`         | Show moving segment along the arc path                                        |
| `segmentLength`     | `number`            | `0.15`         | Length of flying segment as fraction of total arc (0.0-1.0)                   |

### RippleEventOptions

| Option       | Type     | Default      | Description                                    |
| ------------ | -------- | ------------ | ---------------------------------------------- |
| `lat`        | `number` | **required** | Ripple latitude in degrees (-90 to 90)         |
| `lng`        | `number` | **required** | Ripple longitude in degrees (-180 to 180)      |
| `color`      | `string` | `"#DD63AF"`  | Ripple color as a hex string                   |
| `startDelay` | `number` | `0`          | Delay before the ripple starts in milliseconds |

### GlobeEventLifecycle

The new primary API returns a lifecycle object instead of an ID.

- `event`: `'arc' | 'ripple'`. The event type for this lifecycle.
- `removed`: `Promise<GlobeEventResult<TGlobeEvent>>`. Resolves when the event has been removed.
- `remove()`: `() => void`. Removes the event early.

### EventResult

`removed` resolves to a `GlobeEventResult<TGlobeEvent>`.

| Property  | Type                       | Description                          |
| --------- | -------------------------- | ------------------------------------ |
| `reason`  | `'completed' \| 'removed'` | Why the event was removed            |
| `options` | Event-specific options     | The event options associated with it |

## API

### Methods

#### `addEvent<TGlobeEvent extends GlobeEvents>(event: TGlobeEvent, options: GlobeEventOptionsMap[TGlobeEvent]): GlobeEventLifecycle<TGlobeEvent>`

Add an event and receive a lifecycle for awaiting removal or removing it early.

```ts
const event = globe.addEvent('arc', {
  lat: 40.7128,
  lng: -74.0060,
  endLat: 51.5074,
  endLng: -0.1278,
  color: '#DD63AF',
  animationDuration: 2000,
  showEndRipple: true,
})

async function waitForEvent() {
  await event.removed
}
```

Standalone ripple:

```ts
const ripple = globe.addEvent('ripple', {
  lat: 40.7128,
  lng: -74.0060,
  color: '#DD63AF',
})
```

#### `removeAllEvents(): void`

Remove all active events from the globe.

```ts
globe.removeAllEvents()
```

#### Deprecated Arc API

The old arc API is still available as a compatibility layer and still returns numeric IDs.

#### `addArc(options: ArcOptions): number`

Deprecated alias for `addEvent()`.

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

Deprecated ID-based removal for compatibility.

```ts
globe.removeArcById(arcId)
```

#### `clearAllArcs(): void`

Deprecated alias for `removeAllEvents()`.

```ts
globe.clearAllArcs()
```

#### `getActiveArcCount(): number`

Deprecated method that returns the current number of active arcs. It will be removed in a future release.

```ts
const count = globe.getActiveArcCount()
```

#### `onArcRemoved(callback: (id: number, options: ArcOptions) => void): void`

Set a callback to be invoked when a deprecated arc is removed.

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

### Dynamic Event Management

```ts
// Add event and await removal
async function addTemporaryEvent(lat: number, lng: number, endLat: number, endLng: number) {
  const event = globe.addEvent('arc', {
    lat,
    lng,
    endLat,
    endLng,
    animationDuration: 2000,
    endDelay: 1000,
  })

  const timeout = setTimeout(() => {
    event.remove()
  }, 3000)

  const result = await event.removed
  clearTimeout(timeout)
  console.log(`Event ${event.event} ${result.reason}: ${result.options.lat},${result.options.lng} -> ${result.options.endLat},${result.options.endLng}`)
}
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
