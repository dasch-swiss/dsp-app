import { DestroyRef, Directive, ElementRef, inject, input, NgZone, output } from '@angular/core';

/**
 * Drags a row's bottom edge to resize it, the counterpart of {@link ColumnResizeDirective}.
 *
 * Put this on a thin element inside the sticky label cell, not on the `<tr>`: the row carries a
 * click that selects the resource, and a pointer-down on it has to keep meaning that everywhere
 * except on the few pixels that mean "resize". The label cell is the right host because it is the
 * one cell always on screen, however far the table is scrolled sideways.
 *
 * The height is written as a custom property on the `<tr>` rather than as a `height`, because it
 * has to do two jobs at once: grow a short row, and cap a tall one. `height` on a table row is
 * only ever a minimum — a row cannot be made shorter than its content that way — so the cells
 * read the same variable to cap and scroll their own content. See `.is-row-sized` in the
 * component's stylesheet.
 */
/** How much one arrow-key press moves the edge. Matches the column handle's step. */
const KEYBOARD_STEP_PX = 16;

@Directive({
  selector: '[appRowResize]',
  host: {
    class: 'row-resize-handle',
    role: 'separator',
    'aria-orientation': 'horizontal',
    // The ARIA window-splitter pattern, and what makes the handle reachable at all: the pointer
    // gesture has no keyboard equivalent, so without this, resizing is a mouse-only feature.
    tabindex: '0',
    'aria-keyshortcuts': 'ArrowUp ArrowDown Home',
    '[attr.aria-valuenow]': 'height()',
    '[attr.aria-valuemin]': 'minHeight()',
    '(pointerdown)': 'onPointerDown($event)',
    '(dblclick)': 'onDoubleClick()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class RowResizeDirective {
  /** Below this a row has no room for even one line plus its padding. */
  readonly minHeight = input.required<number>();
  /** The row's current height, for the announcement only. */
  readonly height = input.required<number>();

  /**
   * Emitted once per gesture on release, and once per key press.
   *
   * Not per pointer move: the intermediate heights are already on screen, written straight to the
   * DOM, and emitting them too would run change detection over every cell of the table on every
   * frame of the drag.
   */
  readonly heightChanged = output<number>();
  /** Double-click or Home: give the row back to its content. */
  readonly heightReset = output<void>();

  private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _zone = inject(NgZone);

  private _row?: HTMLElement;
  private _startY = 0;
  private _startHeight = 0;
  private _currentHeight = 0;
  private _stopTracking?: () => void;

  constructor() {
    inject(DestroyRef).onDestroy(() => this._stopTracking?.());
  }

  onPointerDown(event: PointerEvent): void {
    const row = this._host.nativeElement.closest('tr');
    if (!row) {
      return;
    }

    this._row = row;
    this._startY = event.clientY;
    this._startHeight = row.getBoundingClientRect().height;
    this._currentHeight = this._startHeight;

    // Otherwise the same pointer-down selects the row, and the user watches the viewer change
    // while trying to make a row taller.
    event.preventDefault();
    event.stopPropagation();

    // Capture, so the pointer may leave the 6px handle — which it does immediately — without the
    // gesture ending, and so the listeners can live on the handle rather than on the document.
    this._host.nativeElement.setPointerCapture(event.pointerId);

    this._zone.runOutsideAngular(() => {
      const handle = this._host.nativeElement;
      const onMove = (moveEvent: PointerEvent) => this._resizeTo(moveEvent.clientY);
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

  /** Back to whatever the content asks for, which is cheaper to offer than an undo. */
  onDoubleClick(): void {
    this._applyHeight(undefined);
    this.heightReset.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Home') {
      event.preventDefault();
      this.onDoubleClick();
      return;
    }

    const delta = event.key === 'ArrowUp' ? -KEYBOARD_STEP_PX : event.key === 'ArrowDown' ? KEYBOARD_STEP_PX : 0;
    if (delta === 0) {
      return;
    }

    // Otherwise the arrow also scrolls the table while the row is being sized.
    event.preventDefault();

    const current = this._host.nativeElement.closest('tr')?.getBoundingClientRect().height ?? this.height();
    const next = Math.max(this.minHeight(), Math.round(current + delta));

    this._applyHeight(next);
    this.heightChanged.emit(next);
  }

  private _resizeTo(clientY: number): void {
    this._currentHeight = Math.max(this.minHeight(), this._startHeight + (clientY - this._startY));
    this._applyHeight(this._currentHeight);
  }

  private _commit(): void {
    this._stopTracking?.();

    if (!this._row) {
      return;
    }
    this._row = undefined;

    // Back into the zone: the emission is what the host renders the row's height from afterwards.
    this._zone.run(() => this.heightChanged.emit(Math.round(this._currentHeight)));
  }

  private _applyHeight(height: number | undefined): void {
    const row = this._row ?? this._host.nativeElement.closest('tr');
    if (!row) {
      return;
    }

    if (height === undefined) {
      row.style.removeProperty('--row-height');
      row.classList.remove('is-row-sized');
      return;
    }

    row.style.setProperty('--row-height', `${Math.round(height)}px`);
    row.classList.add('is-row-sized');
  }
}
