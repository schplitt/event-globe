import { onMount, onCleanup, createEffect } from 'solid-js'
import { EventGlobeRenderer } from '@event-globe/ts'
import type { EventGlobeRendererConfig, ArcOptions, EventHandle, GlobeEventOptions } from '@event-globe/ts'

interface EventGlobeProps {
  config?: EventGlobeRendererConfig
  style?: string | Record<string, string>
  class?: string
  ref?: (ref: EventGlobeRef) => void
  onArcRemoved?: (id: number, options: ArcOptions) => void
}

export interface EventGlobeRef {
  addEvent: (options: GlobeEventOptions) => EventHandle<'arc'> | undefined
  addArc: (options: ArcOptions) => number
  getActiveArcCount: () => number
  removeArcById: (id: number) => void
  removeAllEvents: () => void
  clearAllArcs: () => void
}

export function EventGlobe(props: EventGlobeProps) {
  let containerRef!: HTMLDivElement
  let renderer: EventGlobeRenderer | null = null

  onMount(() => {
    if (containerRef) {
      renderer = new EventGlobeRenderer(containerRef, props.config)

      if (props.onArcRemoved) {
        renderer.onArcRemoved(props.onArcRemoved)
      }

      // Expose methods via ref if provided
      if (props.ref) {
        props.ref({
          addEvent: (options: GlobeEventOptions) => renderer?.addEvent(options),
          addArc: (options: ArcOptions) => renderer?.addArc(options) ?? -1,
          getActiveArcCount: () => renderer?.getActiveArcCount() ?? 0,
          removeArcById: (id: number) => renderer?.removeArcById(id),
          removeAllEvents: () => renderer?.removeAllEvents(),
          clearAllArcs: () => renderer?.clearAllArcs(),
        })
      }
    }
  })

  onCleanup(() => {
    if (renderer) {
      renderer.destroy()
      renderer = null
    }
  })

  createEffect(() => {
    if (renderer && props.config) {
      renderer.updateConfig(props.config)
    }
  })

  createEffect(() => {
    if (renderer && props.onArcRemoved) {
      renderer.onArcRemoved(props.onArcRemoved)
    }
  })

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', ...(typeof props.style === 'object' ? props.style : {}) }}
      class={props.class}
    />
  )
}
