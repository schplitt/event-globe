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

function addRandomArc() {
  globeRef.value?.addArc({
    startLat: (Math.random() * 180) - 90,
    startLng: (Math.random() * 360) - 180,
    endLat: (Math.random() * 180) - 90,
    endLng: (Math.random() * 360) - 180,
    color: '#DD63AF',
    showEndRing: true,
  })
}
</script>

<template>
  <div class="globe-container">
    <EventGlobe ref="globeRef" :config="config" />
    <button @click="addRandomArc">Add Arc</button>
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
globeRef.value?.addArc({ ... })
globeRef.value?.getActiveArcCount()
</script>
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
