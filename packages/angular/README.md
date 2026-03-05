# @event-globe/ts

Managed renderer for Three.js globe visualization with automatic resizing and controls.

## Installation

```sh
npm install @event-globe/ts
```

## Usage

```ts
import { EventGlobeRenderer } from '@event-globe/ts'
import type { EventGlobeRendererConfig, ArcOptions } from '@event-globe/ts'

const container = document.getElementById('globe')
const config: EventGlobeRendererConfig = {
  autoRotate: true,
  autoRotateSpeed: 0.3,
  globe: {
    globeColor: '#3a228a',
    showLandPolygons: true,
  }
}

const renderer = new EventGlobeRenderer(container, config)

function addRandomArc() {
  renderer.addArc({
    startLat: (Math.random() * 180) - 90,
    startLng: (Math.random() * 360) - 180,
    endLat: (Math.random() * 180) - 90,
    endLng: (Math.random() * 360) - 180,
    color: '#DD63AF',
    showEndRing: true,
  })
}

// Cleanup when done
renderer.destroy()
```

## API

### Configuration

The `EventGlobeRenderer` accepts a configuration object with the following options:

| Option                 | Type          | Default                                                  | Description                                         |
| ---------------------- | ------------- | -------------------------------------------------------- | --------------------------------------------------- |
| `autoRotate`           | `boolean`     | `true`                                                   | Enable automatic rotation of the globe              |
| `autoRotateSpeed`      | `number`      | `0.3`                                                    | Speed of auto-rotation                              |
| `manualRotate`         | `boolean`     | `true`                                                   | Allow manual rotation with mouse/touch              |
| `sceneBackgroundColor` | `number`      | `0xffffff`                                               | Background color of the Three.js scene (hex number) |
| `sceneFogColor`        | `number`      | `0x535ef3`                                               | Fog color for depth effect (hex number)             |
| `sceneFogNear`         | `number`      | `400`                                                    | Distance where fog starts                           |
| `sceneFogFar`          | `number`      | `2000`                                                   | Distance where fog is fully opaque                  |
| `globe`                | `GlobeConfig` | see [@event-globe/core](../core/README.md#configuration) | Globe configuration options                         |

For complete API documentation and configuration options, see the [@event-globe/core](../core/README.md) package.

### Methods

#### `addArc(options: ArcOptions): number`

Add an animated arc between two coordinates. Returns the arc ID.

#### `getActiveArcCount(): number`

Get the current number of active arcs.

#### `removeArcById(id: number): void`

Remove a specific arc by its ID.

#### `clearAllArcs(): void`

Remove all arcs from the globe.

#### `onArcRemoved(callback: (id: number, options: ArcOptions) => void): void`

Set a callback to be invoked when an arc is removed (either manually or automatically after animation completes).

#### `updateConfig(config: EventGlobeRendererConfig): void`

Update the renderer configuration.

#### `destroy(): void`

Clean up the renderer and dispose of Three.js resources.

## License

MIT
