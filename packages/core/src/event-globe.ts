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
  landPolygonColor?: string

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
   * Default color for ripple rings when not specified (hex string)
   * @default same as arc color
   */
  defaultRingColor?: string

  /**
   * Maximum scale for ring expansion animation
   * @default 3.5
   */
  ringMaxScale?: number

  /**
   * Speed of ring expansion (0-1, higher = faster)
   * @default 0.08
   */
  ringExpansionSpeed?: number
}

/**
 * Options for creating an arc animation between two points on the globe
 */
export interface ArcOptions {
  /**
   * Starting latitude in degrees (-90 to 90)
   */
  startLat: number

  /**
   * Starting longitude in degrees (-180 to 180)
   */
  startLng: number

  /**
   * Ending latitude in degrees (-90 to 90)
   */
  endLat: number

  /**
   * Ending longitude in degrees (-180 to 180)
   */
  endLng: number

  /**
   * Color of the arc as a hex string
   * @default GlobeConfig.defaultArcColor (#DD63AF)
   */
  color?: string

  /**
   * Duration of flight animation in milliseconds
   * @default 2000 (ignored if arcVelocity is set)
   */
  animationDuration?: number

  /**
   * Velocity in units per second (e.g., 80)
   * @default undefined (if set, duration is calculated from arc length)
   */
  arcVelocity?: number

  /**
   * Delay before animation starts in milliseconds
   * @default 0
   */
  startDelay?: number

  /**
   * Delay before removing arc after animation completes in milliseconds
   * @default 500
   */
  endDelay?: number

  /**
   * Width of the arc stroke
   * @default 0.4
   */
  strokeWidth?: number

  /**
   * Show marker dot at start point (true/false or color hex string)
   * @default false
   */
  showStartPoint?: boolean | string

  /**
   * Show marker dot at end point (true/false or color hex string)
   * @default false
   */
  showEndPoint?: boolean | string

  /**
   * Radius of point markers in Three.js units
   * @default 1.5
   */
  pointRadius?: number

  /**
   * Show expanding ring at start point (true/false or color hex string)
   * @default false
   */
  showStartRing?: boolean | string

  /**
   * Show expanding ring at end point (true/false or color hex string)
   * @default true
   */
  showEndRing?: boolean | string

  /**
   * If true, arc flies as a moving segment; if false, draws full path gradually
   * @default true
   */
  flyingSegment?: boolean

  /**
   * Length of flying segment as fraction of total arc (0.0-1.0)
   * @default 0.15
   */
  segmentLength?: number
}

