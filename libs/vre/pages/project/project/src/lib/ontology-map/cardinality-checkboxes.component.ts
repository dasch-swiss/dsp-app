import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { concatMap, from, map, of, switchMap, tap } from 'rxjs';
import { CHECK_DELAY_MS } from '../data-models-rail/can-do-checks';
import { CanDo, DATA_MODEL_EDITOR, injectDataModelEditing } from './data-model-editor';

/** A cardinality from its two checkboxes, as the Data models tab reads them. */
function cardinalityFrom(multiple: boolean, required: boolean): Cardinality {
  if (required) return multiple ? Cardinality._1_n : Cardinality._1;
  return multiple ? Cardinality._0_n : Cardinality._0_1;
}

/** Whether a cardinality allows several values, and whether it requires one. */
function checkboxesOf(cardinality: Cardinality): { multiple: boolean; required: boolean } {
  return {
    multiple: cardinality === Cardinality._0_n || cardinality === Cardinality._1_n,
    required: cardinality === Cardinality._1 || cardinality === Cardinality._1_n,
  };
}

type Box = 'multiple' | 'required';

/**
 * A property's cardinality on a class as the Data models tab shows it: two checkboxes, "Multiple values" and
 * "Required". `labelled` writes the words beside each box; without, the card names the two columns once. Where it can
 * change, ticking a box saves the new cardinality once the API says the existing resources allow it; a box they rule
 * out (or a yes/no property's "Multiple values") greys out, the reason on hover. Hovering the row asks ahead.
 */
@Component({
  selector: 'app-cardinality-checkboxes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Unencapsulated, to size Material's box and label inside the checkbox; every rule starts at the element's tag.
  encapsulation: ViewEncapsulation.None,
  imports: [MatCheckbox, MatIcon, MatTooltip, TranslatePipe],
  host: {
    '[class.labelled]': 'labelled()',
    '[class.ticked-only]': 'tickedOnly()',
    '[class.icons]': "appearance() === 'icons'",
    '(mouseenter)': 'checkSoon()',
    '(mouseleave)': 'cancelCheck()',
    '(focusin)': 'check()',
  },
  template: `
    @let c = 'pages.ontology.cardinality';
    @if (appearance() === 'icons') {
      <!-- A star for "Required", a stack for "Multiple values": each switches on a click. -->
      @for (box of iconOrder; track box) {
        @let label = c + '.' + (box === 'multiple' ? 'multipleValues' : 'required') | translate;
        @let on = state()[box];
        @let reason = reasons()[box];
        <span class="box" [matTooltip]="reason || label | translate">
          <button
            type="button"
            class="icon-toggle"
            [class.star]="box === 'required'"
            [class.on]="on"
            [attr.data-cy]="'cardinality-toggle-' + box"
            [attr.aria-label]="label"
            [attr.aria-pressed]="on"
            [disabled]="!changeable() || saving() || blockedBoxes()[box]"
            (click)="toggle(box)">
            @if (box === 'required') {
              <span class="star-glyph" aria-hidden="true">*</span>
            } @else {
              <mat-icon aria-hidden="true">layers</mat-icon>
            }
          </button>
        </span>
      }
    } @else {
      @for (box of boxes; track box) {
        @let label = c + '.' + (box === 'multiple' ? 'multipleValues' : 'required') | translate;
        @let reason = reasons()[box];
        <span
          class="box"
          [class.unticked]="!state()[box]"
          [matTooltip]="reason || (changeable() ? 'pages.dataModels.cardinalityRule' : '') | translate"
          [matTooltipDisabled]="!reason && !changeable()"
          [matTooltipShowDelay]="reason ? 0 : 600">
          <mat-checkbox
            color="primary"
            [attr.data-cy]="'cardinality-' + box"
            [checked]="state()[box]"
            [disabled]="!changeable() || saving() || blockedBoxes()[box]"
            [aria-label]="label"
            (change)="toggle(box, $event.source)">
            @if (labelled()) {
              {{ label }}
            }
          </mat-checkbox>
        </span>
      }
    }
  `,
  styleUrl: './cardinality-checkboxes.component.css',
})
export class CardinalityCheckboxesComponent {
  readonly cardinality = input.required<Cardinality>();
  /** The value type, as `DataModelProperty.type` names it: a `Boolean` holds one value at most. */
  readonly type = input('');
  readonly propertyIri = input('');
  /** The class the cardinality is on, when it can change here. */
  readonly classIri = input<string | undefined>(undefined);
  /** Whether it can change here: for editors, on the class's own properties. */
  readonly changeable = input(false);
  /** Whether each box carries its words; else the card names the columns. */
  readonly labelled = input(false);
  /** As checkboxes, or as a star and a stack that switch on a click. */
  readonly appearance = input<'checkboxes' | 'icons'>('checkboxes');
  /** Whether only the ticked boxes show, the others appearing on hover. */
  readonly tickedOnly = input(false);

