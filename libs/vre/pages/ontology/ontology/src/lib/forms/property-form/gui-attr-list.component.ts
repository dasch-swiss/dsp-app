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
        <mat-option *ngFor="let item of localizedLists$ | async" [value]="item.id">
          {{ item.localizedLabel }}
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

  localizedLists$ = combineLatest([this.lists$, this._localizationService.currentLanguage$]).pipe(
    map(([lists, lang]) =>
      lists.map((item: ListNodeInfo) => ({
        ...item,
        localizedLabel: item.labels.find((label: any) => label.language === lang)?.value || item.labels[0]?.value || '',
      }))
    )
  );

  constructor(
    private _store: Store,
    private _localizationService: LocalizationService
  ) {}
}
