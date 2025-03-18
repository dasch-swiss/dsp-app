import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Cardinality, Constants, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { PropertyInfoObject } from '@dasch-swiss/vre/shared/app-helper-services';
import { take } from 'rxjs/operators';

export interface CardinalityInfo {
  classIri: string;
  currentCardinality: Cardinality;
  propertyInfo: PropertyInfoObject;
  targetCardinality: Cardinality;
}

@Component({
  selector: 'cardinality-change-dialog',
  template: `
    <app-dialog-header
      title="Update cardinality"
      [subtitle]="
        'Set the cardinality for property ' + data.propertyInfo.propType.group + ': ' + data.propertyInfo.propType.label
      " />
    <mat-dialog-content>
      <div class="cando-headline">
        <app-progress-indicator *ngIf="canSetCardinality === undefined" [status]="0" />
        <div *ngIf="canSetCardinality === false" class="mat-headline-6">Changing the cardinality is not possible.</div>
      </div>
      <div *ngIf="canSetCardinality === false">
        <p>{{ canNotSetCardinalityUiReason.detail }}</p>
        <p>{{ canNotSetCardinalityUiReason.hint }}</p>
      </div>
      <div *ngIf="canSetCardinality">
        <div class="cando-headline">
          <mat-icon aria-label="warn icon" fontIcon="warning_amber" color="accent"></mat-icon>
          <div class="mat-headline-6">Attention</div>
        </div>
        <div>Please note that this change may not be reversible. Do you want to change the cardinality?</div>
      </div>
      <div mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close(false)" *ngIf="canSetCardinality">No</button>
        <button
          *ngIf="canSetCardinality"
          mat-raised-button
          (click)="dialogRef.close(true)"
          data-cy="confirmation-button">
          Yes
        </button>
        <button mat-button (click)="dialogRef.close(false)" *ngIf="canSetCardinality === false">
          {{ 'form.action.close' | translate }}
        </button>
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
})
export class CardinalityChangeDialogComponent implements OnInit {
  canSetCardinality: boolean | undefined = undefined;
  canNotSetCardinalityUiReason = {
    detail: '',
    hint: '',
  };

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
    protected dialogRef: MatDialogRef<CardinalityChangeDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: CardinalityInfo,
    @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
    private _cdr: ChangeDetectorRef
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
        reason.detail = `At least one resource of the class "${this.classLabel}" has multiple "${this.propertyLabel}" properties in your data.`;
        reason.hint = `In order to set the cardinality of "${this.propertyLabel}" to single, every resource "${this.classLabel}" must have only one "${this.propertyLabel}" value prior to this change.`;
      }
      if (this.changeToRequired) {
        reason.detail = `At least one resource of the class "${this.classLabel}" does not have a "${this.propertyLabel}" property in your data.`;
        reason.hint = `In order to set the cardinality of "${this.propertyLabel}" to required every resource "${this.classLabel}" needs to have a "${this.propertyLabel}" value prior to this change.`;
      }
    }
    return reason;
  }
}
