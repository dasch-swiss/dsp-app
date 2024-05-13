import { Component, Input, Optional } from '@angular/core';
import { of } from 'rxjs';
import { FormValueGroup } from './form-value-array.type';
import { PropertiesDisplayService } from './properties-display.service';

@Component({
  selector: 'app-property-value-comment',
  template: `
    <div *ngIf="displayMode; else editMode">
      <div
        *ngIf="(showAllComments$ | async) && control.value !== null"
        style="border-top: 1px solid #ebebeb; margin-top: 8px; margin-bottom: 16px; padding-top: 4px; font-size: small">
        {{ control.value }}
      </div>
    </div>

    <ng-template #editMode>
      <mat-form-field
        style="flex: 1; width: 100%; margin: 10px 0"
        subscriptSizing="dynamic"
        class="formfield"
        *ngIf="!displayMode">
        <mat-icon matPrefix style="color: #808080" *ngIf="control.disabled">lock</mat-icon>
        <textarea matInput rows="1" [placeholder]="'Comment'" [formControl]="control"></textarea>
      </mat-form-field>
    </ng-template>
  `,
})
export class PropertyValueCommentComponent {
  @Input({ required: true }) displayMode!: boolean;
  @Input({ required: true }) control!: FormValueGroup['controls']['comment'];
  showAllComments$ = this._propertiesDisplayService?.showComments$ ?? of(true);

  constructor(@Optional() private _propertiesDisplayService: PropertiesDisplayService) {}
}
