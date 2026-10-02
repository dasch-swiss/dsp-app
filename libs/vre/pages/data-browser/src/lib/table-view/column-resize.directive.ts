import { DestroyRef, Directive, ElementRef, inject, input, NgZone, output } from '@angular/core';

/**
 * Drags a column's right edge to resize it.
 *
 * Hand-rolled because Angular Material 21.2.9 ships no column-resize primitive. One exists in
 * `@angular/cdk-experimental`, which is neither a dependency of this repo nor covered by the CDK's
 * compatibility guarantee — adopting it would tie the Data tab to a package that may change shape
 * between patch releases.
 *
 * Put this on a thin element inside the `<th>`, not on the `<th>` itself: the whole header cell is
 * a `cdkDrag` for column reorder, and a pointer-down on the cell has to mean "move this column"
 * everywhere except on the few pixels that mean "resize it".
 *
 * The live width is written straight onto the `<th>`'s inline style rather than onto a CSS custom
 * property consumed by the generated `.mat-column-<key>` rule: MatTable derives that class name
 * from the column key, our keys are property IRIs, and a stylesheet cannot be authored ahead of
 * time for class names that only exist once an ontology is loaded. Under `table-layout: fixed` the
 * header cell's width is authoritative for the whole column anyway, so one inline write resizes it.
 */
/** How much one arrow-key press moves the edge. Coarse enough to be useful, fine enough to aim. */
const KEYBOARD_STEP_PX = 16;

@Directive({
  selector: '[appColumnResize]',
  host: {
    class: 'column-resize-handle',
    role: 'separator',
    'aria-orientation': 'vertical',
    // A focusable separator is the ARIA window-splitter pattern, and it is what makes the handle
    // reachable at all: the pointer gesture below has no keyboard equivalent, and resize would
    // otherwise be a mouse-only feature.
    tabindex: '0',
    'aria-keyshortcuts': 'ArrowLeft ArrowRight Home',
    '[attr.aria-valuenow]': 'width()',
    '[attr.aria-valuemin]': 'minWidth()',
    '(pointerdown)': 'onPointerDown($event)',
    '(dblclick)': 'onDoubleClick()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class ColumnResizeDirective {
  /** The column stops shrinking here, below which its header controls no longer fit. */
  readonly minWidth = input.required<number>();
  /** Where a double-click puts the column back to. */
  readonly defaultWidth = input.required<number>();
  /**
   * The width the host currently renders this column at.
   *
   * Only announced, never applied — the pointer gesture reads the live width off the DOM, because
   * during a drag the inline style is ahead of anything the host has been told about.
   */
  readonly width = input.required<number>();

  /**
   * Emitted once per gesture, on release — not per pointer move.
   *
   * The intermediate widths are already on screen, written directly to the DOM; emitting them as
   * well would run change detection over every cell of the table on every frame of the drag, and
   * would write a `localStorage` entry per frame once the host persists the layout.
   */
  readonly widthChanged = output<number>();

  private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _zone = inject(NgZone);

  private _cell?: HTMLElement;
  private _startX = 0;
  private _startWidth = 0;
  private _currentWidth = 0;
  private _stopTracking?: () => void;

  constructor() {
    inject(DestroyRef).onDestroy(() => this._stopTracking?.());
  }

  onPointerDown(event: PointerEvent): void {
    const cell = this._host.nativeElement.closest('th');
    if (!cell) {
      return;
    }

    this._cell = cell;
    this._startX = event.clientX;
    this._startWidth = cell.getBoundingClientRect().width;
    this._currentWidth = this._startWidth;

    // Without this the same pointer-down also starts the column's `cdkDrag`, and the user would be
    // dragging the column away while trying to widen it. `preventDefault` additionally suppresses
    // the text selection that a horizontal drag over a header otherwise produces.
    event.preventDefault();
    event.stopPropagation();

    // Capture, so the pointer may leave the 8px handle — which it does immediately — without the
    // gesture ending. It also means the move and up listeners can live on the handle rather than on
    // the document, so nothing survives a destroy mid-drag.
    this._host.nativeElement.setPointerCapture(event.pointerId);

    this._zone.runOutsideAngular(() => {
      const handle = this._host.nativeElement;
      const onMove = (moveEvent: PointerEvent) => this._resizeTo(moveEvent.clientX);
      const onEnd = () => this._commit();

      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onEnd);
      handle.addEventListener('pointercancel', onEnd);

      this._stopTracking = () => {
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onEnd);
        handle.removeEventListener('pointercancel', onEnd);
        this._stopTracking = undefined;
      };
    });
  }

  /** A column the user has fiddled with and wants back; cheaper to offer than an undo. */
  onDoubleClick(): void {
    this._applyWidth(this.defaultWidth());
    this.widthChanged.emit(this.defaultWidth());
  }

  /**
   * The keyboard equivalent of the drag: arrows nudge the edge, Home is the double-click.
   *
   * Each press commits, unlike the drag which commits once on release. A press is already a
   * discrete gesture, and holding the key down repeats it slowly enough that a persisted layout
   * write per repeat costs nothing.
   */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Home') {
      event.preventDefault();
      this.onDoubleClick();
      return;
    }

    const delta = event.key === 'ArrowLeft' ? -KEYBOARD_STEP_PX : event.key === 'ArrowRight' ? KEYBOARD_STEP_PX : 0;
    if (delta === 0) {
      return;
    }

    // Otherwise the arrow also scrolls the table sideways while the column is being sized.
    event.preventDefault();

    // Measured rather than taken from `width()`: a column the user has never resized renders at
    // its default, and the input is the only thing that knows that — but a column mid-session
    // carries an inline width the host may not have round-tripped yet.
    const current = this._host.nativeElement.closest('th')?.getBoundingClientRect().width ?? this.width();
    const next = Math.max(this.minWidth(), Math.round(current + delta));

    this._applyWidth(next);
    this.widthChanged.emit(next);
  }

  private _resizeTo(clientX: number): void {
    this._currentWidth = Math.max(this.minWidth(), this._startWidth + (clientX - this._startX));
    this._applyWidth(this._currentWidth);
  }

  private _commit(): void {
    this._stopTracking?.();

    if (!this._cell) {
      return;
    }
    this._cell = undefined;

    // Back into the zone: the emission updates the persisted layout, which has to be seen by the
    // bindings that render the column's width from now on.
    this._zone.run(() => this.widthChanged.emit(Math.round(this._currentWidth)));
  }

  private _applyWidth(width: number): void {
    const cell = this._cell ?? this._host.nativeElement.closest('th');
    if (cell) {
      cell.style.width = `${Math.round(width)}px`;
    }
  }
}
