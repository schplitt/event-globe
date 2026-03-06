# @event-globe/angular

Angular component for the Event Globe 3D visualization library.

## Installation

```sh
npm install @event-globe/angular
```

## Usage

```ts
import { Component, viewChild } from '@angular/core'
import { EventGlobeComponent } from '@event-globe/angular'
import type { EventGlobeRendererConfig, ArcOptions } from '@event-globe/angular'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [EventGlobeComponent],
  template: `
    <div class="globe-container">
      <event-globe #globe [config]="config" (arcRemoved)="onArcRemoved($event)" />
      <button (click)="addRandomArc()">Add Arc</button>
    </div>
  `,
  styles: [`
    .globe-container {
      width: 100%;
      height: 600px;
    }
  `],
})
export class AppComponent {
  readonly globeRef = viewChild.required(EventGlobeComponent)

  readonly config: EventGlobeRendererConfig = {
    autoRotate: true,
    autoRotateSpeed: 0.3,
    globe: {
      globeColor: '#3a228a',
      showLandPolygons: true,
    },
  }

  addRandomArc() {
    this.globeRef().addArc({
      startLat: (Math.random() * 180) - 90,
      startLng: (Math.random() * 360) - 180,
      endLat: (Math.random() * 180) - 90,
      endLng: (Math.random() * 360) - 180,
      color: '#DD63AF',
      showEndRing: true,
    })
  }

  onArcRemoved(event: { id: number, options: ArcOptions }) {
    console.log('Arc removed:', event.id)
  }
}
```

## API

### Inputs

- `config?: EventGlobeRendererConfig` - Configuration options for the globe

### Outputs

- `(arcRemoved)` - Emitted when an arc is removed. Payload: `{ id: number, options: ArcOptions }`

### Component Methods

Access these methods via a `viewChild` ref:

```ts
globeRef = viewChild.required(EventGlobeComponent)

// Access methods
this.globeRef().addArc({ /* ... */ })
this.globeRef().getActiveArcCount()
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
