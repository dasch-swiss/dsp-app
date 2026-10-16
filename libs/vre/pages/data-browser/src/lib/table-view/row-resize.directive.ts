import { DestroyRef, Directive, ElementRef, inject, input, NgZone, output } from '@angular/core';

/**
 * Drags a row's bottom edge to resize it, the counterpart of {@link ColumnResizeDirective}.
 *
 * Put this on a thin element inside the sticky label cell, not on the `<tr>`: a pointer-down on a
 * cell's values has to keep meaning what it means in the viewer everywhere except on the few pixels
 * that mean "resize". The label cell is the right host because it is the one cell always on screen,
 * however far the table is scrolled sideways.
 *
 * During the drag the height is written straight onto the `<tr>`, as the same two properties the
 * component's template binds once the gesture is committed: a `height`, which grows a short row,
 * and `--row-cap`, which caps a tall one. Two because `height` on a table row is only ever a
 * minimum — a row cannot be made shorter than its content that way — so the cells that are taller
 * than the cap scroll instead. Which cells those are is `ScrollWhenTallerDirective`'s decision;
 * capping every cell of the row would make the short ones scroll containers too, and the editor's
 * hover bubble would give each of them a scrollbar with nothing to scroll.
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

    // Otherwise the drag also selects the text of the rows it passes over.
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

    // On reset the template's bindings take over again on the next pass, from the row height the
    // rest of the table uses; clearing here just stops the dragged value lingering until then.
    if (height === undefined) {
      row.style.removeProperty('height');
      row.style.removeProperty('--row-cap');
      return;
    }

    row.style.height = `${Math.round(height)}px`;
    row.style.setProperty('--row-cap', `${Math.round(height)}px`);
  }
}
