import { DestroyRef, Directive, ElementRef, inject, input, NgZone, output } from '@angular/core';

const KEYBOARD_STEP_PX = 16;

/** Width a column is laid out at while its content is measured, so nothing wraps. */
const FIT_PROBE_WIDTH_PX = 2000;
/** Upper bound of a fitted column. */
const FIT_MAX_WIDTH_PX = 480;
/** The header's sort, filter and pin buttons, which appear beside the name on hover. */
const FIT_HEADER_CONTROLS_PX = 70;
/** A value's hover actions (Edit, Move, Delete) and the gaps around them. */
const FIT_VALUE_ACTIONS_PX = 96;
const ACTIONABLE_CELL = 'app-table-property-cell, app-editable-resource-authorship, app-editable-resource-label';

function contentRight(element: Element): number {
  let right = 0;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node instanceof Text) {
      if (!node.data.trim()) {
        continue;
      }
      range.selectNodeContents(node);
      for (const rect of Array.from(range.getClientRects())) {
        right = Math.max(right, rect.right);
      }
    } else if (node instanceof HTMLImageElement) {
      right = Math.max(right, node.getBoundingClientRect().right);
    }
  }
  return right;
}

function neededWidth(cell: HTMLTableCellElement, extra: number): number {
  const right = contentRight(cell);
  if (right === 0) {
    return 0;
  }
  const paddingRight = parseFloat(getComputedStyle(cell).paddingRight) || 0;
  return right - cell.getBoundingClientRect().left + paddingRight + extra;
}

/**
 * Drags a column's right edge to resize it. Hand-rolled because Material ships no column-resize
 * primitive.
 *
 * Put it on a thin element inside the `<th>`, not on the `<th>`, which is the `cdkDrag` for column
 * reorder. The live width is written to the `<th>`'s inline style because MatTable derives
 * `.mat-column-<key>` class names from property IRIs, which no stylesheet can be authored for;
 * under `table-layout: fixed` the header width is authoritative for the column.
 */
@Directive({
  selector: '[appColumnResize]',
  host: {
    class: 'column-resize-handle',
    role: 'separator',
    'aria-orientation': 'vertical',
    // A focusable separator (ARIA window-splitter) keeps resize reachable without a pointer.
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
  readonly defaultWidth = input.required<number>();
  /** The width the host renders the column at; only announced, since a drag reads the live width off the DOM. */
  readonly width = input.required<number>();

  /** Emitted once per gesture, on release, so a drag does not run change detection or write storage per frame. */
  readonly widthChanged = output<number>();

  /** Home: the column goes back to its default, which the host stores as no width at all. */
  readonly widthReset = output<void>();

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

    // Stops the same pointer-down starting the column's `cdkDrag`; `preventDefault` suppresses text selection.
    event.preventDefault();
    event.stopPropagation();

    // Capture lets the pointer leave the 8px handle mid-drag and keeps the listeners on the handle, so none outlive a destroy.
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

  /**
   * Fit the column to its widest header or value on this page, within the column's minimum and
   * {@link FIT_MAX_WIDTH_PX}. Measured with the column briefly laid out wide, and restored before paint.
   */
  onDoubleClick(): void {
    const header = this._host.nativeElement.closest('th');
    const table = header?.closest('table');
    if (!header || !table) {
      return;
    }

    const previous = header.style.width;
    header.style.width = `${FIT_PROBE_WIDTH_PX}px`;

    let needed = neededWidth(header, FIT_HEADER_CONTROLS_PX);
    for (const row of Array.from(table.tBodies).flatMap(body => Array.from(body.rows))) {
      const cell = row.cells[header.cellIndex];
      if (cell) {
        needed = Math.max(needed, neededWidth(cell, cell.querySelector(ACTIONABLE_CELL) ? FIT_VALUE_ACTIONS_PX : 0));
      }
    }

    header.style.width = previous;
    const next = Math.round(Math.min(FIT_MAX_WIDTH_PX, Math.max(this.minWidth(), needed)));
    this._applyWidth(next);
    this.widthChanged.emit(next);
  }

  resetToDefault(): void {
    this._applyWidth(this.defaultWidth());
    this.widthReset.emit();
  }

  /** Arrows nudge the edge and Home restores the default; each press commits, unlike a drag. */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Home') {
      event.preventDefault();
      this.resetToDefault();
      return;
    }

    const delta = event.key === 'ArrowLeft' ? -KEYBOARD_STEP_PX : event.key === 'ArrowRight' ? KEYBOARD_STEP_PX : 0;
    if (delta === 0) {
      return;
    }

    // Otherwise the arrow also scrolls the table sideways.
    event.preventDefault();

    // Measured, not `width()`: the inline width may be ahead of what the host has round-tripped.
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

    // A click without a drag must not store the measured width, which may be an open editor's temporary one.
    if (Math.round(this._currentWidth) === Math.round(this._startWidth)) {
      return;
    }

    // Back into the zone so the bindings that render the width see the persisted layout.
    this._zone.run(() => this.widthChanged.emit(Math.round(this._currentWidth)));
  }

  private _applyWidth(width: number): void {
    const cell = this._cell ?? this._host.nativeElement.closest('th');
    if (cell) {
      cell.style.width = `${Math.round(width)}px`;
    }
  }
}
