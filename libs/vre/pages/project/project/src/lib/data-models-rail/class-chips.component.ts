import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DataModelsRailState } from './data-models-rail-state';
import { HighlightPipe } from './highlight.pipe';

/**
 * Classes as chips on one line, each white with its colour in a tab at its left, as the Diagram draws a class with
 * "Colour as a tab": condensed, the first `max` and a count of the others; expanded, every one, wrapping. A dash when
 * there is none. A clicked chip asks to open its class.
 */
@Component({
  selector: 'app-class-chips',
  imports: [HighlightPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="cut">
      @for (iri of shown(); track iri) {
        <span class="chip" data-cy="class-chip">
          <span class="label">
            @for (part of state.labelOf(iri) | highlight: highlight(); track $index) {
              @if (part.match) {
                <mark>{{ part.text }}</mark>
              } @else {
                <span>{{ part.text }}</span>
              }
            }
          </span>
        </span>
      } @empty {
        <span class="none">—</span>
      }
    </span>
    @if (hiddenCount()) {
      <span class="more">+{{ hiddenCount() }}</span>
    }
  `,
  host: { '[class.expanded]': 'expanded()' },
  styleUrl: './class-chips.component.css',
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

  readonly shown = computed(() => (this.expanded() ? this.iris() : this.iris().slice(0, this.max())));
  readonly hiddenCount = computed(() => this.iris().length - this.shown().length);
}
