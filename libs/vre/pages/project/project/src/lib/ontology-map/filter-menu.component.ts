import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

/** One choice of a filter menu: a class or a link property. */
export interface FilterOption {
  id: string;
  label: string;
  /** The name in the data model, such as `linkToVideo`: found by the search and shown under the label. */
  name?: string;
  /** The class's colour in the graph, if any. */
  color?: string;
  /** A count shown after the label, such as the links through a property. */
  count?: number;
}

/** How many unticked choices the footer names, rather than counting them. */
const NAMED_HIDDEN = 3;

/**
 * The content of a filter menu over many choices: find them by name, tick or untick all of them, or the ones found,
 * at once, or keep only one. Emits the choices left ticked; the page decides what the graph shows.
 */
@Component({
  selector: 'app-filter-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatCheckbox,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatPrefix,
    MatSuffix,
    TranslatePipe,
  ],
  // Clicks and keys stay in the menu, so it stays open and typing does not jump between its items.
  host: { '(click)': '$event.stopPropagation()', '(keydown)': 'onKeydown($event)' },
  template: `
    @let f = 'pages.ontologyMap.filterMenu';
    <div class="head">
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
        <mat-icon matPrefix>search</mat-icon>
        <input
          #search
          matInput
          data-cy="filter-menu-search"
          [placeholder]="f + '.search' | translate"
          [attr.aria-label]="f + '.search' | translate"
          [value]="query()"
          (input)="query.set(search.value)" />
        @if (query()) {
          <button
            mat-icon-button
            matSuffix
            [attr.aria-label]="f + '.clearSearch' | translate"
            (click)="query.set(''); search.focus()">
            <mat-icon>close</mat-icon>
          </button>
        }
      </mat-form-field>
      <div class="bulk">
        <mat-checkbox
          data-cy="filter-menu-all"
          [checked]="bulkState() === 'all'"
          [indeterminate]="bulkState() === 'some'"
          [disabled]="matches().length === 0"
          (change)="toggleMatches()">
          @if (query()) {
            {{ f + '.allMatches' | translate: { count: matches().length } }}
          } @else {
            {{ allLabel() }}
            <span class="muted">{{
              f + '.ticked' | translate: { count: ticked().length, total: options().length }
            }}</span>
          }
        </mat-checkbox>
        @if (query() && matches().length > 0) {
          <button mat-button class="small" data-cy="filter-menu-only-matches" (click)="only.emit(matchIds())">
            {{ f + '.onlyThese' | translate }}
          </button>
        }
      </div>
    </div>

    <div class="list" role="group">
      @for (option of matches(); track option.id) {
        <div class="row" data-cy="filter-menu-option">
          <mat-checkbox [checked]="tickedSet().has(option.id)" (change)="toggle(option.id)">
            @if (option.color) {
              <span class="dot" [style.background]="option.color"></span>
            }
            <span class="option-text">
              {{ option.label }}
              @if (option.name && option.name !== option.label) {
                <code class="option-name">{{ option.name }}</code>
              }
            </span>
            @if (option.count !== undefined) {
              <span class="muted">{{ option.count }}</span>
            }
          </mat-checkbox>
          <button mat-button class="small only" (click)="only.emit([option.id])">{{ f + '.only' | translate }}</button>
        </div>
      } @empty {
        <p class="none">{{ f + '.noMatch' | translate }}</p>
      }
    </div>

    <div class="foot">
      <span class="summary">
        @if (query()) {
          {{ f + '.matching' | translate: { count: matches().length, total: options().length } }}
        } @else if (hidden().length === 0) {
          {{ f + '.allShown' | translate: { total: options().length } }}
        } @else if (hidden().length <= namedHidden) {
          {{ f + '.hidden' | translate }}
          <b>{{ hiddenNames() }}</b>
        } @else {
          {{ f + '.ticked' | translate: { count: ticked().length, total: options().length } }}
        }
      </span>
      @if (hidden().length > 0) {
        <button mat-button class="small" data-cy="filter-menu-show-all" (click)="tickedChange.emit(allIds())">
          {{ f + '.showAll' | translate }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      :host {
        display: flex;
        flex-direction: column;
        width: 320px;
        max-height: min(540px, 70vh);
        font-size: 13px;
      }

      .head {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 4px 12px 6px;
      }

      .search {
        --mat-form-field-container-height: 36px;
        --mat-form-field-container-vertical-padding: 6px;
        --mdc-outlined-text-field-container-shape: 8px;
        width: 100%;
        font-size: 13px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: $cool_gray_500;
        }
      }

      .bulk {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 500;
      }

      .list {
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: 0 4px;
        border-top: 1px solid $cool_gray_100;
      }

      .row {
        display: flex;
        align-items: center;
        border-radius: 6px;

        mat-checkbox {
          flex: 1;
          min-width: 0;
        }

        // "Only" shows on the row under the pointer, or reached by keyboard.
        .only {
          visibility: hidden;
        }

        &:hover,
        &:focus-within {
          background: $cool_gray_50;

          .only {
            visibility: visible;
          }
        }
      }

      .option-text {
        display: inline-flex;
        flex-direction: column;
        line-height: 17px;
        vertical-align: middle;
      }

      .option-name {
        font-family: 'Roboto Mono', ui-monospace, monospace;
        font-size: 11px;
        color: $cool_gray_500;
      }

      .dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        margin-right: 6px;
        box-sizing: border-box;
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 50%;
      }

      .muted {
        margin-left: 6px;
        font-weight: 400;
        color: $cool_gray_500;
      }

      .small {
        --mat-button-text-container-height: 26px;
        --mat-button-text-horizontal-padding: 8px;
        flex: none;
        font-size: 12px;
      }

      .none {
        margin: 0;
        padding: 12px;
        color: $cool_gray_500;
      }

      .foot {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px 2px;
        border-top: 1px solid $cool_gray_100;
        font-size: 12px;
        color: $cool_gray_500;

        b {
          font-weight: 500;
          color: $cool_gray_700;
        }
      }

      .summary {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ],
})
export class FilterMenuComponent {
  /** Every choice, in the order shown. */
  readonly options = input.required<readonly FilterOption[]>();
  /** The IRIs of the choices ticked. */
  readonly ticked = input.required<readonly string[]>();
  /** Label of the box that ticks every choice, such as "All classes". */
  readonly allLabel = input('');

  /** The choices left ticked after a change. */
  readonly tickedChange = output<string[]>();
  /** "Only" or "Only these" was clicked; emits the only choices to keep. */
  readonly only = output<string[]>();

  readonly namedHidden = NAMED_HIDDEN;
  readonly query = signal('');
  private readonly _search = viewChild.required<ElementRef<HTMLInputElement>>('search');

  readonly tickedSet = computed(() => new Set(this.ticked()));
  readonly allIds = computed(() => this.options().map(option => option.id));
  readonly matches = computed(() => {
    const query = this.query().trim().toLowerCase();
    return query
      ? this.options().filter(
          option => option.label.toLowerCase().includes(query) || option.name?.toLowerCase().includes(query)
        )
      : this.options();
  });
  readonly matchIds = computed(() => this.matches().map(option => option.id));
  /** Whether every choice found is ticked, some are, or none. */
  readonly bulkState = computed(() => {
    const ticked = this.matchIds().filter(id => this.tickedSet().has(id)).length;
    return ticked === 0 ? 'none' : ticked === this.matches().length ? 'all' : 'some';
  });
  readonly hidden = computed(() => this.options().filter(option => !this.tickedSet().has(option.id)));
  readonly hiddenNames = computed(() =>
    this.hidden()
      .map(option => option.label)
      .join(', ')
  );

  constructor() {
    afterNextRender(() => this._search().nativeElement.focus());
  }

  toggle(id: string): void {
    const ticked = this.tickedSet();
    this.tickedChange.emit(ticked.has(id) ? this.ticked().filter(other => other !== id) : [...this.ticked(), id]);
  }

  /** Ticks every choice found, or unticks them all when they all are. */
  toggleMatches(): void {
    const matches = new Set(this.matchIds());
    const kept = this.ticked().filter(id => !matches.has(id));
    this.tickedChange.emit(this.bulkState() === 'all' ? kept : [...kept, ...matches]);
  }

  onKeydown(event: KeyboardEvent): void {
    // Escape still closes the menu; every other key belongs to the search field and the checkboxes.
    if (event.key !== 'Escape') event.stopPropagation();
  }
}