  // Only where the app provides the data model editor: without it, nothing here changes.
  private readonly _editing = inject(DATA_MODEL_EDITOR, { optional: true }) ? injectDataModelEditing() : undefined;
  private readonly _destroyRef = inject(DestroyRef);

  constructor() {
    this._destroyRef.onDestroy(() => this.cancelCheck());
  }

  readonly boxes: Box[] = ['multiple', 'required'];
  /** The star after a label comes first, as the card reads it; then the stack. */
  readonly iconOrder: Box[] = ['required', 'multiple'];
  readonly state = computed(() => checkboxesOf(this.cardinality()));
  readonly saving = signal(false);
  /** What the API says of ticking or unticking each box, once asked; per cardinality, so a saved change asks again. */
  private readonly _checks = signal<{ for?: Cardinality; boxes: Partial<Record<Box, CanDo>> }>({ boxes: {} });

  /** The cardinality ticking or unticking the box would give. */
  private _next(box: Box): Cardinality {
    const { multiple, required } = this.state();
    return box === 'multiple' ? cardinalityFrom(!multiple, required) : cardinalityFrom(multiple, !required);
  }

  private _result(box: Box): CanDo | undefined {
    const checks = this._checks();
    return checks.for === this.cardinality() ? checks.boxes[box] : undefined;
  }

  /** A box is out of reach once the API said the existing resources rule it out; a yes/no property's "Multiple values" always. */
  readonly blockedBoxes = computed<Record<Box, boolean>>(() => {
    // A check the API could not answer blocks nothing: the save asks again.
    const blocked = (box: Box) => {
      const result = this._result(box);
      return result?.canDo === false && !result.failed;
    };
    return { multiple: this.type() === 'Boolean' || blocked('multiple'), required: blocked('required') };
  });

  /** Why each box can't change, for its tooltip; nothing while it can, or for one that never can here. */
  readonly reasons = computed<Record<Box, string>>(() => {
    const reasonOf = (box: Box): string => {
      if (!this.changeable()) return '';
      if (box === 'multiple' && this.type() === 'Boolean') return 'pages.dataModels.booleanOne';
      return this.blockedBoxes()[box] ? 'pages.dataModels.cardinalityBlocked' : '';
    };
    return { multiple: reasonOf('multiple'), required: reasonOf('required') };
  });

  /** Asks the API, once per cardinality shown, whether the existing resources allow each box to change. */
  check(): void {
    const classIri = this.classIri();
    const editing = this._editing;
    const current = this.cardinality();
    if (!this.changeable() || !classIri || !editing || this._checks().for === current) return;
    const boxes: Partial<Record<Box, CanDo>> = {};
    if (this.type() === 'Boolean') boxes.multiple = { canDo: false };
    this._checks.set({ for: current, boxes });
    // One question at a time: the API turns several at once away as too many requests.
    from(this.boxes.filter(box => !boxes[box]))
      .pipe(
        concatMap(box =>
          editing
            .canSetCardinality(classIri, this.propertyIri(), this._next(box))
            .pipe(map(result => ({ box, result })))
        ),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(({ box, result }) =>
        this._checks.update(checks => {
          if (checks.for !== current) return checks;
          // Not answered: forgotten, so the next hover asks again.
          if (result.failed) return { boxes: {} };
          return { ...checks, boxes: { ...checks.boxes, [box]: result } };
        })
      );
  }

  private _pending?: ReturnType<typeof setTimeout>;

  /** Asks once the pointer has rested on the row a moment: sweeping across rows asks nothing. */
  checkSoon(): void {
    this.cancelCheck();
    this._pending = setTimeout(() => this.check(), CHECK_DELAY_MS);
  }

  cancelCheck(): void {
    clearTimeout(this._pending);
  }

  /**
   * Saves the cardinality the ticked or unticked box gives, once the API says the existing resources allow it; the data
   * model is then read again. Refused, the box goes back and says why.
   */
  toggle(box: Box, checkbox?: MatCheckbox): void {
    const classIri = this.classIri();
    const editing = this._editing;
    if (!classIri || !editing) return;
    const next = this._next(box);
    const known = this._result(box);
    const current = this.cardinality();
    this.saving.set(true);
    (known && !known.failed ? of(known) : editing.canSetCardinality(classIri, this.propertyIri(), next))
      .pipe(
        tap(result =>
          this._checks.update(checks =>
            checks.for === current
              ? { ...checks, boxes: { ...checks.boxes, [box]: result } }
              : { for: current, boxes: { [box]: result } }
          )
        ),
        switchMap(result => (result.canDo ? editing.setCardinality(classIri, this.propertyIri(), next) : of(false))),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe({
        next: saved => {
          if (!saved && checkbox) checkbox.checked = this.state()[box];
        },
        complete: () => this.saving.set(false),
        error: () => {
          if (checkbox) checkbox.checked = this.state()[box];
          this.saving.set(false);
        },
      });
  }
}
