/* eslint-disable no-console */
import type { OnDestroy, OnInit } from '@angular/core'
import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core'
import { EventGlobeComponent } from '@event-globe/angular'
import type { ArcOptions } from '@event-globe/angular'

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EventGlobeComponent],
  template: `
    <event-globe #globe [config]="{ autoRotate: false }" style="width: 100%; height: 100vh" />
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  readonly globeRef = viewChild.required(EventGlobeComponent)

  private interval: ReturnType<typeof setInterval> | null = null

  ngOnInit(): void {
    this.interval = setInterval(() => {
      const arc: ArcOptions = {
        startLat: Math.random() * 180 - 90,
        startLng: Math.random() * 360 - 180,
        endLat: Math.random() * 180 - 90,
        endLng: Math.random() * 360 - 180,
        color: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
        showStartRing: true,
        showEndRing: true,
      }

      this.globeRef().addArc(arc)
      console.log('Added arc:', arc)
      console.log('Active arcs:', this.globeRef().getActiveArcCount())
    }, 2000)
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval)
    }
  }
}
