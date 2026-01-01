import {
  Color,
  Fog,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EventGlobe } from '@event-globe/core'
import type { ArcOptions, GlobeConfig } from '@event-globe/core'

/**
 * Configuration options for the EventGlobeRenderer
 */
export interface EventGlobeRendererConfig {
  /**
   * Enable automatic rotation of the globe
   * @default true
   */
  autoRotate?: boolean

  /**
   * Speed of auto-rotation
   * @default 0.3
   */
  autoRotateSpeed?: number

  /**
   * Allow manual rotation with mouse/touch
   * @default true
   */
  manualRotate?: boolean

  /**
   * Background color of the Three.js scene (hex number)
   * @default 0xffffff
   */
  sceneBackgroundColor?: number

  /**
   * Fog color for depth effect (hex number)
   * @default 0x535ef3
   */
  sceneFogColor?: number

  /**
   * Distance where fog starts
   * @default 400
   */
  sceneFogNear?: number

  /**
   * Distance where fog is fully opaque
   * @default 2000
   */
  sceneFogFar?: number

  /**
   * Globe configuration options (passed to EventGlobe)
   * @default {} (EventGlobe defaults will be used)
   */
  globe?: GlobeConfig
}

/**
 * EventGlobeRenderer - A complete managed globe renderer
 *
 * This class handles the full Three.js setup including scene, camera, renderer,
 * controls, and render loop. It internally uses EventGlobe for the globe visualization.
 *
 * Use this for standalone globe rendering in an HTML container.
 * For framework integration, use EventGlobe directly.
 *
 * @example
 * ```typescript
 * const container = document.getElementById('globe-container');
 * const renderer = new EventGlobeRenderer(container, {
 *   globeColor: '#3a228a',
 *   autoRotate: true,
 * });
 *
 * renderer.addArc({
 *   startLat: 40.7128, startLng: -74.0060,
 *   endLat: 51.5074, endLng: -0.1278,
 * });
 * ```
 */
export class EventGlobeRenderer {
  private container: HTMLElement
  private renderer: WebGLRenderer
  private scene: Scene
  private camera: PerspectiveCamera
  private orbitControls: OrbitControls
  private globe: EventGlobe
  private animationFrameId?: number
  private resizeObserver?: ResizeObserver

  private readonly defaultRendererConfig: Required<EventGlobeRendererConfig> = {
    autoRotate: true,
    autoRotateSpeed: 0.3,
    manualRotate: true,
    sceneBackgroundColor: 0xFFFFFF,
    sceneFogColor: 0x535EF3,
    sceneFogNear: 400,
    sceneFogFar: 2000,
    globe: {},
  }

  private config: Required<EventGlobeRendererConfig>

  /**
   * Create a new EventGlobeRenderer instance
   *
   * @param container The HTML element to render the globe into
   * @param config Configuration options
   */
  constructor(container: HTMLElement, config?: EventGlobeRendererConfig) {
    this.container = container
    this.config = { ...this.defaultRendererConfig, ...config }

    // Initialize Three.js components
    this.renderer = this.initRenderer()
    this.scene = this.initScene()
    this.camera = this.initCamera()
    this.orbitControls = this.initControls()

    // Create the globe
    this.globe = new EventGlobe(config?.globe)
    this.scene.add(this.globe)

    // Setup resize observer
    this.setupResizeObserver()

    // Start render loop
    this.animate()
  }

  /**
   * Initialize the WebGL renderer
   */
  private initRenderer(): WebGLRenderer {
    let width = this.container.clientWidth || 400
    let height = this.container.clientHeight || 400

    if (width === 0 || height === 0) {
      const parent = this.container.parentElement
      width = parent?.clientWidth || 400
      height = parent?.clientHeight || 400
    }

    const renderer = new WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    this.container.appendChild(renderer.domElement)

    return renderer
  }

