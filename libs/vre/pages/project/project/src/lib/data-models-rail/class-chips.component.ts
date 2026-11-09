import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DataModelsRailState } from './data-models-rail-state';
import { HighlightPipe } from './highlight.pipe';

/**
 * Classes as chips in their colors on one line: condensed, the first `max` and a count of the others; expanded, every
 * one, wrapping. A dash when there is none. A clicked chip asks to open its class.
 */
@Component({
  selector: 'app-class-chips',
  imports: [HighlightPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="cut">
      @for (iri of shown(); track iri) {
        <button
          type="button"
          class="chip"
          data-cy="class-chip"
          [class.on]="iri === selected()"
          [style.background]="state.colors().get(iri) ?? '#F3F4F6'"
          (click)="$event.stopPropagation(); classSelected.emit(iri)"
          (keydown.enter)="$event.stopPropagation()">
          @for (part of state.labelOf(iri) | highlight: highlight(); track $index) {
            @if (part.match) {
              <mark>{{ part.text }}</mark>
            } @else {
              <span>{{ part.text }}</span>
            }
          }
        </button>
      } @empty {
        <span class="none">—</span>
      }
    </span>
    @if (hiddenCount()) {
      <span class="more">+{{ hiddenCount() }}</span>
    }
  `,
  host: { '[class.expanded]': 'expanded()' },
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      // A line of chips, cut at the cell's edge; the "+N" after them always shows.
      :host {
        display: flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
      }

      .cut {
        flex: 0 1 auto;
        min-width: 0;
        display: flex;
        gap: 4px;
        overflow: hidden;
      }

      :host(.expanded) {
        align-items: flex-start;

        .cut {
          flex-wrap: wrap;
          overflow: visible;
        }
      }

      .chip {
        flex: none;
        padding: 0 6px;
        border: 0;
        border-radius: 4px;
        font: inherit;
        font-size: 11px;
        line-height: 18px;
        color: #1f2937;
        cursor: pointer;

        &:hover,
        &:focus-visible {
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.35);
        }

        &.on {
          box-shadow: inset 0 0 0 1.5px $primary;
        }
      }

      .more {
        flex: none;
        padding: 0 4px;
        font-size: 12px;
        font-weight: 500;
        color: $primary;
      }

      .none {
        color: $cool_gray_400;
      }

      mark {
        border-radius: 2px;
        background: #fde68a;
        color: inherit;
      }
    `,
  ],
})
export class ClassChipsComponent {
  readonly state = inject(DataModelsRailState);

  /** The classes' IRIs. */
  readonly iris = input.required<string[]>();
  /** How many a condensed line shows. */
  readonly max = input(2);
  readonly expanded = input(false);
  /** What a search looks for, marked in the class names. */
  readonly highlight = input<readonly string[]>([]);
  /** The class whose panel is open, its chip outlined. */
  readonly selected = input<string>();

  readonly classSelected = output<string>();

  readonly shown = computed(() => (this.expanded() ? this.iris() : this.iris().slice(0, this.max())));
  readonly hiddenCount = computed(() => this.iris().length - this.shown().length);
}
