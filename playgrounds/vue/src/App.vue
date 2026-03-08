<script setup lang="ts">
/* eslint-disable no-console */
import { onMounted, onUnmounted, useTemplateRef } from 'vue'
import EventGlobe from '@event-globe/vue'

const globeRef = useTemplateRef("globeRef")
let arcInterval: number | null = null
let rippleInterval: number | null = null

onMounted(() => {
  arcInterval = setInterval(() => {
    const lat = (Math.random() * 180) - 90
    const lng = (Math.random() * 360) - 180
    const endLat = (Math.random() * 180) - 90
    const endLng = (Math.random() * 360) - 180
    const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`

    const event = globeRef.value?.addEvent('arc', {
      lat,
      lng,
      endLat,
      endLng,
      color,
      showRipple: true,
      showEndRipple: true,
    })

    event?.removed.then((result) => {
      console.log('Event removed:', {
        event: event.event,
        reason: result.reason,
        options: result.options,
      })
    })

    console.log('Added random event:', { lat, lng, endLat, endLng, color })
  }, 2000)

  rippleInterval = setInterval(() => {
    const lat = (Math.random() * 180) - 90
    const lng = (Math.random() * 360) - 180
    const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`

    const ripple = globeRef.value?.addEvent('ripple', {
      lat,
      lng,
      color,
    })

    ripple?.removed.then((result) => {
      console.log('Ripple removed:', {
        event: ripple.event,
        reason: result.reason,
        options: result.options,
      })
    })

    console.log('Added random ripple:', { lat, lng, color })
  }, 50)

  console.log('EventGlobe Renderer initialized')
})

onUnmounted(() => {
  if (arcInterval)
    clearInterval(arcInterval)
  if (rippleInterval)
    clearInterval(rippleInterval)
})
</script>

<template>
  <EventGlobe ref="globeRef" :config="{ autoRotate: false }" style="width: 100%; height: 100vh" />
</template>

<style scoped>
</style>
