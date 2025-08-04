import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { Cardinality, Constants } from '@dasch-swiss/dsp-js';
import { ClassPropertyInfo } from '../../../ontology.types';
import { CardinalityChangeDialogComponent, CardinalityInfo } from './cardinality-change-dialog.component';

@Component({
  selector: 'app-cardinality',
  styles: [
    `
      .cardinality-checkbox {
        gap: 0.5rem;
        display: flex;
        flex-direction: row;
        align-items: center;
      }
      input[type='checkbox'] {
        accent-color: var(--primary);
      }
      label {
        font-size: 0.75rem;
      }
      .card-disabled {
        cursor: not-allowed;
      }

      .card-enabled {
        cursor: pointer;
      }
    `,
  ],
  template: `
    <div class="cardinality-checkbox">
      <input
        type="checkbox"
        [disabled]="disabled || disabledForBooleanType"
        [ngClass]="disabled || disabledForBooleanType ? 'card-disabled' : 'card-enabled'"
        [(ngModel)]="multipleCheckboxState"
        (change)="onCheckboxChange()" />
      <label>Multiple values</label>
    </div>
    <div class="cardinality-checkbox">
      <input
        type="checkbox"
        [disabled]="disabled"
        [ngClass]="disabled ? 'card-disabled' : 'card-enabled'"
        [(ngModel)]="requiredCheckboxState"
        (change)="onCheckboxChange()" />
      <label>Required</label>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardinalityComponent implements OnInit {
  @Input({ required: true }) classProp!: ClassPropertyInfo;
  @Input() disabled = false;
  @Output() cardinalityChange = new EventEmitter<Cardinality>();

  multipleCheckboxState = false;
  requiredCheckboxState = false;

  private _dialogRef: MatDialogRef<CardinalityChangeDialogComponent> | undefined;

  get disabledForBooleanType() {
    return this.classProp.propDef.objectType === Constants.BooleanValue;
  }

  constructor(
    private _cdr: ChangeDetectorRef,
    private _dialog: MatDialog
  ) {}

  ngOnInit() {
    this._initToggleStates();
  }

  private _initToggleStates() {
    this.multipleCheckboxState =
      this.classProp.iHasProperty.cardinality === Cardinality._0_n ||
      this.classProp.iHasProperty.cardinality === Cardinality._1_n;
    this.requiredCheckboxState =
      this.classProp.iHasProperty.cardinality === Cardinality._1 ||
      this.classProp.iHasProperty.cardinality === Cardinality._1_n;
    this._cdr.detectChanges();
  }

  private _determineTargetCardinality(): Cardinality {
    if (this.multipleCheckboxState) {
      return this.requiredCheckboxState ? Cardinality._1_n : Cardinality._0_n;
    } else {
      return this.requiredCheckboxState ? Cardinality._1 : Cardinality._0_1;
    }
  }

  onCheckboxChange() {
    const targetCardinality: Cardinality = this._determineTargetCardinality();
    const cardinalityInfo: CardinalityInfo = {
      classIri: this.classProp.classId,
      propertyInfo: this.classProp,
      currentCardinality: this.classProp.iHasProperty.cardinality,
      targetCardinality,
    };
    const dialogConfig: MatDialogConfig = {
      data: cardinalityInfo,
      autoFocus: false,
      minWidth: '800px',
      minHeight: '200px',
    };

    this._dialogRef = this._dialog.open(CardinalityChangeDialogComponent, dialogConfig);

    this._dialogRef.afterClosed().subscribe((performChange: boolean) => {
      if (performChange) {
        this.classProp.iHasProperty.cardinality = targetCardinality;
        this.cardinalityChange.emit(targetCardinality);
      } else {
        this._initToggleStates();
      }
    });
  }
}
