/* eslint-disable no-console */
import { useRef, useEffect } from 'react'
import { EventGlobe } from '@event-globe/react'
import type { EventGlobeRef } from '@event-globe/react'

function App() {
  const globeRef = useRef<EventGlobeRef>(null)

  useEffect(() => {
    // set interval to add arcs every 2 seconds
    const interval = setInterval(() => {
      const startLat = (Math.random() * 180) - 90
      const startLng = (Math.random() * 360) - 180
      const endLat = (Math.random() * 180) - 90
      const endLng = (Math.random() * 360) - 180
      const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`

      globeRef.current?.addArc({
        startLat,
        startLng,
        endLat,
        endLng,
        color,
        showStartRing: true,
        showEndRing: true,
      })

      console.log('Added random arc:', { startLat, startLng, endLat, endLng, color })
      console.log('Active arcs:', globeRef.current?.getActiveArcCount())
    }, 2000)

    console.log('EventGlobe Renderer initialized')
    console.log('Active arcs:', globeRef.current?.getActiveArcCount())

    return () => clearInterval(interval)
  }, [])

  return (
    <EventGlobe
      ref={globeRef}
      config={{ autoRotate: false }}
      style={{ width: '100%', height: '100vh' }}
    />
  )
}

export default App
