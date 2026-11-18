import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { concatMap, from, map } from 'rxjs';
import { CanDo, DATA_MODEL_EDITOR, injectDataModelEditing } from './data-model-editor';

/** The four cardinalities, as the data model writes them and as the translations name them. */
const CARDINALITIES = [
  { value: Cardinality._1, label: '1', key: 'requiredOne', multiple: false },
  { value: Cardinality._0_1, label: '0-1', key: 'optionalOne', multiple: false },
  { value: Cardinality._1_n, label: '1-n', key: 'requiredMultiple', multiple: true },
  { value: Cardinality._0_n, label: '0-n', key: 'optionalMultiple', multiple: true },
] as const;

/** A reason the API never gives, for a yes/no property asked to hold several values. */
const BOOLEAN_ONE = 'boolean';

/**
 * A property's cardinality on a class, as the data model writes it: 1, 0-1, 1-n or 0-n, filled when a value is required,
 * in words on hover. Where it can change, a menu offers the four, each checked against the existing resources first,
 * and saves the one picked. The class cards and the class's side panel both show it.
 */
@Component({
  selector: 'app-cardinality-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatMenu, MatMenuItem, MatMenuTrigger, MatTooltip, TranslatePipe],
  host: { '[class.quiet-default]': 'quietDefault()' },
  template: `
    @let r = 'pages.dataModels2';
    @let current = choiceOf(cardinality());
    @if (changeable()) {
      <button
        type="button"
        class="chip"
        data-cy="cardinality-chip"
        [class.default]="isDefault()"
        [class.tinted]="quietDefault() && !isRequired() && !isDefault()"
        [class.required]="isRequired()"
        [attr.aria-label]="
          r + '.changeCardinality' | translate: { property: propertyLabel(), cardinality: current.label }
        "
        [matTooltip]="r + '.cardinality.' + current.key | translate"
        [matMenuTriggerFor]="cardinalities"
        (menuOpened)="check()">
        {{ current.label }}
      </button>
      <mat-menu #cardinalities="matMenu" xPosition="before">
        @for (choice of choices; track choice.value) {
          @let result = checks().get(choice.value);
          @let isCurrent = choice.value === cardinality();
          <button
            mat-menu-item
            type="button"
            class="choice"
            [attr.data-cy]="'cardinality-choice-' + choice.label"
            [class.current]="isCurrent"
            [disabled]="!isCurrent && !result?.canDo"
            [matTooltip]="result?.reason === booleanOne ? '' : (result?.reason ?? '')"
            [matTooltipDisabled]="!result?.reason || result?.reason === booleanOne"
            (click)="set(choice.value)">
            <code>{{ choice.label }}</code>
            <span class="choice-text">
              {{ r + '.cardinality.' + choice.key | translate }}
              @if (isCurrent) {
                <small>{{ r + '.current' | translate }}</small>
              } @else if (!result) {
                <small>{{ r + '.checkingCardinality' | translate }}</small>
              } @else if (!result.canDo) {
                <small>{{
                  (result.reason === booleanOne ? r + '.booleanOne' : r + '.cardinalityBlocked') | translate
                }}</small>
              }
            </span>
          </button>
        }
      </mat-menu>
    } @else if (!(quietDefault() && isDefault())) {
      <span
        class="chip"
        [class.tinted]="quietDefault() && !isRequired()"
        data-cy="cardinality-chip"
        [class.required]="isRequired()"
        [matTooltip]="r + '.cardinality.' + current.key | translate"
        >{{ current.label }}</span
      >
    }
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      :host {
        display: inline-flex;
      }

      // 1, 0-1, 1-n or 0-n; filled when a value is required.
      .chip {
        box-sizing: border-box;
        min-width: 32px;
        padding: 0 4px;
        border: 1px solid $cool_gray_300;
        border-radius: 4px;
        background: white;
        font-family: 'Roboto Mono', monospace;
        font-size: 10.5px;
        font-weight: 500;
        line-height: 16px;
        text-align: center;
        color: $cool_gray_600;

        &.required {
          background: $primary;
          border-color: $primary;
          color: white;
        }
      }

      // Only what differs from 0-1: 0-n tinted, 1 and 1-n filled; a 0-1 shows dashed, only while its row is pointed at.
      .chip.tinted {
        border-color: $primary_50;
        background: $primary_50;
        color: $primary_700;
      }

      :host(.quiet-default) .chip.default {
        visibility: hidden;
        border-style: dashed;
        border-color: $primary;
        color: $primary;
      }

      :host-context(.prop:hover) .chip.default,
      :host(.quiet-default) .chip.default[aria-expanded='true'],
      :host(.quiet-default) .chip.default:focus-visible {
        visibility: visible;
      }

      // One that can change is a button: a ring on hover says so.
      button.chip {
        cursor: pointer;

        &:hover {
          box-shadow: 0 0 0 2px $primary_50;
        }

        &:focus-visible {
          outline: 2px solid $primary;
          outline-offset: 1px;
        }
      }

      // The cardinalities in the menu: the notation, then what it means and why one is out of reach.
      .choice {
        code {
          display: inline-block;
          min-width: 30px;
          margin-right: 10px;
          padding: 0 4px;
          border: 1px solid $cool_gray_300;
          border-radius: 4px;
          font:
            500 11.5px 'Roboto Mono',
            monospace;
          text-align: center;
        }

        &.current code {
          background: $primary;
          border-color: $primary;
          color: white;
        }

        small {
          display: block;
          font-size: 11.5px;
          line-height: 1.3;
          color: $cool_gray_500;
        }
      }

      .choice-text {
        display: inline-block;
        vertical-align: middle;
        line-height: 1.3;
      }
    `,
  ],
})
export class CardinalityChipComponent {
  readonly cardinality = input.required<Cardinality>();
  /** The value type, as `DataModelProperty.type` names it: a `Boolean` holds one value at most. */
  readonly type = input('');
  readonly propertyIri = input('');
  readonly propertyLabel = input('');
  /** The class the cardinality is on, when it can change here. */
  readonly classIri = input<string | undefined>(undefined);
  /** Whether it can change here: for editors, on the class's own properties. */
  readonly changeable = input(false);
  /** Whether 0-1, the default, goes unshown: dashed while its row is pointed at, to change it; for viewers, nothing. */
  readonly quietDefault = input(false);

