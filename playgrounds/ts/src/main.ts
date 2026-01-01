/* eslint-disable no-console */
import { EventGlobeRenderer } from '@event-globe/ts'

const container = document.querySelector<HTMLDivElement>('#app')!

// Initialize the globe renderer
const renderer = new EventGlobeRenderer(container, {
  autoRotate: false,
})

// set interval to add arcs every 2 seconds
setInterval(() => {
  const startLat = (Math.random() * 180) - 90
  const startLng = (Math.random() * 360) - 180
  const endLat = (Math.random() * 180) - 90
  const endLng = (Math.random() * 360) - 180
  const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`

  renderer.addArc({
    startLat,
    startLng,
    endLat,
    endLng,
    color,
    showStartRing: true,
    showEndRing: true,
  })

  console.log('Added random arc:', { startLat, startLng, endLat, endLng, color })
  console.log('Active arcs:', renderer.getActiveArcCount())
}, 2000)

console.log('EventGlobe Renderer initialized')
console.log('Active arcs:', renderer.getActiveArcCount())
