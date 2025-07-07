import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { ReplaceAnimation } from '@dasch-swiss/vre/shared/app-common';
import { BehaviorSubject, Subject } from 'rxjs';
import { last, takeUntil } from 'rxjs/operators';
import { PropertyValueService } from '../property-value.service';
import { IsSwitchComponent } from './is-switch-component.interface';

@Component({
  selector: 'app-toggle-switch',
  styles: [
    `
      .nullable-boolean {
        button {
          margin-left: 20px;
        }

        display: flex;
        align-items: center;
      }
    `,
  ],
  animations: [ReplaceAnimation.animationLong],
  template: `
    <button
      mat-icon-button
      (click)="add()"
      data-cy="add-bool-toggle"
      *ngIf="!isCreatingBoolean && editModeData === null && !currentlyAdding && !isRequired && !displayMode">
      <mat-icon class="add-icon">add_box</mat-icon>
    </button>
    <div class="nullable-boolean">
      <mat-slide-toggle
        @replaceAnimation
        [formControl]="formControl"
        [disabled]="displayMode"
        data-cy="bool-toggle"
        *ngIf="isVisible" />
      <button mat-icon-button (click)="cancel()" title="Cancel" *ngIf="isCreatingBoolean">
        <mat-icon>cancel</mat-icon>
      </button>
    </div>
  `,
})
export class ToggleSwitchComponent implements IsSwitchComponent, OnInit, OnDestroy {
  @Input() control!: FormControl<boolean | null>;
  @Input() displayMode = true;

  destroyed: Subject<void> = new Subject<void>();

  displayModeChanged$ = new BehaviorSubject<boolean>(this.displayMode);

  isCreatingBoolean = false;
  currentlyAdding = this._propertyValueService.currentlyAdding;
  editModeData = this._propertyValueService.editModeData;

  get formControl() {
    return this.control as FormControl<boolean>;
  }

  get isRequired() {
    return [Cardinality._1, Cardinality._1_n].includes(this._propertyValueService.cardinality);
  }

  get isVisible() {
    return this.editModeData !== null || this.isCreatingBoolean || this.isRequired;
  }

  constructor(private _propertyValueService: PropertyValueService) {}

  ngOnInit() {
    if (!this.isRequired && this.editModeData === null) {
      this.control.patchValue(null);
    }

    this.toggleControl(this.displayMode);
    this.displayModeChanged$
      .pipe(takeUntil(this.destroyed), last())
      .subscribe(displayMode => this.toggleControl(displayMode));

    this.control.valueChanges.pipe(takeUntil(this.destroyed)).subscribe(value => {
      if (value === undefined) {
        this.control.patchValue(null);
      }
    });
  }

  add() {
    this.control.patchValue(false);
    this.isCreatingBoolean = true;
    this.control.enable();
  }

  cancel() {
    this.isCreatingBoolean = false;
    this.control.disable();
    this.control.patchValue(null);
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  private toggleControl(displayMode: boolean) {
    if (displayMode) {
      this.control.disable();
    } else {
      this.control.enable();
    }
  }
}
