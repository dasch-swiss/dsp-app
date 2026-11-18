import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltip } from '@angular/material/tooltip';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { concatMap, from, map, of, switchMap, tap } from 'rxjs';
import { CanDo, DATA_MODEL_EDITOR, injectDataModelEditing } from './data-model-editor';

/** A cardinality from its two checkboxes, as the Data models tab reads them. */
export function cardinalityFrom(multiple: boolean, required: boolean): Cardinality {
  if (required) return multiple ? Cardinality._1_n : Cardinality._1;
  return multiple ? Cardinality._0_n : Cardinality._0_1;
}

/** Whether a cardinality allows several values, and whether it requires one. */
export function checkboxesOf(cardinality: Cardinality): { multiple: boolean; required: boolean } {
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
  imports: [MatCheckbox, MatTooltip, TranslatePipe],
  host: {
    '[class.labelled]': 'labelled()',
    '[class.ticked-only]': 'tickedOnly()',
    '(mouseenter)': 'check()',
    '(focusin)': 'check()',
  },
  template: `
    @let c = 'pages.ontology.cardinality';
    @for (box of boxes; track box) {
      @let label = c + '.' + (box === 'multiple' ? 'multipleValues' : 'required') | translate;
      <span
        class="box"
        [class.unticked]="!state()[box]"
        [matTooltip]="reasonOf(box) | translate"
        [matTooltipDisabled]="!reasonOf(box)">
        <mat-checkbox
          color="primary"
          [attr.data-cy]="'cardinality-' + box"
          [checked]="state()[box]"
          [disabled]="!changeable() || saving() || blocked(box)"
          [aria-label]="label"
          (change)="toggle(box, $event.source)">
          @if (labelled()) {
            {{ label }}
          }
        </mat-checkbox>
      </span>
    }
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      // Two columns, or with their words, the two boxes one above the other, as in the Data models tab.
      :host {
        display: grid;
        grid-template-columns: 64px 64px;
        align-items: center;
        justify-items: center;
        --mat-checkbox-state-layer-size: 28px;
        --mat-checkbox-label-text-size: 12px;
        --mat-checkbox-label-text-line-height: 16px;
      }

      :host(.labelled) {
        grid-template-columns: 128px;
        justify-items: start;
        row-gap: 0;
      }

      .box {
        display: inline-flex;
      }

      // Ticked boxes only; the others show while the pointer is on the property's row, or with the focus.
      :host(.ticked-only) .box.unticked {
        visibility: hidden;
      }

      :host-context(.prop:hover) .box.unticked,
      :host(.ticked-only) .box.unticked:focus-within {
        visibility: visible;
      }

      mat-checkbox {
        // Material's touch target is wider than a card row; the row stays compact.
        margin: -4px 0;
      }
    `,
  ],
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
  /** Whether only the ticked boxes show, the others appearing on hover. */
  readonly tickedOnly = input(false);

  // Only where the app provides the data model editor: without it, nothing here changes.
  private readonly _editing = inject(DATA_MODEL_EDITOR, { optional: true }) ? injectDataModelEditing() : undefined;
  private readonly _destroyRef = inject(DestroyRef);

  readonly boxes: Box[] = ['multiple', 'required'];
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

  /** A box is out of reach once the API said the existing resources rule it out, or for a yes/no property's "Multiple values". */
  blocked(box: Box): boolean {
    return this._result(box)?.canDo === false;
  }

  /** Why a box can't change, for its tooltip; nothing while it can, or for one that never can here. */
  reasonOf(box: Box): string {
    if (!this.changeable()) return '';
    if (box === 'multiple' && this.type() === 'Boolean') return 'pages.dataModels2.booleanOne';
    return this._result(box)?.canDo === false ? 'pages.dataModels2.cardinalityBlocked' : '';
  }

  /** Asks the API, once per cardinality shown, whether the existing resources allow each box to change. */
  check(): void {
    const classIri = this.classIri();
    const editing = this._editing;
    const current = this.cardinality();
    if (!this.changeable() || !classIri || !editing || this._checks().for === current) return;
    const boxes: Partial<Record<Box, CanDo>> = {};
    if (this.type() === 'Boolean' && !this.state().multiple) boxes.multiple = { canDo: false };
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
        this._checks.update(checks =>
          checks.for === current ? { ...checks, boxes: { ...checks.boxes, [box]: result } } : checks
        )
      );
  }

  /**
   * Saves the cardinality the ticked or unticked box gives, once the API says the existing resources allow it; the data
   * model is then read again. Refused, the box goes back and says why.
   */
  toggle(box: Box, checkbox: MatCheckbox): void {
    const classIri = this.classIri();
    const editing = this._editing;
    if (!classIri || !editing) return;
    const next = this._next(box);
    const known = this._result(box);
    const current = this.cardinality();
    this.saving.set(true);
    (known ? of(known) : editing.canSetCardinality(classIri, this.propertyIri(), next))
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
          if (!saved) checkbox.checked = this.state()[box];
        },
        complete: () => this.saving.set(false),
        error: () => {
          checkbox.checked = this.state()[box];
          this.saving.set(false);
        },
      });
  }
}
