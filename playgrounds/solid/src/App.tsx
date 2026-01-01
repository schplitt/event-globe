/* eslint-disable no-console */
import { onMount, onCleanup } from 'solid-js'
import { EventGlobe } from '@event-globe/solid'
import type { EventGlobeRef } from '@event-globe/solid'

function App() {
  let globeRef: EventGlobeRef | undefined

  onMount(() => {
    // set interval to add arcs every 2 seconds
    const interval = setInterval(() => {
      const startLat = (Math.random() * 180) - 90
      const startLng = (Math.random() * 360) - 180
      const endLat = (Math.random() * 180) - 90
      const endLng = (Math.random() * 360) - 180
      const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`

      globeRef?.addArc({
        startLat,
        startLng,
        endLat,
        endLng,
        color,
        showStartRing: true,
        showEndRing: true,
      })

      console.log('Added random arc:', { startLat, startLng, endLat, endLng, color })
      console.log('Active arcs:', globeRef?.getActiveArcCount())
    }, 2000)

    console.log('EventGlobe Renderer initialized')
    console.log('Active arcs:', globeRef?.getActiveArcCount())

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
