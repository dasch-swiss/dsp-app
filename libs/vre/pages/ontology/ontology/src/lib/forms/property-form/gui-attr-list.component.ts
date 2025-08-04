import { Component, Input } from '@angular/core';
import { ListNodeInfo } from '@dasch-swiss/dsp-js';
import { ListsSelectors } from '@dasch-swiss/vre/core/state';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Store } from '@ngxs/store';
import { combineLatest, map, tap } from 'rxjs';
import { PropertyForm } from './property-form.type';

@Component({
  selector: 'app-gui-attr-list',
  template: `
    <mat-form-field class="large-field">
      <span matPrefix> <mat-icon>tune</mat-icon>&nbsp; </span>
      <mat-label>Select a list</mat-label>
      <mat-select [formControl]="control">
        <mat-option *ngFor="let list of lists$ | async" [value]="list.id">
          {{ list.labels | appStringifyStringLiteral }}
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
  @Input({ required: true }) control!: PropertyForm['controls']['guiAttr'];
  lists$ = this._store.select(ListsSelectors.listsInProject);

  constructor(private _store: Store) {}
}
