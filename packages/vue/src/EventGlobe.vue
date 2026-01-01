<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { EventGlobeRenderer } from '@event-globe/ts'
import type { EventGlobeRendererConfig, ArcOptions } from '@event-globe/ts'

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

function addArc(options: ArcOptions): void {
  renderer?.addArc(options)
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
  addArc,
  getActiveArcCount,
  removeArcById: (id: number) => renderer?.removeArcById(id),
  clearAllArcs: () => renderer?.clearAllArcs(),
})
</script>

<template>
  <div ref="containerRef" style="width: 100%; height: 100%"></div>
</template>
