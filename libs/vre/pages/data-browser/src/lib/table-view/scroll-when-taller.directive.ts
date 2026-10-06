import { AfterViewInit, Directive, ElementRef, inject, Input, NgZone, OnDestroy } from '@angular/core';

/**
 * Caps a cell's content and lets it scroll, but only once it is genuinely taller than the cap.
 *
 * A plain `max-height` plus `overflow-y: auto` would be enough if the only thing inside a cell
 * were its values. It is not: the resource editor's hover action bubble is absolutely positioned
 * 8px below the value's top and stands about 28px tall, so in a 28px compact cell it reaches
 * ~12px past the bottom. Absolute positioning means it does not grow the box — but it does count
 * as scrollable overflow, so every short cell became scrollable the moment it was hovered, with
 * nothing to scroll. In the viewer's generously padded rows the bubble never escapes, which is
 * why the component it comes from has never had to care.
 *
 * Height is not something CSS can branch on, so the decision is measured here and expressed as a
 * class. Cells that do not need it are left alone entirely — not a scroll container at all, so
 * the bubble is free to overhang exactly as it does in the viewer.
 *
 * The class is only ever added, never removed. Removing it would mean un-capping to re-measure,
 * which would re-cap on the next frame and oscillate; and a row whose values actually change is
 * rebuilt by `buildRows`, which brings a fresh element and a fresh measurement with it.
 */
@Directive({
  selector: '[appScrollWhenTaller]',
})
export class ScrollWhenTallerDirective implements AfterViewInit, OnDestroy {
  /** Height in pixels past which the cell is capped. */
  @Input({ required: true, alias: 'appScrollWhenTaller' }) maxHeight!: number;

  private readonly _host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly _zone = inject(NgZone);
  private _observer?: ResizeObserver;

  ngAfterViewInit() {
    this._apply();

    // Values arrive after the first paint often enough — a link viewer resolving its label, an
    // image settling — that one measurement at init is not enough. Outside the zone because this
    // fires on every layout pass and only ever toggles a class.
    this._zone.runOutsideAngular(() => {
      this._observer = new ResizeObserver(() => this._apply());
      this._observer.observe(this._host);
    });
  }

  ngOnDestroy() {
    this._observer?.disconnect();
  }

  private _apply() {
    // `scrollHeight` while uncapped is the content's natural height. Once capped it stays above
    // the cap, so the check is stable and the work stops after the first positive.
    if (this._host.scrollHeight > this.maxHeight) {
      this._host.classList.add('is-capped');
      this._observer?.disconnect();
    }
  }
}
