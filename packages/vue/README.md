# @event-globe/vue

Vue 3 wrapper for the Event Globe 3D visualization library.

## Installation

```sh
npm install @event-globe/vue
```

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { EventGlobe } from '@event-globe/vue'

const globeRef = ref()

const config = {
  autoRotate: true,
  autoRotateSpeed: 0.3,
  globe: {
    globeColor: '#3a228a',
    showLandPolygons: true,
  }
}

function addRandomEvent() {
  globeRef.value?.addEvent({
    event: 'arc',
    lat: (Math.random() * 180) - 90,
    lng: (Math.random() * 360) - 180,
    endLat: (Math.random() * 180) - 90,
    endLng: (Math.random() * 360) - 180,
    color: '#DD63AF',
    showEndRipple: true,
  })
}
</script>

<template>
  <div class="globe-container">
    <EventGlobe ref="globeRef" :config="config" />
    <button @click="addRandomEvent">Add Event</button>
  </div>
</template>

<style scoped>
.globe-container {
  width: 100%;
  height: 600px;
}
</style>
```

## API

### Props

- `config?: EventGlobeRendererConfig` - Configuration options for the globe

### Events

- `@arcRemoved` - Emitted when an arc is removed. Payload: `{ id: number, options: ArcOptions }`

### Ref Methods

Access these methods via a ref:

```vue
<script setup>
const globeRef = useTemplateRef()

// Access methods
globeRef.value?.addEvent({
  event: 'arc',
  lat: 40.7128,
  lng: -74.0060,
  endLat: 51.5074,
  endLng: -0.1278,
})
globeRef.value?.getActiveArcCount()
</script>
```

#### `addEvent(options: GlobeEventOptions): GlobeEventLifecycle<'arc'> | undefined`

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
