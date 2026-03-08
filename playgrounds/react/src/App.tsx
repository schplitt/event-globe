/* eslint-disable no-console */
import { useRef, useEffect } from 'react'
import { EventGlobe } from '@event-globe/react'
import type { EventGlobeRef } from '@event-globe/react'

function App() {
  const globeRef = useRef<EventGlobeRef>(null)

  useEffect(() => {
    const arcInterval = setInterval(() => {
      const lat = (Math.random() * 180) - 90
      const lng = (Math.random() * 360) - 180
      const endLat = (Math.random() * 180) - 90
      const endLng = (Math.random() * 360) - 180
      const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`

      const event = globeRef.current?.addEvent('arc', {
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

    const rippleInterval = setInterval(() => {
      const lat = (Math.random() * 180) - 90
      const lng = (Math.random() * 360) - 180
      const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`

      const ripple = globeRef.current?.addEvent('ripple', {
        lat,
        lng,
        color,
      })

      ripple?.removed.then((result) => {
        console.log('Ripple removed:', { event: ripple.event, ...result })
      })

      console.log('Added random ripple:', { lat, lng, color })
    }, 50)

    console.log('EventGlobe Renderer initialized')

    return () => {
      clearInterval(arcInterval)
      clearInterval(rippleInterval)
    }
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
