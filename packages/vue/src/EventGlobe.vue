<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { EventGlobeRenderer } from '@event-globe/ts'
import type { EventGlobeRendererConfig, ArcOptions, EventHandle, GlobeEventOptions } from '@event-globe/ts'

interface Props {
  config?: EventGlobeRendererConfig
}

const { config } = defineProps<Props>()
  
const emit = defineEmits<{
  arcRemoved: [id: number, options: ArcOptions];
}>()

const containerRef = ref<HTMLDivElement>()
let renderer: EventGlobeRenderer | null = null

onMounted(() => {
  if (containerRef.value) {
    renderer = new EventGlobeRenderer(containerRef.value, config)
    renderer.onArcRemoved((id, options) => {
      emit('arcRemoved', id, options)
    })
  }
})

onUnmounted(() => {
  if (renderer) {
    renderer.destroy()
    renderer = null
  }
})

function addArc(options: ArcOptions): number | undefined {
  return renderer?.addArc(options)
}

function addEvent(options: GlobeEventOptions): EventHandle<'arc'> | undefined {
  return renderer?.addEvent(options)
}

function getActiveArcCount(): number {
  return renderer?.getActiveArcCount() ?? 0
}

watch(
  () => config,
  (newConfig) => {
    if (newConfig)
        renderer?.updateConfig(newConfig)
  }
)

defineExpose({
  addEvent,
  addArc,
  getActiveArcCount,
  removeArcById: (id: number) => renderer?.removeArcById(id),
  removeAllEvents: () => renderer?.removeAllEvents(),
  clearAllArcs: () => renderer?.clearAllArcs(),
})
</script>

<template>
  <div ref="containerRef" style="width: 100%; height: 100%"></div>
</template>
