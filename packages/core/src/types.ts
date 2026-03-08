export type GlobeEventType = 'arc' | 'ripple'

export interface GlobeEventOptionsMap extends Record<GlobeEventType, object> {
  arc: ArcEventOptions
  ripple: RippleEventOptions
}

export interface ArcEventOptions {
  lat: number
  lng: number
  endLat: number
  endLng: number
  color?: string
  animationDuration?: number
  arcVelocity?: number
  startDelay?: number
  endDelay?: number
  strokeWidth?: number
  showPoint?: boolean | string
  showEndPoint?: boolean | string
  pointRadius?: number
  showRipple?: boolean | string
  showEndRipple?: boolean | string
  flyingSegment?: boolean
  segmentLength?: number
}

export interface RippleEventOptions {
  lat: number
  lng: number
  color?: string
  startDelay?: number
}

export type GlobeEvents = keyof GlobeEventOptionsMap
export type GlobeEventOptions = GlobeEventOptionsMap[GlobeEvents]

export interface GlobeEventResult<TGlobeEvent extends GlobeEvents> {
  reason: 'completed' | 'removed'
  options: GlobeEventOptionsMap[TGlobeEvent]
}

export interface GlobeEventLifecycle<TGlobeEvent extends GlobeEvents> {
  event: TGlobeEvent
  removed: Promise<GlobeEventResult<TGlobeEvent>>
  remove: () => void
}

/**
 * @deprecated Use ArcEventOptions instead.
 */
export interface ArcOptions {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color?: string
  animationDuration?: number
  arcVelocity?: number
  startDelay?: number
  endDelay?: number
  strokeWidth?: number
  showStartPoint?: boolean | string
  showEndPoint?: boolean | string
  pointRadius?: number
  showStartRing?: boolean | string
  showEndRing?: boolean | string
  flyingSegment?: boolean
  segmentLength?: number
}
