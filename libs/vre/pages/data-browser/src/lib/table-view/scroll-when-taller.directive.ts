import { AfterViewInit, Directive, ElementRef, inject, Input, NgZone, OnChanges, OnDestroy } from '@angular/core';

/**
 * Caps a cell's content and lets it scroll, but only once it is genuinely taller than the cap.
 *
 * The cell must not be a scroll container when short: the editor's absolutely positioned hover
 * bubble counts as scrollable overflow and would make every short cell scrollable. The class is
 * re-decided on every cap change; between changes the observer only adds it, so a borderline cell
 * cannot flip back and forth under the pointer.
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
    // The first change arrives before layout; `ngAfterViewInit` takes that one.
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
