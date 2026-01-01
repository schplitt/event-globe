<script setup lang="ts">
/* eslint-disable no-console */
import { ref, onMounted, onUnmounted } from 'vue'
import EventGlobe from '@event-globe/vue'

const globeRef = ref<any>(null)
let interval: number | null = null

onMounted(() => {
  // set interval to add arcs every 2 seconds
  interval = setInterval(() => {
    const startLat = (Math.random() * 180) - 90
    const startLng = (Math.random() * 360) - 180
    const endLat = (Math.random() * 180) - 90
    const endLng = (Math.random() * 360) - 180
    const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`

    globeRef.value?.addArc({
      startLat,
      startLng,
      endLat,
      endLng,
      color,
      showStartRing: true,
      showEndRing: true,
    })

    console.log('Added random arc:', { startLat, startLng, endLat, endLng, color })
    console.log('Active arcs:', globeRef.value?.getActiveArcCount())
  }, 2000)

  console.log('EventGlobe Renderer initialized')
  console.log('Active arcs:', globeRef.value?.getActiveArcCount())
})

onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
  }
})
</script>

<template>
  <EventGlobe ref="globeRef" :config="{ autoRotate: false }" style="width: 100%; height: 100vh" />
</template>

<style scoped>
</style>
