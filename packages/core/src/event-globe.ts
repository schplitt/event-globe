import type {
  BufferGeometry,
} from 'three'
import {
  AmbientLight,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PointLight,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import ConicPolygonGeometry from 'three-conic-polygon-geometry'
import { cellToBoundary, cellToLatLng, polygonToCells } from 'h3-js'
import { GlowMesh } from './GlowMesh'
import type {
  ArcEventOptions,
  ArcOptions,
  EventHandle,
  GlobeEventFinishReason,
  GlobeEventOptions,
  GlobeEventResult,
} from './types'

/**
 * Configuration options for the globe visualization
 */
export interface GlobeConfig {
  /**
   * Radius of the globe in Three.js units
   * @default 100
   */
  globeRadius?: number

  /**
   * Main color of the globe surface (hex string)
   * @default "#3a228a"
   */
  globeColor?: string

  /**
   * Emissive (self-illumination) color of the globe (hex string)
   * @default "#220038"
   */
  emissive?: string

  /**
   * Intensity of the emissive color (0-1)
   * @default 0.1
   */
  emissiveIntensity?: number

  /**
   * Shininess of the globe surface material (0-100)
   * @default 0.7
   */
  shininess?: number

  /**
   * Whether to show land masses as hexagon patterns
   * @default true
   */
  showLandPolygons?: boolean

  /**
   * Color for land polygon hexagons (hex or rgba string)
   * @default "rgba(255,255,255,0.7)"
   */
  landPolygonColor?: `rgba(${number},${number},${number},${number})` | `rgb(${number},${number},${number})` | `#${number}`

  /**
   * Opacity for land polygons (0-1)
   * @default 0.7
   */
  landPolygonOpacity?: number

  /**
   * H3 hexagon resolution for land masses (0-15, higher = more detail but slower)
   * @default 3
   */
  hexResolution?: number

  /**
   * Margin between hexagons (0-1, higher = more spacing)
   * @default 0.7
   */
  hexMargin?: number

  /**
   * Use circular dots instead of hexagons for land
   * @default false
   */
  hexUseDots?: boolean

  /**
   * Altitude of hexagons above globe surface
   * @default 0.0005
   */
  hexAltitude?: number

  /**
   * Whether to show atmospheric glow effect around globe
   * @default true
   */
  showAtmosphere?: boolean

  /**
   * Color of the atmosphere glow (hex string)
   * @default "#3a228a"
   */
  atmosphereColor?: string

  /**
   * Size of atmosphere relative to globe radius (0-1)
   * @default 0.25
   */
  atmosphereAltitude?: number

  /**
   * Default color for arcs when not specified (hex string)
   * @default "#DD63AF"
   */
  defaultArcColor?: string

  /**
   * Default color for ripples when not specified (hex string)
   * @default same as arc color
   */
  defaultRippleColor?: string

  /**
   * Maximum scale for ripple expansion animation
   * @default 3.5
   */
  rippleMaxScale?: number

  /**
   * Speed of ripple expansion (0-1, higher = faster)
   * @default 0.08
   */
  rippleExpansionSpeed?: number

  /**
   * @deprecated Use defaultRippleColor instead.
   */
  defaultRingColor?: string

  /**
   * @deprecated Use rippleMaxScale instead.
   */
  ringMaxScale?: number

  /**
   * @deprecated Use rippleExpansionSpeed instead.
   */
  ringExpansionSpeed?: number
}

type NormalizedGlobeConfig = Required<Omit<GlobeConfig, 'defaultRingColor' | 'ringMaxScale' | 'ringExpansionSpeed'>>

interface ActiveArc {
  id: number
  options: ArcEventOptions
  mesh: Mesh
  indexCount: number
  indicesPerSegment: number
  startTime: number
  duration: number
  startDelay: number
  endDelay: number
  flyingSegment: boolean
  segmentLength: number
  startPoint?: Mesh
  endPoint?: Mesh
  startRipple?: Mesh
  endRipple?: Mesh
  startRipplePhase: 'growing' | 'shrinking' | 'done'
  endRipplePhase: 'waiting' | 'growing' | 'shrinking' | 'done'
  phase: 'waiting' | 'animating' | 'completed' | 'removing'
  resolveFinished: (result: GlobeEventResult<'arc'>) => void
}

/**
 * EventGlobe - A 3D globe visualization that extends THREE.Group
 *
 * This is the core globe component that can be added to any Three.js scene.
 * It contains the globe mesh, land masses, atmosphere, animated arcs, and lights.
 *
 * @example
 * ```typescript
 * const globe = new EventGlobe({ globeColor: '#3a228a' });
 * scene.add(globe);
 *
 * // In your render loop
 * globe.update();
 *
 * // Add an event
 * globe.addEvent({
 *   event: 'arc',
 *   lat: 40.7128, lng: -74.0060,
 *   endLat: 51.5074, endLng: -0.1278,
 * });
 * ```
 */
export class EventGlobe extends Group {
  #globe: Mesh
  #atmosphereObj?: Mesh
  #arcsGroup: Group
  #pointsGroup: Group
  #polygonGroup: Group
  #lightsGroup: Group

  readonly #defaultConfig: NormalizedGlobeConfig = {
    globeRadius: 100,
    globeColor: '#3a228a',
    emissive: '#220038',
    emissiveIntensity: 0.1,
    shininess: 0.7,
    showLandPolygons: true,
    landPolygonColor: 'rgba(255,255,255,0.7)',
    landPolygonOpacity: 0.7,
    hexResolution: 3,
    hexMargin: 0.7,
    hexUseDots: false,
    hexAltitude: 0.0005,
    showAtmosphere: true,
    atmosphereColor: '#3a228a',
    atmosphereAltitude: 0.25,
    defaultArcColor: '#DD63AF',
    defaultRippleColor: '#DD63AF',
    rippleMaxScale: 3.5,
    rippleExpansionSpeed: 0.08,
  }

  readonly #defaultArcEventOptions: Required<ArcEventOptions> = {
    event: 'arc',
    lat: 0,
    lng: 0,
    endLat: 0,
    endLng: 0,
    color: '#DD63AF',
    animationDuration: 2000,
    arcVelocity: 0,
    startDelay: 0,
    endDelay: 500,
    strokeWidth: 0.4,
    showPoint: false,
    showEndPoint: false,
    pointRadius: 1.5,
    showRipple: false,
    showEndRipple: true,
    flyingSegment: true,
    segmentLength: 0.15,
  }

  #config: NormalizedGlobeConfig = { ...this.#defaultConfig }
  #activeArcs: Map<number, ActiveArc> = new Map()
  #arcIdCounter = 0
  #onArcRemovedCallback?: (id: number, options: ArcEventOptions) => void

  /**
   * Create a new EventGlobe instance
   *
   * @param config Configuration options for the globe
   */
  constructor(config?: GlobeConfig) {
    super()

    if (config) {
      this.#config = { ...this.#config, ...this.#normalizeConfig(config) }
    }

    this.#arcsGroup = new Group()
    this.#pointsGroup = new Group()
    this.#polygonGroup = new Group()
    this.#lightsGroup = new Group()

    this.add(this.#arcsGroup)
    this.add(this.#pointsGroup)
    this.add(this.#polygonGroup)
    this.add(this.#lightsGroup)

    this.#setupLights()

    this.#globe = this.#createGlobe()
    this.add(this.#globe)

    this.#updateAtmosphere()

    if (this.#config.showLandPolygons) {
      this.#createLandPolygons().catch((error) => console.warn('Failed to load land polygons:', error))
    }
  }

  /**
   * Update the globe configuration
   *
   * @param {GlobeConfig} config - New configuration options (will be merged with existing config)
   * @returns {void}
   */
  public updateConfig(config: GlobeConfig): void {
    this.#config = { ...this.#config, ...this.#normalizeConfig(config) }
    this.#updateGlobeMaterials()
    this.#updatePolygonMaterials()
    this.#updateAtmosphere()
  }

  /**
   * Update arc animations and lifecycle
   *
   * Updates all active arc animations, ripples, and handles arc lifecycle transitions.
   * Call this in your render loop to keep arcs animating.
   *
   * @returns {void}
   */
  public update(): void {
    const now = Date.now()

    this.#activeArcs.forEach((arc, id) => {
      const elapsed = now - arc.startTime

      this.#updateStartRipple(arc)

      switch (arc.phase) {
        case 'waiting':
          if (elapsed >= arc.startDelay) {
            arc.phase = 'animating'
            arc.startTime = now
            arc.startRipplePhase = 'shrinking'
          }
          break

        case 'animating': {
          const segLen = arc.segmentLength
          const progress = Math.min(elapsed / arc.duration, 1)

          if (arc.flyingSegment) {
            const headPos = Math.min(progress / (1 - segLen), 1)
            const tailPos = Math.max(0, Math.min((progress - segLen) / (1 - segLen), 1))

            const totalSegments = Math.floor(arc.indexCount / arc.indicesPerSegment)
            const headSeg = Math.floor(headPos * totalSegments)
            const tailSeg = Math.floor(tailPos * totalSegments)

            const startIdx = tailSeg * arc.indicesPerSegment
            const endIdx = headSeg * arc.indicesPerSegment
            const count = endIdx - startIdx

            arc.mesh.geometry.setDrawRange(startIdx, Math.max(0, count))

            if (headPos >= 0.98 && arc.endRipplePhase === 'waiting') {
              if (arc.endPoint)
                arc.endPoint.visible = true
              arc.endRipplePhase = 'growing'
              if (arc.endRipple)
                arc.endRipple.visible = true
            }
          } else {
            const drawCount = Math.floor(progress * arc.indexCount)
            arc.mesh.geometry.setDrawRange(0, drawCount)

            if (progress >= 0.95 && arc.endRipplePhase === 'waiting') {
              if (arc.endPoint)
                arc.endPoint.visible = true
              arc.endRipplePhase = 'growing'
              if (arc.endRipple)
                arc.endRipple.visible = true
            }
          }

          if (progress >= 1) {
            if (arc.flyingSegment) {
              arc.mesh.geometry.setDrawRange(0, 0)
            } else {
              arc.mesh.geometry.setDrawRange(0, arc.indexCount)
            }
            arc.phase = 'completed'
            arc.startTime = now
            if (arc.endRipplePhase === 'growing') {
              arc.endRipplePhase = 'shrinking'
            }
          }
          break
        }

        case 'completed':
          if (elapsed >= arc.endDelay) {
            arc.phase = 'removing'
            this.#removeActiveArc(id, 'completed')
          }
          break
      }

      this.#updateEndRipple(arc)
    })
  }

  /**
   * Add an event to the globe and receive a handle for completion and removal.
   *
   * @param {GlobeEventOptions} options - Event configuration options
   * @returns {EventHandle<'arc'>} - Handle for awaiting completion or removing the event
   */
  public addEvent(options: GlobeEventOptions): EventHandle<'arc'> {
    switch (options.event) {
      case 'arc':
        return this.#addArcEvent(options).handle
    }
  }

  /**
   * Add an arc animation to the globe.
   *
   * @param {ArcOptions} options - Arc configuration options including start/end coordinates and animation settings
   * @returns {number} - Arc ID for use with removeArcById() or other deprecated ID-based methods
   * @deprecated Use addEvent() instead.
   */
  public addArc(options: ArcOptions): number {
    const eventOptions = this.#arcOptionsToEventOptions(options)
    return this.#addArcEvent(eventOptions).id
  }

  /**
   * Remove an arc by ID
   *
   * Stops and disposes an arc animation immediately, removing it from the globe
   *
   * @param {number} id - The arc ID returned from addArc()
   * @returns {void}
   */
  public removeArcById(id: number): void {
    this.#removeActiveArc(id, 'removed')
  }

  /**
   * Remove all active events.
   */
  public removeAllEvents(): void {
    const activeIds = [...this.#activeArcs.keys()]
    activeIds.forEach((id) => this.#removeActiveArc(id, 'removed'))
  }

  /**
   * Clear all arcs
   *
   * Removes and disposes all active arc animations from the globe
   *
   * @returns {void}
   * @deprecated Use removeAllEvents() instead.
   */
  public clearAllArcs(): void {
    this.removeAllEvents()
  }

  /**
   * Set callback for when an arc is removed
   *
   * The callback will be invoked whenever an arc is removed, either manually via removeArcById()
   * or automatically when the animation completes
   *
   * @param {Function} callback - Function to call when an arc is removed, receives arc ID and original options
   * @returns {void}
   */
  public onArcRemoved(callback: (id: number, options: ArcOptions) => void): void {
    this.#onArcRemovedCallback = (id, options) => {
      callback(id, this.#eventOptionsToArcOptions(options))
    }
  }

  /**
   * Get count of active arcs
   *
   * Returns the number of currently active arc animations
   *
   * @returns {number} - The count of active arcs
   * @deprecated This method will be removed in a future release.
   */
  public getActiveArcCount(): number {
    return this.#activeArcs.size
  }

  /**
   * Dispose of the globe and clean up resources
   *
   * Clears all active arcs and disposes all geometries and materials to free GPU/CPU memory
   *
   * @returns {void}
   */
  public dispose(): void {
    this.removeAllEvents()

    if (this.#globe) {
      this.#globe.geometry.dispose();
      (this.#globe.material as MeshPhongMaterial).dispose()
    }

    if (this.#atmosphereObj) {
      this.#atmosphereObj.geometry.dispose()
      if (this.#atmosphereObj.material instanceof ShaderMaterial) {
        this.#atmosphereObj.material.dispose()
      }
    }

    this.#polygonGroup.children.forEach((child) => {
      if (child instanceof Mesh) {
        child.geometry.dispose()
        if (child.material instanceof MeshBasicMaterial) {
          child.material.dispose()
        }
      }
    })
  }

  /**
   * Symbol.dispose for automatic cleanup with `using` keyword
   *
   * Enables automatic resource cleanup when using the EventGlobe with the `using` statement
   *
   * @returns {void}
   */
  [Symbol.dispose](): void {
    this.dispose()
  }

  #normalizeConfig(config: GlobeConfig): Partial<NormalizedGlobeConfig> {
    return {
      ...config,
      defaultRippleColor: config.defaultRippleColor ?? config.defaultRingColor,
      rippleMaxScale: config.rippleMaxScale ?? config.ringMaxScale,
      rippleExpansionSpeed: config.rippleExpansionSpeed ?? config.ringExpansionSpeed,
    }
  }

  /**
   * Setup scene lights
   *
   * Initializes ambient, directional, and point lights for the scene
   *
   * @returns {void}
   */
  #setupLights(): void {
    const ambientLight = new AmbientLight(0xBBBBBB, 0.3)
    this.#lightsGroup.add(ambientLight)

    const dLight = new DirectionalLight(0xFFFFFF, 0.8)
    dLight.position.set(-800, 2000, 400)
    this.#lightsGroup.add(dLight)

    const dLight1 = new DirectionalLight(0x7982F6, 1)
    dLight1.position.set(-200, 500, 200)
    this.#lightsGroup.add(dLight1)

    const dLight2 = new PointLight(0x8566CC, 0.5)
    dLight2.position.set(-200, 500, 200)
    this.#lightsGroup.add(dLight2)
  }

  /**
   * Create the globe mesh
   *
   * Creates a sphere geometry with Phong material and adds it to the scene
   *
   * @returns {Mesh} - The created globe mesh.
   */
  #createGlobe(): Mesh {
    const radius = this.#config.globeRadius
    const geometry = new SphereGeometry(radius, 64, 64)
    const material = new MeshPhongMaterial({
      color: new Color(this.#config.globeColor),
      emissive: new Color(this.#config.emissive),
      emissiveIntensity: this.#config.emissiveIntensity,
      shininess: this.#config.shininess,
    })

    return new Mesh(geometry, material)
  }

  /**
   * Create or update atmosphere glow effect
   *
   * Disposes existing atmosphere if present and creates a new glow mesh based on config
   *
   * @returns {void}
   */
  #updateAtmosphere(): void {
    if (this.#atmosphereObj) {
      this.remove(this.#atmosphereObj)
      this.#atmosphereObj.geometry.dispose()
      if (this.#atmosphereObj.material instanceof ShaderMaterial) {
        this.#atmosphereObj.material.dispose()
      }
      this.#atmosphereObj = undefined
    }

    if (this.#config.showAtmosphere && this.#config.atmosphereColor && this.#config.atmosphereAltitude && this.#globe) {
      const radius = this.#config.globeRadius
      this.#atmosphereObj = new GlowMesh(this.#globe.geometry, {
        color: this.#config.atmosphereColor,
        size: radius * this.#config.atmosphereAltitude,
        hollowRadius: radius,
        coefficient: 0.1,
        power: 3.5,
        backside: true,
      })
      this.#atmosphereObj.visible = !!this.#config.showAtmosphere
      this.add(this.#atmosphereObj)
    }
  }

  /**
   * Map deprecated arc options to event options.
   *
   * @param {ArcOptions} options - Deprecated arc options.
   * @returns {ArcEventOptions} - Normalized event options.
   */
  #arcOptionsToEventOptions(options: ArcOptions): ArcEventOptions {
    return {
      event: 'arc',
      lat: options.startLat,
      lng: options.startLng,
      endLat: options.endLat,
      endLng: options.endLng,
      color: options.color,
      animationDuration: options.animationDuration,
      arcVelocity: options.arcVelocity,
      startDelay: options.startDelay,
      endDelay: options.endDelay,
      strokeWidth: options.strokeWidth,
      showPoint: options.showStartPoint,
      showEndPoint: options.showEndPoint,
      pointRadius: options.pointRadius,
      showRipple: options.showStartRing,
      showEndRipple: options.showEndRing,
      flyingSegment: options.flyingSegment,
      segmentLength: options.segmentLength,
    }
  }

  /**
   * Map event options back to deprecated arc options.
   *
   * @param {ArcEventOptions} options - Normalized event options.
   * @returns {ArcOptions} - Deprecated arc options.
   */
  #eventOptionsToArcOptions(options: ArcEventOptions): ArcOptions {
    return {
      startLat: options.lat,
      startLng: options.lng,
      endLat: options.endLat,
      endLng: options.endLng,
      color: options.color,
      animationDuration: options.animationDuration,
      arcVelocity: options.arcVelocity,
      startDelay: options.startDelay,
      endDelay: options.endDelay,
      strokeWidth: options.strokeWidth,
      showStartPoint: options.showPoint,
      showEndPoint: options.showEndPoint,
      pointRadius: options.pointRadius,
      showStartRing: options.showRipple,
      showEndRing: options.showEndRipple,
      flyingSegment: options.flyingSegment,
      segmentLength: options.segmentLength,
    }
  }

  #withDefinedOptions<T extends object>(options: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(options).filter(([, value]) => value !== undefined),
    ) as Partial<T>
  }

  /**
   * Remove and finalize an active arc.
   *
   * @param {number} id - Internal arc identifier.
   * @param {GlobeEventFinishReason} reason - Why the event finished.
   * @returns {void}
   */
  #removeActiveArc(id: number, reason: GlobeEventFinishReason): void {
    const arc = this.#activeArcs.get(id)
    if (!arc)
      return

    this.#disposeArc(arc)
    this.#activeArcs.delete(id)
    arc.resolveFinished({ event: 'arc', reason, options: arc.options })

    if (this.#onArcRemovedCallback) {
      this.#onArcRemovedCallback(id, arc.options)
    }
  }

  /**
   * Add a normalized arc event to the scene.
   *
   * @param {ArcEventOptions} options - Normalized arc event options.
   * @returns {{ id: number, handle: EventHandle<'arc'> }} - Internal id and public event handle.
   */
  #addArcEvent(options: ArcEventOptions): { id: number, handle: EventHandle<'arc'> } {
    const id = ++this.#arcIdCounter
    const opts = {
      ...this.#defaultArcEventOptions,
      ...this.#withDefinedOptions(options),
    }

    const color = opts.color ?? this.#config.defaultArcColor
    const altitude = 0.3
    const startDelay = opts.startDelay
    const endDelay = opts.endDelay
    const pointRadius = opts.pointRadius

    const showStartPoint = opts.showPoint !== undefined ? opts.showPoint !== false : false
    const startPointColor = typeof opts.showPoint === 'string' ? opts.showPoint : color

    const showEndPoint = opts.showEndPoint !== undefined ? opts.showEndPoint !== false : false
    const endPointColor = typeof opts.showEndPoint === 'string' ? opts.showEndPoint : color

    const showStartRipple = opts.showRipple !== undefined ? opts.showRipple !== false : false
    const startRippleColor = typeof opts.showRipple === 'string' ? opts.showRipple : color

    const showEndRipple = opts.showEndRipple !== undefined ? opts.showEndRipple !== false : true
    const endRippleColor = typeof opts.showEndRipple === 'string' ? opts.showEndRipple : color

    const flyingSegment = opts.flyingSegment
    const segmentLength = opts.segmentLength

    const { geometry, startPos, endPos, arcLength } = this.#createArcGeometry(
      opts.lat,
      opts.lng,
      opts.endLat,
      opts.endLng,
      altitude,
    )

    let duration: number
    if (opts.arcVelocity && opts.arcVelocity > 0) {
      duration = (arcLength / opts.arcVelocity) * 1000
      duration = Math.max(500, Math.min(10000, duration))
    } else {
      duration = opts.animationDuration
    }

    const material = new MeshBasicMaterial({
      color: new Color(color),
      transparent: true,
      opacity: 0.9,
    })

    const mesh = new Mesh(geometry, material)

    const indexCount = geometry.index ? geometry.index.count : 0
    const radialSegments = 6
    const indicesPerSegment = radialSegments * 6

    geometry.setDrawRange(0, 0)

    this.#arcsGroup.add(mesh)

    let startPoint: Mesh | undefined
    let endPoint: Mesh | undefined
    let startRipple: Mesh | undefined
    let endRipple: Mesh | undefined

    if (showStartPoint) {
      startPoint = this.#createPointMarker(startPos, startPointColor, pointRadius)
      this.#pointsGroup.add(startPoint)
    }

    if (showStartRipple) {
      startRipple = this.#createRipple(startPos, startRippleColor)
      startRipple.visible = true
      startRipple.scale.set(0.05, 0.05, 1)
      this.#pointsGroup.add(startRipple)
    }

    if (showEndPoint) {
      endPoint = this.#createPointMarker(endPos, endPointColor, pointRadius)
      endPoint.visible = false
      this.#pointsGroup.add(endPoint)
    }

    if (showEndRipple) {
      endRipple = this.#createRipple(endPos, endRippleColor)
      endRipple.scale.set(0.05, 0.05, 1)
      this.#pointsGroup.add(endRipple)
    }

    let resolveFinished!: (result: GlobeEventResult<'arc'>) => void
    const finished = new Promise<GlobeEventResult<'arc'>>((resolve) => {
      resolveFinished = resolve
    })

    const activeArc: ActiveArc = {
      id,
      options,
      mesh,
      indexCount,
      indicesPerSegment,
      startTime: Date.now(),
      duration,
      startDelay,
      endDelay,
      flyingSegment,
      segmentLength,
      startPoint,
      endPoint,
      startRipple,
      endRipple,
      startRipplePhase: 'growing',
      endRipplePhase: 'waiting',
      phase: startDelay > 0 ? 'waiting' : 'animating',
      resolveFinished,
    }

    this.#activeArcs.set(id, activeArc)

    return {
      id,
      handle: {
        finished,
        remove: () => {
          this.#removeActiveArc(id, 'removed')
        },
      },
    }
  }

  /**
   * Add a random arc for testing
   *
   * Creates an arc between two random globe locations with preset animation parameters
   *
   * @returns {number} - Arc ID for the created arc
   */
  /* public addRandomArc(): number {
    const randomLat = () => (Math.random() - 0.5) * 140
    const randomLng = () => (Math.random() - 0.5) * 360

    return this.addArc({
      startLat: randomLat(),
      startLng: randomLng(),
      endLat: randomLat(),
      endLng: randomLng(),
      arcVelocity: 80,
      startDelay: 300,
      endDelay: 500,
      flyingSegment: true,
      segmentLength: 0.15,
    })
  } */

  #createLandPolygons(): Promise<void> {
    return (async () => {
      try {
        const geoJsonData = await import('./globe-data-min.json').then((m) => m.default)

        const features = geoJsonData.features || []

        const radius = this.#config.globeRadius
        const h3Res = Math.max(0, Math.min(4, this.#config.hexResolution))
        const margin = Math.max(0, Math.min(0.95, this.#config.hexMargin))
        const useDots = this.#config.hexUseDots
        const altitude = this.#config.hexAltitude

        const colorStr = this.#config.landPolygonColor
        let polygonColor: Color

        if (colorStr.startsWith('rgba') || colorStr.startsWith('rgb')) {
          const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
          if (match) {
            polygonColor = new Color(`rgb(${match[1]}, ${match[2]}, ${match[3]})`)
          } else {
            polygonColor = new Color(0xFFFFFF)
          }
        } else {
          polygonColor = new Color(colorStr)
        }

        const hexSet = new Set<string>()

        features.forEach((feature) => {
          if (!feature.geometry)
            return

          try {
            if (feature.geometry.type === 'Polygon') {
              // @ts-expect-error - coordinates have correct type
              const h3Indices = polygonToCells(feature.geometry.coordinates, h3Res, true)
              h3Indices.forEach((idx) => hexSet.add(idx))
            } else if (feature.geometry.type === 'MultiPolygon') {
              feature.geometry.coordinates.forEach((coords) => {
                const h3Indices = polygonToCells(coords, h3Res, true)
                h3Indices.forEach((idx) => hexSet.add(idx))
              })
            }
          } catch {
            // Skip problematic features
          }
        })

        const geometries: BufferGeometry[] = []

        hexSet.forEach((h3Idx) => {
          const geom = this.#createHexagonGeometry(h3Idx, radius, altitude, margin, useDots)
          if (geom)
            geometries.push(geom)
        })

        if (geometries.length === 0)
          return

        const mergedGeometry = mergeGeometries(geometries)
        geometries.forEach((g) => g.dispose())

        const material = new MeshBasicMaterial({
          color: polygonColor,
          transparent: false,
          side: DoubleSide,
          fog: false,
          depthWrite: true,
          depthTest: true,
        })

        const mesh = new Mesh(mergedGeometry, material)
        this.#polygonGroup.add(mesh)
      } catch (error) {
        console.warn('Failed to create land polygons:', error)
      }
    })()
  }

  /**
   * Create a single hexagon geometry from H3 index
   *
   * Generates either a circular dot or conic polygon geometry for an H3 hexagon cell
   *
   * @param {string} h3Idx - H3 cell index string
   * @param {number} radius - Globe radius in Three.js units
   * @param {number} altitude - Altitude offset above the globe surface
   * @param {number} margin - Margin between hexagons (0-1, higher = more spacing)
   * @param {boolean} useDots - If true, creates circle geometry; if false, creates conic polygon
   * @returns {BufferGeometry | null} - The generated geometry or null if creation fails
   */
  #createHexagonGeometry(
    h3Idx: string,
    radius: number,
    altitude: number,
    margin: number,
    useDots: boolean,
  ): BufferGeometry | null {
    try {
      const [clat, clng] = cellToLatLng(h3Idx)
      const hexBoundary = cellToBoundary(h3Idx, true).reverse()

      hexBoundary.forEach((d) => {
        const edgeLng = d[0]
        if (Math.abs(clng - edgeLng) > 170) {
          d[0] += (clng > edgeLng ? 360 : -360)
        }
      })

      if (useDots) {
        const centerPos = this.#latLngToVector3(clat, clng, altitude)
        const edgePos = this.#latLngToVector3(hexBoundary[0]![1], hexBoundary[0]![0], altitude)
        const r = 0.85 * (1 - margin) * centerPos.distanceTo(edgePos)

        const geometry = new CircleGeometry(r, 12)
        geometry.rotateX(MathUtils.degToRad(-clat))
        geometry.rotateY(MathUtils.degToRad(clng))
        geometry.translate(centerPos.x, centerPos.y, centerPos.z)
        return geometry
      }

      const relNum = (st: number, end: number, rat: number) => st - (st - end) * rat

      const geoJson = margin === 0
        ? hexBoundary
        : hexBoundary.map(([elng, elat]) =>
            [[elng, clng], [elat, clat]].map(([st, end]) => relNum(st!, end!, margin)),
          )

      return new ConicPolygonGeometry(
        [geoJson],
        radius * (1 + altitude),
        radius * (1 + altitude),
        false,
        true,
        false,
        5,
      )
    } catch {
      return null
    }
  }

  /**
   * Convert lat/lng to 3D position on globe surface
   *
   * Converts geographic coordinates to 3D Cartesian coordinates on the globe
   *
   * @param {number} lat - Latitude in degrees (-90 to 90)
   * @param {number} lng - Longitude in degrees (-180 to 180)
   * @param {number} altitude - Optional altitude offset as fraction of radius (default: 0)
   * @returns {Vector3} - 3D position vector in Three.js world space
   */
  #latLngToVector3(lat: number, lng: number, altitude: number = 0): Vector3 {
    const radius = this.#config.globeRadius * (1 + altitude)
    const phi = MathUtils.degToRad(90 - lat)
    const theta = MathUtils.degToRad(lng + 90)

    return new Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    )
  }

  /**
   * Create a curved arc between two points
   *
   * Generates a tube geometry representing a great circle arc between two globe points
   *
   * @param {number} startLat - Starting latitude in degrees (-90 to 90)
   * @param {number} startLng - Starting longitude in degrees (-180 to 180)
   * @param {number} endLat - Ending latitude in degrees (-90 to 90)
   * @param {number} endLng - Ending longitude in degrees (-180 to 180)
   * @param {number} altitude - Peak altitude of arc as fraction of globe radius
   * @returns {object} - Object with properties: geometry (TubeGeometry), startPos (Vector3), endPos (Vector3), arcLength (number)
   */
  #createArcGeometry(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    altitude: number,
  ): { geometry: TubeGeometry, startPos: Vector3, endPos: Vector3, arcLength: number } {
    const radius = this.#config.globeRadius
    const startPos = this.#latLngToVector3(startLat, startLng)
    const endPos = this.#latLngToVector3(endLat, endLng)

    const angle = startPos.angleTo(endPos)
    const maxAltitude = altitude * radius * (0.3 + angle / Math.PI * 0.7)

    const estimatedArcLength = angle * radius * (1 + altitude * 0.5)
    const segmentsPerUnit = 1.5
    const segments = Math.max(60, Math.floor(estimatedArcLength * segmentsPerUnit))

    const points: Vector3[] = []

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const point = new Vector3().copy(startPos).lerp(endPos, t)
      point.normalize().multiplyScalar(radius)
      const altitudeAtPoint = Math.sin(t * Math.PI) * maxAltitude
      point.normalize().multiplyScalar(radius + altitudeAtPoint)
      points.push(point)
    }

    const curve = new CatmullRomCurve3(points)
    const arcLength = curve.getLength()
    const geometry = new TubeGeometry(curve, segments, 0.4, 6, false)

    return { geometry, startPos, endPos, arcLength }
  }

  /**
   * Create a point marker on the globe
   *
   * Creates a circular marker mesh positioned on the globe surface
   *
   * @param {Vector3} position - 3D world position for the marker
   * @param {string} color - Hex color string for the marker (e.g., "#FF0000")
   * @param {number} radius - Radius of the circular marker in Three.js units
   * @returns {Mesh} - The created marker mesh
   */
  #createPointMarker(position: Vector3, color: string, radius: number): Mesh {
    const geometry = new CircleGeometry(radius, 8)
    const material = new MeshBasicMaterial({
      color: new Color(color),
      side: DoubleSide,
      transparent: true,
      opacity: 0.9,
    })

    const marker = new Mesh(geometry, material)
    marker.position.copy(position.clone().normalize().multiplyScalar(position.length() + 0.3))
    marker.lookAt(marker.position.clone().multiplyScalar(2))

    return marker
  }

  /**
   * Create an expanding ripple effect
   *
   * Creates a ripple geometry that will be animated to expand outward
   *
   * @param {Vector3} position - 3D world position for the ripple center
   * @param {string} color - Hex color string for the ripple (e.g., "#FF00FF")
   * @returns {Mesh} - The created ripple mesh (initially hidden)
   */
  #createRipple(position: Vector3, color: string): Mesh {
    const geometry = new RingGeometry(0.8, 1.0, 16)
    const material = new MeshBasicMaterial({
      color: new Color(color),
      side: DoubleSide,
      transparent: true,
      opacity: 1,
    })

    const ripple = new Mesh(geometry, material)
    ripple.position.copy(position.clone().normalize().multiplyScalar(position.length() + 0.4))
    ripple.lookAt(ripple.position.clone().multiplyScalar(2))
    ripple.visible = false

    return ripple
  }

  /**
   * Update start ripple animation
   *
   * Animates the start ripple by expanding its scale and fading its opacity
   *
   * @param {ActiveArc} arc - The active arc containing the ripple to animate
   * @returns {void}
   */
  #updateStartRipple(arc: ActiveArc): void {
    if (!arc.startRipple)
      return

    const rippleMat = arc.startRipple.material as MeshBasicMaterial

    if (arc.startRipplePhase === 'shrinking') {
      const targetScale = this.#config.rippleMaxScale
      const expansionSpeed = this.#config.rippleExpansionSpeed
      const currentScale = arc.startRipple.scale.x
      const newScale = currentScale + (targetScale - currentScale) * expansionSpeed
      arc.startRipple.scale.set(newScale, newScale, 1)

      const progress = (newScale - 0.05) / (targetScale - 0.05)
      rippleMat.opacity = Math.max(0, 1 - progress)

      if (rippleMat.opacity <= 0.05) {
        arc.startRipplePhase = 'done'
        arc.startRipple.visible = false
        if (arc.startPoint)
          arc.startPoint.visible = false
      }
    }
  }

  /**
   * Update end ripple animation
   *
   * Animates the end ripple by expanding its scale and fading its opacity
   *
   * @param {ActiveArc} arc - The active arc containing the ripple to animate
   * @returns {void}
   */
  #updateEndRipple(arc: ActiveArc): void {
    if (!arc.endRipple || !arc.endRipple.visible)
      return

    const rippleMat = arc.endRipple.material as MeshBasicMaterial

    const targetScale = this.#config.rippleMaxScale
    const expansionSpeed = this.#config.rippleExpansionSpeed
    const currentScale = arc.endRipple.scale.x
    const newScale = currentScale + (targetScale - currentScale) * expansionSpeed
    arc.endRipple.scale.set(newScale, newScale, 1)

    const progress = (newScale - 0.05) / (targetScale - 0.05)
    rippleMat.opacity = Math.max(0, 1 - progress)

    if (rippleMat.opacity <= 0.05) {
      arc.endRipplePhase = 'done'
      arc.endRipple.visible = false
    }
  }

  /**
   * Dispose of an arc and its resources
   *
   * Removes arc mesh and all associated markers/ripples from the scene and disposes their geometries and materials
   *
   * @param {ActiveArc} arc - The arc to dispose
   * @returns {void}
   */
  #disposeArc(arc: ActiveArc): void {
    this.#arcsGroup.remove(arc.mesh)
    if (arc.startPoint)
      this.#pointsGroup.remove(arc.startPoint)
    if (arc.endPoint)
      this.#pointsGroup.remove(arc.endPoint)
    if (arc.startRipple)
      this.#pointsGroup.remove(arc.startRipple)
    if (arc.endRipple)
      this.#pointsGroup.remove(arc.endRipple)

    arc.mesh.geometry.dispose();
    (arc.mesh.material as MeshBasicMaterial).dispose()

    if (arc.startPoint) {
      arc.startPoint.geometry.dispose();
      (arc.startPoint.material as MeshBasicMaterial).dispose()
    }
    if (arc.endPoint) {
      arc.endPoint.geometry.dispose();
      (arc.endPoint.material as MeshBasicMaterial).dispose()
    }
    if (arc.startRipple) {
      arc.startRipple.geometry.dispose();
      (arc.startRipple.material as MeshBasicMaterial).dispose()
    }
    if (arc.endRipple) {
      arc.endRipple.geometry.dispose();
      (arc.endRipple.material as MeshBasicMaterial).dispose()
    }
  }

  /**
   * Update globe material colors
   *
   * Applies current config colors to the globe mesh material
   *
   * @returns {void}
   */
  #updateGlobeMaterials(): void {
    if (!this.#globe)
      return

    const material = this.#globe.material as MeshPhongMaterial
    material.color.set(new Color(this.#config.globeColor))
    material.emissive.set(new Color(this.#config.emissive))
    material.emissiveIntensity = this.#config.emissiveIntensity
    material.shininess = this.#config.shininess
  }

  /**
   * Update polygon material colors
   *
   * Applies current config colors to all land polygon meshes
   *
   * @returns {void}
   */
  #updatePolygonMaterials(): void {
    if (!this.#polygonGroup || this.#polygonGroup.children.length === 0)
      return

    const colorStr = this.#config.landPolygonColor
    let polygonColor: Color

    if (colorStr.startsWith('rgba') || colorStr.startsWith('rgb')) {
      const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (match) {
        polygonColor = new Color(`rgb(${match[1]}, ${match[2]}, ${match[3]})`)
      } else {
        polygonColor = new Color(0xFFFFFF)
      }
    } else {
      polygonColor = new Color(colorStr)
    }

    this.#polygonGroup.children.forEach((child) => {
      if (child instanceof Mesh && child.material instanceof MeshBasicMaterial) {
        child.material.color.set(polygonColor)
      }
    })
  }
}
