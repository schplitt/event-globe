# @event-globe/svelte

Svelte wrapper for the Event Globe 3D visualization library.

## Installation

```sh
npm install @event-globe/svelte
```

## Usage

```svelte
<script>
  import { EventGlobe } from '@event-globe/svelte'

  let globe

  const config = {
    autoRotate: true,
    autoRotateSpeed: 0.3,
    globe: {
      globeColor: '#3a228a',
      showLandPolygons: true,
    }
  }

  function addRandomArc() {
    globe?.addArc({
      startLat: (Math.random() * 180) - 90,
      startLng: (Math.random() * 360) - 180,
      endLat: (Math.random() * 180) - 90,
      endLng: (Math.random() * 360) - 180,
      color: '#DD63AF',
      showEndRing: true,
    })
  }

  function handleArcRemoved(event) {
    console.log('Arc removed:', event.detail.id, event.detail.options)
  }
</script>

<div class="globe-container">
  <EventGlobe bind:this={globe} {config} onarcremoved={handleArcRemoved} />
  <button on:click={addRandomArc}>Add Arc</button>
</div>

<style>
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

- `onarcremoved` - Fired when an arc is removed. Event detail: `{ id: number, options: ArcOptions }`

### Component Methods

Bind to the component to access these methods:

```svelte
<script>
  let globe

  // Access methods
  globe?.addArc({ ... })
  globe?.getActiveArcCount()
</script>

<EventGlobe bind:this={globe} />
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
