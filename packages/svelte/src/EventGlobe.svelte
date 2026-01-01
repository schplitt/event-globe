<svelte:options customElement="event-globe" runes={true} />

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { EventGlobeRenderer } from '@event-globe/ts'
  import type { EventGlobeRendererConfig, ArcOptions } from '@event-globe/ts'

  interface Props {
    config: EventGlobeRendererConfig | undefined
  }

  let { config }: Props = $props()
  
  let containerRef: HTMLDivElement
  let renderer: EventGlobeRenderer | null = null
  
  onMount(() => {
    if (containerRef) {
      renderer = new EventGlobeRenderer(containerRef, config)
      renderer.onArcRemoved((id: number, options: ArcOptions) => {
        
        $host().dispatchEvent(new CustomEvent('arcremoved', { detail: { id, options } }))
      })
    }
  })

  onDestroy(() => {
    if (renderer) {
      renderer.destroy()
      renderer = null
    }
  })

  $effect(() => {
    if (renderer && config) {
      renderer.updateConfig(config)
    }
  })

  export function addArc(options: ArcOptions): number {
    return renderer?.addArc(options) ?? -1
  }

  export function getActiveArcCount(): number {
    return renderer?.getActiveArcCount() ?? 0
  }

  export function removeArcById(id: number): void {
    renderer?.removeArcById(id)
  }

  export function clearAllArcs(): void {
    renderer?.clearAllArcs()
  }
</script>

<div bind:this={containerRef} style="width: 100%; height: 100%"></div>
