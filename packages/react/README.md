# @event-globe/react

React wrapper for the Event Globe 3D visualization library.

## Installation

```sh
npm install @event-globe/react
```

## Usage

```tsx
import { useRef } from 'react'
import { EventGlobe } from '@event-globe/react'
import type { EventGlobeRef } from '@event-globe/react'

export default function App() {
  const globeRef = useRef<EventGlobeRef>(null)

  const config = {
    autoRotate: true,
    autoRotateSpeed: 0.3,
    globe: {
      globeColor: '#3a228a',
      showLandPolygons: true,
    },
  }

  function addRandomEvent() {
    globeRef.current?.addEvent('arc', {
      lat: (Math.random() * 180) - 90,
      lng: (Math.random() * 360) - 180,
      endLat: (Math.random() * 180) - 90,
      endLng: (Math.random() * 360) - 180,
      color: '#DD63AF',
      showEndRipple: true,
    })
  }

  return (
    <div className="globe-container" style={{ width: '100%', height: '600px' }}>
      <EventGlobe ref={globeRef} config={config} />
      <button onClick={addRandomEvent}>Add Event</button>
    </div>
  )
}
```

## API

### Props

- `config?: EventGlobeRendererConfig` - Configuration options for the globe
- `style?: React.CSSProperties` - Additional inline styles
- `className?: string` - CSS class name
- `onArcRemoved?: (id: number, options: ArcOptions) => void` - Callback when an arc is removed

### Ref Methods

Access these methods via a ref:

```tsx
import { useRef } from 'react'
import { EventGlobe } from '@event-globe/react'
import type { EventGlobeRef } from '@event-globe/react'

function MyComponent() {
  const globeRef = useRef<EventGlobeRef>(null)

  // Access methods
  const handleAddEvent = () => {
    globeRef.current?.addEvent('arc', {
      lat: 40.7128,
      lng: -74.0060,
      endLat: 51.5074,
      endLng: -0.1278,
    })
  }

  const count = globeRef.current?.getActiveArcCount() ?? 0

  return <EventGlobe ref={globeRef} />
}
```

#### `addEvent<TGlobeEvent extends GlobeEvents>(event: TGlobeEvent, options: GlobeEventOptionsMap[TGlobeEvent]): GlobeEventLifecycle<TGlobeEvent> | undefined`

Add an event and receive a lifecycle for awaiting removal or removing it early.

#### `removeAllEvents(): void`

Remove all active events from the globe.

#### `addArc(options: ArcOptions): number`

Deprecated alias for `addEvent()`.

#### `getActiveArcCount(): number`

Deprecated method that returns the current number of active arcs. It will be removed in a future release.

#### `removeArcById(id: number): void`

Remove a specific arc by its ID.

#### `clearAllArcs(): void`

Deprecated alias for `removeAllEvents()`.

## Full API Reference

For complete configurations and options, see the [@event-globe/core](../core/README.md) and [@event-globe/ts](../ts/README.md#configuration) packages.

## License

MIT
