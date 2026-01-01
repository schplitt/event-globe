<script lang="ts">
  /* eslint-disable no-console */
  import { onMount } from 'svelte'
  import EventGlobe from '@event-globe/svelte'

  let globeRef: any

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

    return () => clearInterval(interval)
  })
</script>

<EventGlobe bind:this={globeRef} config={{ autoRotate: false }} />
