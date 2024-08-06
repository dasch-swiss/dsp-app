import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { PropertyInfoObject } from '@dasch-swiss/vre/shared/app-helper-services';
import { CardinalityChangeDialogComponent, CardinalityInfo } from './cardinality-change-dialog.component';

@Component({
  selector: 'app-cardinality',
  styles: ['.toggles { display: flex; justify-content: center; gap: 16px; margin-bottom: 16px;}'],
  template: `
    <div class="toggles">
      <mat-slide-toggle
        [matTooltip]="'Whether the property in this class can have multiple values or not'"
        matTooltipPosition="above"
        [(ngModel)]="multipleToggleState"
        (change)="onToggleChange()">
        Multiple values
      </mat-slide-toggle>

      <mat-slide-toggle
        [matTooltip]="'Whether the property in this class must have one value or not'"
        matTooltipPosition="above"
        [(ngModel)]="requiredToggleState"
        (change)="onToggleChange()">
        Required
      </mat-slide-toggle>
    </div>
  `,
})
export class CardinalityComponent implements OnInit {
  @Input() propertyInfo!: PropertyInfoObject;
  @Input() classIri!: string;
  @Input() cardinality!: Cardinality;
  @Output() cardinalityChange = new EventEmitter<Cardinality>();

  multipleToggleState = false;
  requiredToggleState = false;

  private _dialogRef: MatDialogRef<CardinalityChangeDialogComponent> | undefined;

  constructor(private _dialog: MatDialog) {}

  ngOnInit() {
    this._initToggleStates();
  }

  private _initToggleStates() {
    this.multipleToggleState = this.cardinality === Cardinality._0_n || this.cardinality === Cardinality._1_n;
    this.requiredToggleState = this.cardinality === Cardinality._1 || this.cardinality === Cardinality._1_n;
  }

  private _determineTargetCardinality(): Cardinality {
    if (this.multipleToggleState) {
      return this.requiredToggleState ? Cardinality._1_n : Cardinality._0_n;
    } else {
      return this.requiredToggleState ? Cardinality._1 : Cardinality._0_1;
    }
  }

  onToggleChange() {
    const targetCardinality: Cardinality = this._determineTargetCardinality();
    const cardinalityInfo: CardinalityInfo = {
      classIri: this.classIri,
      propertyInfo: this.propertyInfo,
      currentCardinality: this.cardinality,
      targetCardinality,
    };
    const dialogConfig: MatDialogConfig = {
      data: cardinalityInfo,
      autoFocus: false,
    };

    this._dialogRef = this._dialog.open(CardinalityChangeDialogComponent, dialogConfig);

    this._dialogRef.afterClosed().subscribe((performChange: boolean) => {
      if (performChange) {
        this.cardinality = targetCardinality;
        this.cardinalityChange.emit(targetCardinality);
      } else {
        // reset
        this._initToggleStates();
      }
    });
  }
}
