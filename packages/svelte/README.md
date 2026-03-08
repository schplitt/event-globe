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

  function addRandomEvent() {
    globe?.addEvent('arc', {
      lat: (Math.random() * 180) - 90,
      lng: (Math.random() * 360) - 180,
      endLat: (Math.random() * 180) - 90,
      endLng: (Math.random() * 360) - 180,
      color: '#DD63AF',
      showEndRipple: true,
    })
  }

  function handleArcRemoved(event) {
    console.log('Arc removed:', event.detail.id, event.detail.options)
  }
</script>

<div class="globe-container">
  <EventGlobe bind:this={globe} {config} onarcremoved={handleArcRemoved} />
  <button on:click={addRandomEvent}>Add Event</button>
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
  globe?.addEvent('arc', {
    lat: 40.7128,
    lng: -74.0060,
    endLat: 51.5074,
    endLng: -0.1278,
  })
  globe?.getActiveArcCount()
</script>

<EventGlobe bind:this={globe} />
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
