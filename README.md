# Event Globe

A lightweight, framework-agnostic 3D globe visualization library powered by Three.js. Display animated arcs between coordinates, land masses with H3 hexagon tessellation, and atmospheric glow effects.

## Features

- 🌍 Interactive 3D globe with orbit controls
- ✈️ Animated arcs between geographic coordinates
- 🗺️ GeoJSON-based land visualization with H3 hexagons
- 💫 Ripple effects and atmospheric glow
- 🎨 Fully customizable colors and animations
- 📦 Framework wrappers: TypeScript, React, Vue, Svelte, Solid

## Quick Start

```sh
npm install @event-globe/ts
```

```ts
import { EventGlobeRenderer } from '@event-globe/ts'

const container = document.getElementById('globe')
const renderer = new EventGlobeRenderer(container, {
  autoRotate: true,
  globe: {
    globeColor: '#3a228a',
    showLandPolygons: true,
  }
})

renderer.addArc({
  startLat: 40.7128,
  startLng: -74.0060,
  endLat: 51.5074,
  endLng: -0.1278,
  showEndRing: true,
})
```

## Packages

| Package                                  | Description                           | Status |
| ---------------------------------------- | ------------------------------------- | ------ |
| [@event-globe/core](./packages/core)     | Framework-agnostic Three.js component | ✅     |
| [@event-globe/ts](./packages/ts)         | Managed renderer with controls        | ✅     |
| [@event-globe/react](./packages/react)   | React wrapper                         | ✅     |
| [@event-globe/vue](./packages/vue)       | Vue 3 wrapper                         | ✅     |
| [@event-globe/svelte](./packages/svelte) | Svelte wrapper                        | ✅     |
| [@event-globe/solid](./packages/solid)   | Solid.js wrapper                      | ✅     |

## Documentation

See individual package READMEs for detailed documentation:

- [Core API](./packages/core/README.md)
- [TypeScript](./packages/ts/README.md)
- [React](./packages/react/README.md)
- [Vue](./packages/vue/README.md)
- [Svelte](./packages/svelte/README.md)
- [Solid](./packages/solid/README.md)

## Acknowledgements

This project was inspired by and builds upon the following excellent works:

- [three-globe](https://github.com/vasturiano/three-globe)
- [globe.gl](https://github.com/vasturiano/globe.gl)
- [Github Globe](https://github.com/globe)
- [github-globe](https://github.com/janarosmonaliev/github-globe)

## License

MIT