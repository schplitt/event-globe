/* eslint-disable no-console */
import { EventGlobeRenderer } from '@event-globe/ts'

const container = document.querySelector<HTMLDivElement>('#app')!

// Initialize the globe renderer
const renderer = new EventGlobeRenderer(container, {
  autoRotate: false,
})

// set interval to add events every 2 seconds
setInterval(() => {
  const lat = (Math.random() * 180) - 90
  const lng = (Math.random() * 360) - 180
  const endLat = (Math.random() * 180) - 90
  const endLng = (Math.random() * 360) - 180
  const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`

  const event = renderer.addEvent({
    event: 'arc',
    lat,
    lng,
    endLat,
    endLng,
    color,
    showRipple: true,
    showEndRipple: true,
  })

  event.removed.then((result) => {
    console.log('Event removed:', { event: event.event, ...result })
  })

  console.log('Added random event:', { lat, lng, endLat, endLng, color })
}, 2000)

console.log('EventGlobe Renderer initialized')
