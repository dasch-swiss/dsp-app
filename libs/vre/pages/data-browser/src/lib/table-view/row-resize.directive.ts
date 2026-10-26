import { DestroyRef, Directive, ElementRef, inject, input, NgZone, output } from '@angular/core';

const KEYBOARD_STEP_PX = 16;

/**
 * Drags a row's bottom edge to resize it, the counterpart of {@link ColumnResizeDirective}. Put it
 * on a thin element inside the sticky label cell, not the `<tr>`.
 *
 * The height is written to the `<tr>` as `height` (grows a short row) and `--row-cap` (caps a tall
 * one, since a row's `height` is only a minimum); `ScrollWhenTallerDirective` decides which cells scroll.
 */
@Directive({
  selector: '[appRowResize]',
  host: {
    class: 'row-resize-handle',
    role: 'separator',
    'aria-orientation': 'horizontal',
    // A focusable separator (ARIA window-splitter) keeps resize reachable without a pointer.
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
  readonly minHeight = input.required<number>();
  /** The row's set height, for the announcement only; undefined while the row hugs its content. */
  readonly height = input.required<number | undefined>();
  /**
   * What the row falls back to once its own height is cleared (the View-options height, or
   * undefined for Auto); applied here because Angular would not rewrite an unchanged binding.
   */
  readonly fallbackHeight = input<number | undefined>(undefined);

  /** Emitted once per gesture on release and once per key press, not per pointer move. */
  readonly heightChanged = output<number>();
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

    // Otherwise the drag also selects text.
    event.preventDefault();
    event.stopPropagation();

    // Capture lets the pointer leave the 6px handle mid-drag and keeps the listeners on the handle.
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

  onDoubleClick(): void {
    this._applyHeight(this.fallbackHeight());
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

    // Otherwise the arrow also scrolls the table.
    event.preventDefault();

    const current = this._host.nativeElement.closest('tr')?.getBoundingClientRect().height ?? this.minHeight();
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

    // A click without a drag must not pin the row to its measured height.
    if (Math.round(this._currentHeight) === Math.round(this._startHeight)) {
      return;
    }

    // Back into the zone: the emission drives the host's rendered row height.
    this._zone.run(() => this.heightChanged.emit(Math.round(this._currentHeight)));
  }

  private _applyHeight(height: number | undefined): void {
    const row = this._row ?? this._host.nativeElement.closest('tr');
    if (!row) {
      return;
    }

    // Clearing stops the dragged value lingering until the template bindings take over again.
    if (height === undefined) {
      row.style.removeProperty('height');
      row.style.removeProperty('--row-cap');
      return;
    }

    row.style.height = `${Math.round(height)}px`;
    row.style.setProperty('--row-cap', `${Math.round(height)}px`);
  }
}