  /**
   * Initialize the Three.js scene
   */
  private initScene(): Scene {
    const scene = new Scene()
    scene.background = new Color(this.config.sceneBackgroundColor)
    scene.fog = new Fog(
      this.config.sceneFogColor,
      this.config.sceneFogNear,
      this.config.sceneFogFar,
    )

    return scene
  }

  /**
   * Initialize the camera
   */
  private initCamera(): PerspectiveCamera {
    const width = this.container.clientWidth || 400
    const height = this.container.clientHeight || 400

    const camera = new PerspectiveCamera(45, width / height, 1, 2000)
    camera.position.z = 400

    return camera
  }

  /**
   * Initialize orbit controls
   */
  private initControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.autoRotate = this.config.autoRotate
    controls.autoRotateSpeed = this.config.autoRotateSpeed
    controls.enableRotate = this.config.manualRotate
    controls.enablePan = false
    controls.enableZoom = true
    controls.minDistance = 200
    controls.maxDistance = 600
    controls.minPolarAngle = Math.PI / 3.5
    controls.maxPolarAngle = Math.PI - Math.PI / 3

    return controls
  }

  /**
   * Setup resize observer to handle container size changes
   */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize()
    })
    this.resizeObserver.observe(this.container)
  }

  /**
   * Handle container resize
   */
  private handleResize(): void {
    const width = this.container.clientWidth
    const height = this.container.clientHeight

    if (width === 0 || height === 0) {
      return
    }

    this.renderer.setSize(width, height)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate)

    // Update globe (arcs, animations)
    this.globe.update()

    // Update controls
    this.orbitControls.update()

    // Render scene
    this.renderer.render(this.scene, this.camera)
  }

  // ============ PUBLIC API ============

  /**
   * Add an arc animation to the globe
   *
   * @param options Arc configuration options
   * @returns Arc ID for reference
   */
  public addArc(options: ArcOptions): number {
    return this.globe.addArc(options)
  }

  /**
   * Remove an arc by ID
   *
   * @param id The arc ID to remove
   */
  public removeArcById(id: number): void {
    this.globe.removeArcById(id)
  }

  /**
   * Clear all arcs
   */
  public clearAllArcs(): void {
    this.globe.clearAllArcs()
  }

  /**
   * Get count of active arcs
   */
  public getActiveArcCount(): number {
    return this.globe.getActiveArcCount()
  }

  /**
   * Set callback for when an arc is removed
   *
   * @param callback Function to call when an arc is removed, receives arc ID and original options
   */
  public onArcRemoved(callback: (id: number, options: ArcOptions) => void): void {
    this.globe.onArcRemoved(callback)
  }

  /**
   * Update the globe configuration
   *
   * @param config New configuration options
   */
  public updateConfig(config: EventGlobeRendererConfig): void {
    this.config = { ...this.config, ...config }

    // Apply renderer settings
    if (config.autoRotate !== undefined) {
      this.orbitControls.autoRotate = config.autoRotate
    }
    if (config.autoRotateSpeed !== undefined) {
      this.orbitControls.autoRotateSpeed = config.autoRotateSpeed
    }
    if (config.manualRotate !== undefined) {
      this.orbitControls.enableRotate = config.manualRotate
    }
    if (config.sceneBackgroundColor !== undefined) {
      this.scene.background = new Color(config.sceneBackgroundColor)
    }
    if (config.sceneFogColor !== undefined || config.sceneFogNear !== undefined || config.sceneFogFar !== undefined) {
      this.scene.fog = new Fog(
        this.config.sceneFogColor,
        this.config.sceneFogNear,
        this.config.sceneFogFar,
      )
    }

    // Update globe config if provided
    if (config.globe) {
      this.globe.updateConfig(config.globe)
    }
  }

  /**
   * Destroy the renderer and clean up resources
   */
  public destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }

    this.globe.dispose()

    this.renderer.dispose()
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }

    this.orbitControls.dispose()
  }

  /**
   * Symbol.dispose for automatic cleanup with `using` keyword
   */
  [Symbol.dispose](): void {
    this.destroy()
  }
}
