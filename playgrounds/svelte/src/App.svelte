<script lang="ts">
  /* eslint-disable no-console */
  import { onMount } from 'svelte'
  import EventGlobe from '@event-globe/svelte'
  import type { GlobeEventResult } from '@event-globe/svelte'

  let globeRef: any

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

      void event?.removed.then((result: GlobeEventResult<'arc'>) => {
        console.log('Event removed:', {
          event: event.event,
          reason: result.reason,
          options: result.options,
        })
      })

      console.log('Added random event:', { lat, lng, endLat, endLng, color })
    }, 2000)

    console.log('EventGlobe Renderer initialized')

    return () => clearInterval(interval)
  })
</script>

<EventGlobe bind:this={globeRef} config={{ autoRotate: false }} />