interface ActiveArc {
  id: number
  options: ArcOptions
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
  startRing?: Mesh
  endRing?: Mesh
  startRingPhase: 'growing' | 'shrinking' | 'done'
  endRingPhase: 'waiting' | 'growing' | 'shrinking' | 'done'
  phase: 'waiting' | 'animating' | 'completed' | 'removing'
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
 * // Add arcs
 * globe.addArc({
 *   startLat: 40.7128, startLng: -74.0060,
 *   endLat: 51.5074, endLng: -0.1278,
 * });
 * ```
 */
export class EventGlobe extends Group {
  private globe!: Mesh
  private atmosphereObj?: Mesh
  private arcsGroup!: Group
  private pointsGroup!: Group
  private polygonGroup!: Group
  private lightsGroup!: Group

  private readonly defaultConfig: Required<GlobeConfig> = {
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
    defaultRingColor: '#DD63AF',
    ringMaxScale: 3.5,
    ringExpansionSpeed: 0.08,
  }

  private readonly defaultArcOptions: Required<ArcOptions> = {
    startLat: 0,
    startLng: 0,
    endLat: 0,
    endLng: 0,
    color: '#DD63AF',
    animationDuration: 2000,
    arcVelocity: 0,
    startDelay: 0,
    endDelay: 500,
    strokeWidth: 0.4,
    showStartPoint: false,
    showEndPoint: false,
    pointRadius: 1.5,
    showStartRing: false,
    showEndRing: true,
    flyingSegment: true,
    segmentLength: 0.15,
  }

  private config: Required<GlobeConfig> = { ...this.defaultConfig }
  private activeArcs: Map<number, ActiveArc> = new Map()
  private arcIdCounter = 0
  private onArcRemovedCallback?: (id: number, options: ArcOptions) => void

  /**
   * Create a new EventGlobe instance
   *
   * @param config Configuration options for the globe
   */
  constructor(config?: GlobeConfig) {
    super()

    if (config) {
      this.config = { ...this.config, ...config }
    }

    this.initGlobe()
  }

  /**
   * Initialize the globe and its components
   *
   * Sets up all internal groups, lights, globe mesh, atmosphere, and land polygons
   *
   * @returns {void}
   */
  private initGlobe(): void {
    // Create groups for organizing scene objects
    this.arcsGroup = new Group()
    this.pointsGroup = new Group()
    this.polygonGroup = new Group()
    this.lightsGroup = new Group()

    this.add(this.arcsGroup)
    this.add(this.pointsGroup)
    this.add(this.polygonGroup)
    this.add(this.lightsGroup)

    // Setup lights
    this.setupLights()

    // Create globe
    this.createGlobe()

    // Create atmosphere
    this.updateAtmosphere()

    // Create land polygons
    if (this.config.showLandPolygons) {
      this.createLandPolygons().catch((error) => console.warn('Failed to load land polygons:', error))
    }
  }

  /**
   * Setup scene lights
   *
   * Initializes ambient, directional, and point lights for the scene
   *
   * @returns {void}
   */
  private setupLights(): void {
    const ambientLight = new AmbientLight(0xBBBBBB, 0.3)
    this.lightsGroup.add(ambientLight)

    const dLight = new DirectionalLight(0xFFFFFF, 0.8)
    dLight.position.set(-800, 2000, 400)
    this.lightsGroup.add(dLight)

    const dLight1 = new DirectionalLight(0x7982F6, 1)
    dLight1.position.set(-200, 500, 200)
    this.lightsGroup.add(dLight1)

    const dLight2 = new PointLight(0x8566CC, 0.5)
    dLight2.position.set(-200, 500, 200)
    this.lightsGroup.add(dLight2)
  }

  /**
   * Create the globe mesh
   *
   * Creates a sphere geometry with Phong material and adds it to the scene
   *
   * @returns {void}
   */
  private createGlobe(): void {
    const radius = this.config.globeRadius
    const geometry = new SphereGeometry(radius, 64, 64)
    const material = new MeshPhongMaterial({
      color: new Color(this.config.globeColor),
      emissive: new Color(this.config.emissive),
      emissiveIntensity: this.config.emissiveIntensity,
      shininess: this.config.shininess,
    })

    this.globe = new Mesh(geometry, material)
    this.add(this.globe)
  }

  /**
   * Create or update atmosphere glow effect
   *
   * Disposes existing atmosphere if present and creates a new glow mesh based on config
   *
   * @returns {void}
   */
  private updateAtmosphere(): void {
    if (this.atmosphereObj) {
      this.remove(this.atmosphereObj)
      this.atmosphereObj.geometry.dispose()
      if (this.atmosphereObj.material instanceof ShaderMaterial) {
        this.atmosphereObj.material.dispose()
      }
      this.atmosphereObj = undefined
    }

    if (this.config.showAtmosphere && this.config.atmosphereColor && this.config.atmosphereAltitude && this.globe) {
      const radius = this.config.globeRadius
      this.atmosphereObj = new GlowMesh(this.globe.geometry, {
        color: this.config.atmosphereColor,
        size: radius * this.config.atmosphereAltitude,
        hollowRadius: radius,
        coefficient: 0.1,
        power: 3.5,
        backside: true,
      })
      this.atmosphereObj.visible = !!this.config.showAtmosphere
      this.add(this.atmosphereObj)
    }
  }

  /**
   * Create land mass hexagon grid from GeoJSON data using H3
   *
   * Generates hexagon or dot polygons for land masses based on H3 resolution
   *
   * @returns {Promise<void>}
   */
  private async createLandPolygons(): Promise<void> {
    try {
      const geoJsonData = await import('./globe-data-min.json').then((m) => m.default)

      const features = geoJsonData.features || []

      const radius = this.config.globeRadius
      const h3Res = Math.max(0, Math.min(4, this.config.hexResolution))
      const margin = Math.max(0, Math.min(0.95, this.config.hexMargin))
      const useDots = this.config.hexUseDots
      const altitude = this.config.hexAltitude

      const colorStr = this.config.landPolygonColor
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
        const geom = this.createHexagonGeometry(h3Idx, radius, altitude, margin, useDots)
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
      this.polygonGroup.add(mesh)
    } catch (error) {
      console.warn('Failed to create land polygons:', error)
    }
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
  private createHexagonGeometry(
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
        const centerPos = this.latLngToVector3(clat, clng, altitude)
        const edgePos = this.latLngToVector3(hexBoundary[0]![1], hexBoundary[0]![0], altitude)
        const r = 0.85 * (1 - margin) * centerPos.distanceTo(edgePos)

        const geometry = new CircleGeometry(r, 12)
        geometry.rotateX(MathUtils.degToRad(-clat))
        geometry.rotateY(MathUtils.degToRad(clng))
        geometry.translate(centerPos.x, centerPos.y, centerPos.z)
        return geometry
      } else {
        const relNum = (st: number, end: number, rat: number) => st - (st - end) * rat

        const geoJson = margin === 0
          ? hexBoundary
          : hexBoundary.map(([elng, elat]) =>
              [[elng, clng], [elat, clat]].map(([st, end]) => relNum(st!, end!, margin)),
            )

        const geometry = new ConicPolygonGeometry(
          [geoJson],
          radius * (1 + altitude),
          radius * (1 + altitude),
          false,
          true,
          false,
          5,
        )

        return geometry
      }
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
  private latLngToVector3(lat: number, lng: number, altitude: number = 0): Vector3 {
    const radius = this.config.globeRadius * (1 + altitude)
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
  private createArcGeometry(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    altitude: number,
  ): { geometry: TubeGeometry, startPos: Vector3, endPos: Vector3, arcLength: number } {
    const radius = this.config.globeRadius
    const startPos = this.latLngToVector3(startLat, startLng)
    const endPos = this.latLngToVector3(endLat, endLng)

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
  private createPointMarker(position: Vector3, color: string, radius: number): Mesh {
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
   * Create an expanding ring effect
   *
   * Creates a ring geometry that will be animated to expand outward
   *
   * @param {Vector3} position - 3D world position for the ring center
   * @param {string} color - Hex color string for the ring (e.g., "#FF00FF")
   * @returns {Mesh} - The created ring mesh (initially hidden)
   */
  private createRing(position: Vector3, color: string): Mesh {
    const geometry = new RingGeometry(0.8, 1.0, 16)
    const material = new MeshBasicMaterial({
      color: new Color(color),
      side: DoubleSide,
      transparent: true,
      opacity: 1,
    })

    const ring = new Mesh(geometry, material)
    ring.position.copy(position.clone().normalize().multiplyScalar(position.length() + 0.4))
    ring.lookAt(ring.position.clone().multiplyScalar(2))
    ring.visible = false

    return ring
  }

  /**
   * Update start ring animation
   *
   * Animates the start ring by expanding its scale and fading its opacity
   *
   * @param {ActiveArc} arc - The active arc containing the ring to animate
   * @returns {void}
   */
  private updateStartRing(arc: ActiveArc): void {
    if (!arc.startRing)
      return

    const ringMat = arc.startRing.material as MeshBasicMaterial

    if (arc.startRingPhase === 'shrinking') {
      const targetScale = this.config.ringMaxScale
      const expansionSpeed = this.config.ringExpansionSpeed
      const currentScale = arc.startRing.scale.x
      const newScale = currentScale + (targetScale - currentScale) * expansionSpeed
      arc.startRing.scale.set(newScale, newScale, 1)

      const progress = (newScale - 0.05) / (targetScale - 0.05)
      ringMat.opacity = Math.max(0, 1 - progress)

      if (ringMat.opacity <= 0.05) {
        arc.startRingPhase = 'done'
        arc.startRing.visible = false
        if (arc.startPoint)
          arc.startPoint.visible = false
      }
    }
  }

  /**
   * Update end ring animation
   *
   * Animates the end ring by expanding its scale and fading its opacity
   *
   * @param {ActiveArc} arc - The active arc containing the ring to animate
   * @returns {void}
   */
  private updateEndRing(arc: ActiveArc): void {
    if (!arc.endRing || !arc.endRing.visible)
      return

    const ringMat = arc.endRing.material as MeshBasicMaterial

    const targetScale = this.config.ringMaxScale
    const expansionSpeed = this.config.ringExpansionSpeed
    const currentScale = arc.endRing.scale.x
    const newScale = currentScale + (targetScale - currentScale) * expansionSpeed
    arc.endRing.scale.set(newScale, newScale, 1)

    const progress = (newScale - 0.05) / (targetScale - 0.05)
    ringMat.opacity = Math.max(0, 1 - progress)

    if (ringMat.opacity <= 0.05) {
      arc.endRingPhase = 'done'
      arc.endRing.visible = false
    }
  }

  /**
   * Dispose of an arc and its resources
   *
   * Removes arc mesh and all associated markers/rings from the scene and disposes their geometries and materials
   *
   * @param {ActiveArc} arc - The arc to dispose
   * @returns {void}
   */
  private disposeArc(arc: ActiveArc): void {
    this.arcsGroup.remove(arc.mesh)
    if (arc.startPoint)
      this.pointsGroup.remove(arc.startPoint)
    if (arc.endPoint)
      this.pointsGroup.remove(arc.endPoint)
    if (arc.startRing)
      this.pointsGroup.remove(arc.startRing)
    if (arc.endRing)
      this.pointsGroup.remove(arc.endRing)

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
    if (arc.startRing) {
      arc.startRing.geometry.dispose();
      (arc.startRing.material as MeshBasicMaterial).dispose()
    }
    if (arc.endRing) {
      arc.endRing.geometry.dispose();
      (arc.endRing.material as MeshBasicMaterial).dispose()
    }
  }

  // ============ PUBLIC API ============

  /**
   * Update the globe configuration
   *
   * @param {GlobeConfig} config - New configuration options (will be merged with existing config)
   * @returns {void}
   */
  public updateConfig(config: GlobeConfig): void {
    this.config = { ...this.config, ...config }
    this.updateGlobeMaterials()
    this.updatePolygonMaterials()
    this.updateAtmosphere()
  }

  /**
   * Update globe material colors
   *
   * Applies current config colors to the globe mesh material
   *
   * @returns {void}
   */
  private updateGlobeMaterials(): void {
    if (!this.globe)
      return

    const material = this.globe.material as MeshPhongMaterial
    material.color.set(new Color(this.config.globeColor))
    material.emissive.set(new Color(this.config.emissive))
    material.emissiveIntensity = this.config.emissiveIntensity
    material.shininess = this.config.shininess
  }

  /**
   * Update polygon material colors
   *
   * Applies current config colors to all land polygon meshes
   *
   * @returns {void}
   */
  private updatePolygonMaterials(): void {
    if (!this.polygonGroup || this.polygonGroup.children.length === 0)
      return

    const colorStr = this.config.landPolygonColor
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

    this.polygonGroup.children.forEach((child) => {
      if (child instanceof Mesh && child.material instanceof MeshBasicMaterial) {
        child.material.color.set(polygonColor)
      }
    })
  }

  /**
   * Update arc animations and lifecycle
   *
   * Updates all active arc animations, rings, and handles arc lifecycle transitions.
   * Call this in your render loop to keep arcs animating.
   *
   * @returns {void}
   */
  public update(): void {
    const now = Date.now()

    this.activeArcs.forEach((arc, id) => {
      const elapsed = now - arc.startTime

      this.updateStartRing(arc)

      switch (arc.phase) {
        case 'waiting':
          if (elapsed >= arc.startDelay) {
            arc.phase = 'animating'
            arc.startTime = now
            arc.startRingPhase = 'shrinking'
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

            if (headPos >= 0.98 && arc.endRingPhase === 'waiting') {
              if (arc.endPoint)
                arc.endPoint.visible = true
              arc.endRingPhase = 'growing'
              if (arc.endRing)
                arc.endRing.visible = true
            }
          } else {
            const drawCount = Math.floor(progress * arc.indexCount)
            arc.mesh.geometry.setDrawRange(0, drawCount)

            if (progress >= 0.95 && arc.endRingPhase === 'waiting') {
              if (arc.endPoint)
                arc.endPoint.visible = true
              arc.endRingPhase = 'growing'
              if (arc.endRing)
                arc.endRing.visible = true
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
            if (arc.endRingPhase === 'growing') {
              arc.endRingPhase = 'shrinking'
            }
          }
          break
        }

        case 'completed':
          if (elapsed >= arc.endDelay) {
            arc.phase = 'removing'
            this.removeArcById(id)
          }
          break
      }

      this.updateEndRing(arc)
    })
  }

  /**
   * Add an arc animation to the globe
   *
   * @param {ArcOptions} options - Arc configuration options including start/end coordinates and animation settings
   * @returns {number} - Arc ID for use with removeArcById() or other management methods
   */
  public addArc(options: ArcOptions): number {
    const id = ++this.arcIdCounter
    const opts = { ...this.defaultArcOptions, ...options }

    const color = opts.color ?? this.config.defaultArcColor
    const altitude = 0.3
    const startDelay = opts.startDelay
    const endDelay = opts.endDelay
    const pointRadius = opts.pointRadius

    const showStartPoint = opts.showStartPoint !== undefined ? opts.showStartPoint !== false : false
    const startPointColor = typeof opts.showStartPoint === 'string' ? opts.showStartPoint : color

    const showEndPoint = opts.showEndPoint !== undefined ? opts.showEndPoint !== false : false
    const endPointColor = typeof opts.showEndPoint === 'string' ? opts.showEndPoint : color

    const showStartRing = opts.showStartRing !== undefined ? opts.showStartRing !== false : false
    const startRingColor = typeof opts.showStartRing === 'string' ? opts.showStartRing : color

    const showEndRing = opts.showEndRing !== undefined ? opts.showEndRing !== false : true
    const endRingColor = typeof opts.showEndRing === 'string' ? opts.showEndRing : color

    const flyingSegment = opts.flyingSegment
    const segmentLength = opts.segmentLength

    const { geometry, startPos, endPos, arcLength } = this.createArcGeometry(
      options.startLat,
      options.startLng,
      options.endLat,
      options.endLng,
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

    this.arcsGroup.add(mesh)

    let startPoint: Mesh | undefined
    let endPoint: Mesh | undefined
    let startRing: Mesh | undefined
    let endRing: Mesh | undefined

    if (showStartPoint) {
      startPoint = this.createPointMarker(startPos, startPointColor, pointRadius)
      this.pointsGroup.add(startPoint)
    }

    if (showStartRing) {
      startRing = this.createRing(startPos, startRingColor)
      startRing.visible = true
      startRing.scale.set(0.05, 0.05, 1)
      this.pointsGroup.add(startRing)
    }

    if (showEndPoint) {
      endPoint = this.createPointMarker(endPos, endPointColor, pointRadius)
      endPoint.visible = false
      this.pointsGroup.add(endPoint)
    }

    if (showEndRing) {
      endRing = this.createRing(endPos, endRingColor)
      endRing.scale.set(0.05, 0.05, 1)
      this.pointsGroup.add(endRing)
    }

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
      startRing,
      endRing,
      startRingPhase: 'growing',
      endRingPhase: 'waiting',
      phase: startDelay > 0 ? 'waiting' : 'animating',
    }

    this.activeArcs.set(id, activeArc)

    return id
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

  /**
   * Remove an arc by ID
   *
   * Stops and disposes an arc animation immediately, removing it from the globe
   *
   * @param {number} id - The arc ID returned from addArc()
   * @returns {void}
   */
  public removeArcById(id: number): void {
    const arc = this.activeArcs.get(id)
    if (arc) {
      this.disposeArc(arc)
      this.activeArcs.delete(id)
      if (this.onArcRemovedCallback) {
        this.onArcRemovedCallback(id, arc.options)
      }
    }
  }

  /**
   * Clear all arcs
   *
   * Removes and disposes all active arc animations from the globe
   *
   * @returns {void}
   */
  public clearAllArcs(): void {
    this.activeArcs.forEach((arc) => this.disposeArc(arc))
    this.activeArcs.clear()
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
    this.onArcRemovedCallback = callback
  }

  /**
   * Get count of active arcs
   *
   * Returns the number of currently active arc animations
   *
   * @returns {number} - The count of active arcs
   */
  public getActiveArcCount(): number {
    return this.activeArcs.size
  }

  /**
   * Dispose of the globe and clean up resources
   *
   * Clears all active arcs and disposes all geometries and materials to free GPU/CPU memory
   *
   * @returns {void}
   */
  public dispose(): void {
    this.activeArcs.forEach((arc) => this.disposeArc(arc))
    this.activeArcs.clear()

    // Dispose globe
    if (this.globe) {
      this.globe.geometry.dispose();
      (this.globe.material as MeshPhongMaterial).dispose()
    }

    // Dispose atmosphere
    if (this.atmosphereObj) {
      this.atmosphereObj.geometry.dispose()
      if (this.atmosphereObj.material instanceof ShaderMaterial) {
        this.atmosphereObj.material.dispose()
      }
    }

    // Dispose polygons
    this.polygonGroup.children.forEach((child) => {
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
}
