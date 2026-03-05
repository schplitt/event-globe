import type {
  AfterViewInit,
  ElementRef,
  OnDestroy,
} from '@angular/core'
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core'
import { EventGlobeRenderer } from '@event-globe/ts'
import type { ArcOptions, EventGlobeRendererConfig } from '@event-globe/ts'

@Component({
  selector: 'event-globe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #container style="width: 100%; height: 100%;"></div>`,
})
export class EventGlobeComponent implements AfterViewInit, OnDestroy {
  readonly config = input<EventGlobeRendererConfig>()
  readonly arcRemoved = output<{ id: number, options: ArcOptions }>()

  private readonly containerRef = viewChild.required<ElementRef<HTMLDivElement>>('container')
  private renderer: EventGlobeRenderer | null = null

  constructor() {
    effect(() => {
      const cfg = this.config()
      if (this.renderer && cfg) {
        this.renderer.updateConfig(cfg)
      }
    })
  }

  ngAfterViewInit(): void {
    this.renderer = new EventGlobeRenderer(
      this.containerRef().nativeElement,
      this.config(),
    )
    this.renderer.onArcRemoved((id, options) => {
      this.arcRemoved.emit({ id, options })
    })
  }

  ngOnDestroy(): void {
    this.renderer?.destroy()
    this.renderer = null
  }

  addArc(options: ArcOptions): number {
    return this.renderer?.addArc(options) ?? -1
  }

  getActiveArcCount(): number {
    return this.renderer?.getActiveArcCount() ?? 0
  }

  removeArcById(id: number): void {
    this.renderer?.removeArcById(id)
  }

  clearAllArcs(): void {
    this.renderer?.clearAllArcs()
  }
}
