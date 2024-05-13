import { Component, Input } from '@angular/core';
import { ListsSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { PropertyForm } from '../property-form.type';

@Component({
  selector: 'app-gui-attr-list',
  template: `
    <mat-form-field class="large-field">
      <span matPrefix> <mat-icon>tune</mat-icon>&nbsp; </span>
      <mat-label>Select a list</mat-label>
      <mat-select [formControl]="control">
        <mat-option *ngFor="let item of lists$ | async" [value]="item.id">
          {{ item.labels[0].value }}
        </mat-option>
      </mat-select>
      <mat-error *ngIf="control.invalid && control.touched && control.errors as errors">
        {{ errors[0] | humanReadableError }}
      </mat-error>
    </mat-form-field>
  `,
  styles: ['.large-field {width: 100%}'],
})
export class GuiAttrListComponent {
  @Input() control!: PropertyForm['controls']['guiAttr'];
  lists$ = this._store.select(ListsSelectors.listsInProject);

  constructor(private _store: Store) {}
}
