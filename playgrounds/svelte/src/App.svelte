<script lang="ts">
  /* eslint-disable no-console */
  import { onMount } from 'svelte'
  import EventGlobe from '@event-globe/svelte'
  import type { GlobeEventResult } from '@event-globe/svelte'

  let globeRef: any

  onMount(() => {
    const arcInterval = setInterval(() => {
      const lat = (Math.random() * 180) - 90
      const lng = (Math.random() * 360) - 180
      const endLat = (Math.random() * 180) - 90
      const endLng = (Math.random() * 360) - 180
      const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`

      const event = globeRef?.addEvent('arc', {
        lat,
        lng,
        endLat,
        endLng,
        color,
        showRipple: true,
        showEndRipple: true,
      })

      void event?.removed.then((result: GlobeEventResult<'arc'>) => {
        console.log('Event removed:', {
          event: event.event,
          reason: result.reason,
          options: result.options,
        })
      })

      console.log('Added random event:', { lat, lng, endLat, endLng, color })
    }, 2000)

    const rippleInterval = setInterval(() => {
      const lat = (Math.random() * 180) - 90
      const lng = (Math.random() * 360) - 180
      const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`

      const ripple = globeRef?.addEvent('ripple', {
        lat,
        lng,
        color,
      })

      void ripple?.removed.then((result: GlobeEventResult<'ripple'>) => {
        console.log('Ripple removed:', {
          event: ripple.event,
          reason: result.reason,
          options: result.options,
        })
      })

      console.log('Added random ripple:', { lat, lng, color })
    }, 50)

    console.log('EventGlobe Renderer initialized')

    return () => {
      clearInterval(arcInterval)
      clearInterval(rippleInterval)
    }
  })
</script>

<EventGlobe bind:this={globeRef} config={{ autoRotate: false }} />
