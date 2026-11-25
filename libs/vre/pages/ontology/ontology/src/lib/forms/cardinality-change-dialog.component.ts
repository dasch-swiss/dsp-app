import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogConfig,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { Cardinality, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ProgressIndicatorOverlayComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { DialogHeaderComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs';

export interface CardinalityChangeData {
  classIri: string;
  propertyIri: string;
  /** The class's and the property's labels, in the language the app shows. */
  classLabel: string;
  propertyLabel: string;
  /** Whether the property holds yes/no values, which are one each. */
  isBoolean: boolean;
  currentCardinality: Cardinality;
  targetCardinality: Cardinality;
}

/** How the dialog opens, as in the former Data models tab. */
export const cardinalityChangeDialogConfig = (data: CardinalityChangeData): MatDialogConfig<CardinalityChangeData> => ({
  data,
  autoFocus: false,
  minWidth: '800px',
  minHeight: '200px',
});

/**
 * Asks before a cardinality changes, as the former Data models tab did: it first asks the API whether the existing
 * resources allow the change, then either explains why not, or warns and asks. Closes with whether to change it.
 */
@Component({
  selector: 'app-cardinality-change-dialog',
  template: `
    @let d = 'pages.ontology.cardinalityDialog';
    <app-dialog-header
      [title]="d + '.title' | translate"
      [subtitle]="d + '.subtitle' | translate: { label: data.propertyLabel }" />
    <mat-dialog-content>
      <div class="cando-headline">
        @if (canDo() === undefined) {
          <app-progress-indicator-overlay class="floating-center" />
        }
        @if (canDo() === false) {
          <div class="mat-headline-6">{{ d + '.notPossible' | translate }}</div>
        }
      </div>
      @if (canDo() === false) {
        <div data-cy="cardinality-dialog-reason">
          <p>{{ reason().detail }}</p>
          <p>{{ reason().hint }}</p>
        </div>
      }
      @if (canDo()) {
        <div>
          <div class="cando-headline">
            <mat-icon aria-label="warn icon" fontIcon="warning_amber" color="accent" />
            <div class="mat-headline-6">{{ d + '.attention' | translate }}</div>
          </div>
          <div>{{ d + '.confirmMessage' | translate }}</div>
        </div>
      }
      <div mat-dialog-actions align="end">
        @if (canDo()) {
          <button mat-button (click)="dialogRef.close(false)">{{ 'ui.common.actions.no' | translate }}</button>
          <button mat-raised-button (click)="dialogRef.close(true)" data-cy="confirmation-button">
            {{ 'ui.common.actions.yes' | translate }}
          </button>
        }
        @if (canDo() === false) {
          <button mat-button (click)="dialogRef.close(false)">{{ 'ui.common.actions.close' | translate }}</button>
        }
      </div>
    </mat-dialog-content>
  `,
  styles: [
    `
      .cando-headline {
        display: flex;
        align-items: center;
      }

      .cando-headline mat-icon {
        vertical-align: middle;
        margin-right: 8px;
      }

      .mat-headline-6 {
        margin: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogHeaderComponent,
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatIcon,
    ProgressIndicatorOverlayComponent,
    TranslatePipe,
  ],
})
export class CardinalityChangeDialogComponent implements OnInit {
  readonly data = inject<CardinalityChangeData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject<MatDialogRef<CardinalityChangeDialogComponent, boolean>>(MatDialogRef);
  private readonly _api = inject<KnoraApiConnection>(DspApiConnectionToken);
  private readonly _translate = inject(TranslateService);

  /** Whether the existing resources allow the change; undefined while the API is asked. */
  readonly canDo = signal<boolean | undefined>(undefined);
  readonly reason = signal({ detail: '', hint: '' });

  /** From one value to several. */
  private get _toMultiple(): boolean {
    return isMultiple(this.data.targetCardinality) && !isMultiple(this.data.currentCardinality);
  }

  /** From optional to required. */
  private get _toRequired(): boolean {
    return isRequired(this.data.targetCardinality) && !isRequired(this.data.currentCardinality);
  }

  ngOnInit(): void {
    // A yes/no property holds one value.
    if (this.data.isBoolean && this._toMultiple) {
      this.canDo.set(false);
      return;
    }
    this._api.v2.onto
      .canReplaceCardinalityOfResourceClassWith(this.data.classIri, this.data.propertyIri, this.data.targetCardinality)
      .pipe(take(1))
      .subscribe({
        next: response => {
          if (!response.canDo) this.reason.set(this._reasonOf(response.cannotDoReason));
          this.canDo.set(response.canDo);
        },
        error: () => this.canDo.set(false),
      });
  }

  /** The API's reason, said in the user's words where it is that existing values do not fit. */
  private _reasonOf(cannotDoReason = ''): { detail: string; hint: string } {
    const reason = { detail: cannotDoReason, hint: '' };
    if (!cannotDoReason.includes('is not included in the new cardinality')) return reason;
    const d = 'pages.ontology.cardinalityDialog';
    const labels = { className: this.data.classLabel, propertyLabel: this.data.propertyLabel };
    // Some resources have several values, where one is to be the most.
    if (!this._toMultiple) {
      reason.detail = this._translate.instant(`${d}.multiplePropertiesError`, labels);
      reason.hint = this._translate.instant(`${d}.multiplePropertiesHint`, labels);
    }
    // Some resources have none, where one is to be required.
    if (this._toRequired) {
      reason.detail = this._translate.instant(`${d}.missingPropertyError`, labels);
      reason.hint = this._translate.instant(`${d}.missingPropertyHint`, labels);
    }
    return reason;
  }
}

const isMultiple = (cardinality: Cardinality) => cardinality === Cardinality._0_n || cardinality === Cardinality._1_n;
const isRequired = (cardinality: Cardinality) => cardinality === Cardinality._1 || cardinality === Cardinality._1_n;
