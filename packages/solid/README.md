# @event-globe/solid

Solid.js wrapper for the Event Globe 3D visualization library.

## Installation

```sh
npm install @event-globe/solid
```

## Usage

```tsx
import { EventGlobe } from '@event-globe/solid'
import type { EventGlobeRef } from '@event-globe/solid'

export default function App() {
  let globeRef!: EventGlobeRef

  const config = {
    autoRotate: true,
    autoRotateSpeed: 0.3,
    globe: {
      globeColor: '#3a228a',
      showLandPolygons: true,
    },
  }

  function addRandomArc() {
    globeRef?.addArc({
      startLat: (Math.random() * 180) - 90,
      startLng: (Math.random() * 360) - 180,
      endLat: (Math.random() * 180) - 90,
      endLng: (Math.random() * 360) - 180,
      color: '#DD63AF',
      showEndRing: true,
    })
  }

  return (
    <div class="globe-container" style={{ width: '100%', height: '600px' }}>
      <EventGlobe ref={globeRef} config={config} />
      <button onClick={addRandomArc}>Add Arc</button>
    </div>
  )
}
```

## API

### Props

- `config?: EventGlobeRendererConfig` - Configuration options for the globe
- `style?: string | Record<string, string>` - Additional inline styles
- `class?: string` - CSS class name
- `ref?: (ref: EventGlobeRef) => void` - Callback ref for accessing methods
- `onArcRemoved?: (id: number, options: ArcOptions) => void` - Callback when an arc is removed

### Ref Methods

Access these methods via the ref callback:

```tsx
import { EventGlobe } from '@event-globe/solid'

export default function App() {
  let globeRef!: EventGlobe

  // Access methods
  const handleAddArc = () => {
    globeRef?.addArc({ /* ... */ })
  }

  const count = () => globeRef?.getActiveArcCount() ?? 0

  return <EventGlobe ref={globeRef} />
}
```

#### `addArc(options: ArcOptions): number`

Add an animated arc between two coordinates. Returns the arc ID.

#### `getActiveArcCount(): number`

Get the current number of active arcs.

#### `removeArcById(id: number): void`

Remove a specific arc by its ID.

#### `clearAllArcs(): void`

Remove all arcs from the globe.

## Full API Reference

For complete configurations and options, see the [@event-globe/core](../core/README.md) and [@event-globe/ts](../ts/README.md#configuration) packages.

## License

MIT
