import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { EventGlobeRenderer } from '@event-globe/ts'
import type { EventGlobeRendererConfig, ArcOptions, GlobeEvents, GlobeEventLifecycle, GlobeEventOptionsMap } from '@event-globe/ts'
import type { CSSProperties } from 'react'

interface EventGlobeProps {
  config?: EventGlobeRendererConfig
  style?: CSSProperties
  className?: string
  onArcRemoved?: (id: number, options: ArcOptions) => void
}

export interface EventGlobeRef {
  addEvent: <TGlobeEvent extends GlobeEvents>(event: TGlobeEvent, options: GlobeEventOptionsMap[TGlobeEvent]) => GlobeEventLifecycle<TGlobeEvent> | undefined
  addArc: (options: ArcOptions) => number
  getActiveArcCount: () => number
  removeArcById: (id: number) => void
  removeAllEvents: () => void
  clearAllArcs: () => void
}

export const EventGlobe = forwardRef<EventGlobeRef, EventGlobeProps>(
  ({ config, style, className, onArcRemoved }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const rendererRef = useRef<EventGlobeRenderer | null>(null)

    useEffect(() => {
      if (!containerRef.current)
        return
      if (rendererRef.current)
        return

      rendererRef.current = new EventGlobeRenderer(containerRef.current, config)

      if (onArcRemoved) {
        rendererRef.current.onArcRemoved(onArcRemoved)
      }

      return () => {
        rendererRef.current?.destroy()
        rendererRef.current = null
      }
    }, [])

    useEffect(() => {
      if (rendererRef.current && onArcRemoved) {
        rendererRef.current.onArcRemoved(onArcRemoved)
      }
    }, [onArcRemoved])

    useEffect(() => {
      if (rendererRef.current && config) {
        rendererRef.current.updateConfig(config)
      }
    }, [config])

    useImperativeHandle(ref, () => ({
      addEvent: (event, options) => {
        return rendererRef.current?.addEvent(event, options)
      },
      addArc: (options: ArcOptions) => {
        return rendererRef.current?.addArc(options) ?? -1
      },
      getActiveArcCount: () => {
        return rendererRef.current?.getActiveArcCount() ?? 0
      },
      removeArcById: (id: number) => {
        rendererRef.current?.removeArcById(id)
      },
      removeAllEvents: () => {
        rendererRef.current?.removeAllEvents()
      },
      clearAllArcs: () => {
        rendererRef.current?.clearAllArcs()
      },
    }))

    return (
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', ...style }}
        className={className}
      />
    )
  },
)

EventGlobe.displayName = 'EventGlobe'
