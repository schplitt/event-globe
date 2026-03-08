/* eslint-disable no-console */
import { onMount, onCleanup } from 'solid-js'
import { EventGlobe } from '@event-globe/solid'
import type { EventGlobeRef } from '@event-globe/solid'

function App() {
  let globeRef: EventGlobeRef | undefined

  onMount(() => {
    // set interval to add events every 2 seconds
    const interval = setInterval(() => {
      const lat = (Math.random() * 180) - 90
      const lng = (Math.random() * 360) - 180
      const endLat = (Math.random() * 180) - 90
      const endLng = (Math.random() * 360) - 180
      const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`

      const event = globeRef?.addEvent({
        event: 'arc',
        lat,
        lng,
        endLat,
        endLng,
        color,
        showRipple: true,
        showEndRipple: true,
      })

      event?.removed.then((result) => {
        console.log('Event removed:', { event: event.event, ...result })
      })

      console.log('Added random event:', { lat, lng, endLat, endLng, color })
    }, 2000)

    console.log('EventGlobe Renderer initialized')

    onCleanup(() => clearInterval(interval))
  })

  return (
    <EventGlobe
      ref={(el) => {
        globeRef = el
      }}
      config={{ autoRotate: false }}
      style={{ width: '100%', height: '100vh' }}
    />
  )
}

export default App
