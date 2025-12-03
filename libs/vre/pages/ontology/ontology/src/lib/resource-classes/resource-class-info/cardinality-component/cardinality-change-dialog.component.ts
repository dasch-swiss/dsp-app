import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Cardinality, Constants, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs';
import { PropertyInfo } from '../../../ontology.types';

export interface CardinalityInfo {
  classIri: string;
  currentCardinality: Cardinality;
  propertyInfo: PropertyInfo;
  targetCardinality: Cardinality;
}

@Component({
  selector: 'cardinality-change-dialog',
  template: `
    <app-dialog-header
      [title]="_translate.instant('pages.ontology.cardinalityDialog.title')"
      [subtitle]="
        _translate.instant('pages.ontology.cardinalityDialog.subtitle', {
          group: data.propertyInfo.propType.group,
          label: data.propertyInfo.propType.label,
        })
      " />
    <mat-dialog-content>
      <div class="cando-headline">
        @if (canSetCardinality === undefined) {
          <app-progress-indicator class="floating-center" />
        }
        @if (canSetCardinality === false) {
          <div class="mat-headline-6">{{ 'pages.ontology.cardinalityDialog.notPossible' | translate }}</div>
        }
      </div>
      @if (canSetCardinality === false) {
        <div>
          <p>{{ canNotSetCardinalityUiReason.detail }}</p>
          <p>{{ canNotSetCardinalityUiReason.hint }}</p>
        </div>
      }
      @if (canSetCardinality) {
        <div>
          <div class="cando-headline">
            <mat-icon aria-label="warn icon" fontIcon="warning_amber" color="accent" />
            <div class="mat-headline-6">{{ 'pages.ontology.cardinalityDialog.attention' | translate }}</div>
          </div>
          <div>{{ 'pages.ontology.cardinalityDialog.confirmMessage' | translate }}</div>
        </div>
      }
      <div mat-dialog-actions align="end">
        @if (canSetCardinality) {
          <button mat-button (click)="dialogRef.close(false)">{{ 'ui.common.actions.no' | translate }}</button>
        }
        @if (canSetCardinality) {
          <button mat-raised-button (click)="dialogRef.close(true)" data-cy="confirmation-button">
            {{ 'ui.common.actions.yes' | translate }}
          </button>
        }
        @if (canSetCardinality === false) {
          <button mat-button (click)="dialogRef.close(false)">
            {{ 'ui.common.actions.close' | translate }}
          </button>
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
  standalone: false,
})
export class CardinalityChangeDialogComponent implements OnInit {
  canSetCardinality: boolean | undefined = undefined;
  canNotSetCardinalityUiReason = {
    detail: '',
    hint: '',
  };

  protected readonly _translate = inject(TranslateService);

  get changeToMultiple() {
    return this.data.targetCardinality && this.data?.targetCardinality > 1 && this.data.currentCardinality < 2;
  }

  get changeToRequired(): boolean {
    return (
      (this.data.targetCardinality === 0 || this.data.targetCardinality === 3) &&
      (this.data.currentCardinality === 1 || this.data.currentCardinality === 2)
    );
  }

  get classLabel(): string {
    return this.data.classIri.split('#')[1];
  }

  get propertyLabel(): string {
    return this.data.propertyInfo.propDef?.label || '';
  }

  constructor(
    @Inject(DspApiConnectionToken) private readonly _dspApiConnection: KnoraApiConnection,
    @Inject(MAT_DIALOG_DATA) public data: CardinalityInfo,
    private readonly _cdr: ChangeDetectorRef,
    protected dialogRef: MatDialogRef<CardinalityChangeDialogComponent, boolean>
  ) {}

  ngOnInit() {
    this.canChangeCardinality();
  }

  canChangeCardinality() {
    // boolean properties can only have cardinality of a single property
    if (this.data.propertyInfo.propType.objectType === Constants.BooleanValue && this.changeToMultiple) {
      this.canSetCardinality = false;
      this._cdr.markForCheck();
      return;
    }

    // check if cardinality can be changed
    this._dspApiConnection.v2.onto
      .canReplaceCardinalityOfResourceClassWith(
        this.data.classIri,
        this.data.propertyInfo?.propDef?.id || '',
        this.data.targetCardinality
      )
      .pipe(take(1))
      .subscribe(response => {
        this.canSetCardinality = response.canDo;
        if (!this.canSetCardinality) {
          this.canNotSetCardinalityUiReason = this.getCanNotSetCardinalityReason(response.cannotDoReason);
        }
        this._cdr.markForCheck();
      });
  }

  getCanNotSetCardinalityReason(cannotDoReason = '') {
    const reason = { detail: cannotDoReason, hint: '' }; // default

    if (cannotDoReason?.includes('is not included in the new cardinality')) {
      // data contradicting the change
      if (!this.changeToMultiple) {
        // there are resources which have that property multiple times, so we do not allow to set multiple to false
        reason.detail = this._translate.instant('pages.ontology.cardinalityDialog.multiplePropertiesError', {
          className: this.classLabel,
          propertyLabel: this.propertyLabel,
        });
        reason.hint = this._translate.instant('pages.ontology.cardinalityDialog.multiplePropertiesHint', {
          propertyLabel: this.propertyLabel,
          className: this.classLabel,
        });
      }
      if (this.changeToRequired) {
        reason.detail = this._translate.instant('pages.ontology.cardinalityDialog.missingPropertyError', {
          className: this.classLabel,
          propertyLabel: this.propertyLabel,
        });
        reason.hint = this._translate.instant('pages.ontology.cardinalityDialog.missingPropertyHint', {
          propertyLabel: this.propertyLabel,
          className: this.classLabel,
        });
      }
    }
    return reason;
  }
}