  // Only where the app provides the data model editor: without it, nothing here changes.
  private readonly _editing = inject(DATA_MODEL_EDITOR, { optional: true }) ? injectDataModelEditing() : undefined;
  private readonly _destroyRef = inject(DestroyRef);

  readonly choices = CARDINALITIES;
  readonly booleanOne = BOOLEAN_ONE;
  /** What the API says of each other cardinality, once the menu asked; none while it checks. */
  readonly checks = signal(new Map<Cardinality, CanDo>());

  choiceOf(cardinality: Cardinality) {
    return CARDINALITIES.find(choice => choice.value === cardinality) ?? CARDINALITIES[1];
  }

  isDefault(): boolean {
    return this.cardinality() === Cardinality._0_1;
  }

  isRequired(): boolean {
    return this.cardinality() === Cardinality._1 || this.cardinality() === Cardinality._1_n;
  }

  /** Asks the API, for each other cardinality, whether the existing resources allow it. */
  check(): void {
    const classIri = this.classIri();
    const editing = this._editing;
    if (!classIri || !editing) return;
    const checks = new Map<Cardinality, CanDo>();
    const asked = CARDINALITIES.filter(choice => choice.value !== this.cardinality());
    for (const choice of asked) {
      if (this.type() === 'Boolean' && choice.multiple) checks.set(choice.value, { canDo: false, reason: BOOLEAN_ONE });
    }
    this.checks.set(checks);
    // One question at a time: the API turns several at once away as too many requests.
    from(asked.filter(choice => !checks.has(choice.value)))
      .pipe(
        concatMap(choice =>
          editing
            .canSetCardinality(classIri, this.propertyIri(), choice.value)
            .pipe(map(result => ({ choice, result })))
        ),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(({ choice, result }) => this.checks.update(all => new Map(all).set(choice.value, result)));
  }

  /** Saves the cardinality picked; the data model is then read again. */
  set(cardinality: Cardinality): void {
    const classIri = this.classIri();
    if (!classIri || cardinality === this.cardinality()) return;
    this._editing
      ?.setCardinality(classIri, this.propertyIri(), cardinality)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe();
  }
}
