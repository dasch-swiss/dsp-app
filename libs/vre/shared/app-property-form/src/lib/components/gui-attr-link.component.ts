import { Component, Input } from '@angular/core';
import { ClassDefinition, ReadOntology } from '@dasch-swiss/dsp-js';
import { getAllEntityDefinitionsAsArray } from '@dasch-swiss/vre/shared/app-api';
import { SortingService } from '@dasch-swiss/vre/shared/app-helper-services';
import { OntologiesSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { map } from 'rxjs/operators';
import { PropertyForm } from '../property-form.type';

export interface ClassToSelect {
  ontologyId: string;
  ontologyLabel: string;
  classes: ClassDefinition[];
}

@Component({
  selector: 'app-gui-attr-link',
  template: `
    <mat-form-field>
      <span matPrefix> <mat-icon>tune</mat-icon>&nbsp; </span>
      <mat-label>Select resource class</mat-label>
      <mat-select [formControl]="control">
        <mat-optgroup *ngFor="let onto of ontologyClasses$ | async" [label]="onto.ontologyLabel">
          <mat-option *ngFor="let oClass of onto.classes" [value]="oClass.id"> {{ oClass.label }}</mat-option>
        </mat-optgroup>
      </mat-select>
      <mat-error *ngIf="control.invalid && control.touched"> {{ control.errors[0] | humanReadableError }} </mat-error>
    </mat-form-field>
  `,
  styles: ['mat-form-field {width: 100%}'],
})
export class GuiAttrLinkComponent {
  @Input() control: PropertyForm['controls']['guiAttr'];

  ontologyClasses$ = this._store.select(OntologiesSelectors.currentProjectOntologies).pipe(
    map((response: ReadOntology[]) => {
      // reset list of ontology classes
      const ontologyClasses = [] as ClassToSelect[];
      response.forEach(onto => {
        const classDef = this._sortingService.keySortByAlphabetical(
          getAllEntityDefinitionsAsArray(onto.classes),
          'label'
        );
        if (classDef.length) {
          const ontoClasses: ClassToSelect = {
            ontologyId: onto.id,
            ontologyLabel: onto.label,
            classes: classDef,
          };
          ontologyClasses.push(ontoClasses);
        }
      });
      return ontologyClasses;
    })
  );

  constructor(
    private _store: Store,
    private _sortingService: SortingService
  ) {}
}
