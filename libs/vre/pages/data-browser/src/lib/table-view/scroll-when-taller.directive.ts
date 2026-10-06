import { AfterViewInit, Directive, ElementRef, inject, Input, NgZone, OnChanges, OnDestroy } from '@angular/core';

/**
 * Caps a cell's content and lets it scroll, but only once it is genuinely taller than the cap.
 *
 * A plain `max-height` plus `overflow-y: auto` would be enough if the only thing inside a cell
 * were its values. It is not: the resource editor's hover action bubble is absolutely positioned
 * 8px below the value's top and stands about 28px tall, so in a 28px cell it reaches ~12px past
 * the bottom. Absolute positioning means it does not grow the box — but it does count as
 * scrollable overflow, so every short cell became scrollable the moment it was hovered, with
 * nothing to scroll. In the viewer's generously padded rows the bubble never escapes, which is why
 * the component it comes from has never had to care.
 *
 * Height is not something CSS can branch on, so the decision is measured here and expressed as a
 * class. Cells that do not need it are left alone entirely — not a scroll container at all, so the
 * bubble is free to overhang exactly as it does in the viewer.
 *
 * The cap moves: it is the row's own dragged height, else the View-options row height, and when
 * neither is set there is no cap and nothing is marked. So the class is re-decided whenever the
 * cap changes, in both directions. That cannot
 * oscillate, because `scrollHeight` reports the content's height whether the cell is capped or
 * not — capping changes what is visible, never what is measured.
 *
 * Between cap changes the observer only ever adds the class. Content that arrives late — a link
 * viewer resolving its label, an image settling — can make a cell tall; nothing short of a cap
 * change can make it short again, and treating a resize as a reason to un-cap would let the hover
 * bubble's overhang flip a borderline cell back and forth under the pointer.
 */
@Directive({
  selector: '[appScrollWhenTaller]',
})
export class ScrollWhenTallerDirective implements AfterViewInit, OnChanges, OnDestroy {
  /** Height in pixels past which the cell is capped, or undefined for no cap at all. */
  @Input({ required: true, alias: 'appScrollWhenTaller' }) maxHeight!: number | undefined;

  private readonly _host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly _zone = inject(NgZone);
  private _observer?: ResizeObserver;
  private _viewReady = false;

  ngOnChanges() {
    // The first change arrives before the cell has laid out; `ngAfterViewInit` takes that one.
    if (this._viewReady) {
      this._decide();
    }
  }

  ngAfterViewInit() {
    this._viewReady = true;
    this._decide();

    // Outside the zone because this fires on every layout pass and only ever toggles a class.
    this._zone.runOutsideAngular(() => {
      this._observer = new ResizeObserver(() => {
        if (this._isTaller()) {
          this._host.classList.add('is-capped');
        }
      });
      this._observer.observe(this._host);
    });
  }

  ngOnDestroy() {
    this._observer?.disconnect();
  }

  private _decide() {
    this._host.classList.toggle('is-capped', this._isTaller());
  }

  private _isTaller(): boolean {
    return this.maxHeight !== undefined && this._host.scrollHeight > this.maxHeight;
  }
}
