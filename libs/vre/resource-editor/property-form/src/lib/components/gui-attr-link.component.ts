import { Component, Input } from '@angular/core';
import { ReadOntology, ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { getAllEntityDefinitionsAsArray } from '@dasch-swiss/vre/3rd-party-services/api';
import { OntologiesSelectors } from '@dasch-swiss/vre/core/state';
import { LocalizationService, OntologyClassHelper, SortingService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Store } from '@ngxs/store';
import { map } from 'rxjs/operators';
import { PropertyForm } from '../property-form.type';

export interface ClassToSelect {
  ontologyId: string;
  ontologyLabel: string;
  classes: ResourceClassDefinitionWithAllLanguages[];
}

@Component({
  selector: 'app-gui-attr-link',
  template: `
    <mat-form-field>
      <span matPrefix> <mat-icon>tune</mat-icon>&nbsp; </span>
      <mat-label>Select resource class</mat-label>
      <mat-select [formControl]="control">
        <mat-optgroup *ngFor="let onto of ontologyClasses$ | async" [label]="onto.ontologyLabel">
          <mat-option *ngFor="let oClass of onto.classes" [value]="oClass.id"> {{ getClassLabel(oClass) }}</mat-option>
        </mat-optgroup>
      </mat-select>
      <mat-error *ngIf="control.invalid && control.touched && control.errors![0] as error">
        {{ error | humanReadableError }}
      </mat-error>
    </mat-form-field>
  `,
  styles: ['mat-form-field {width: 100%}'],
})
export class GuiAttrLinkComponent {
  @Input({ required: true }) control!: PropertyForm['controls']['guiAttr'];

  ontologyClasses$ = this._store.select(OntologiesSelectors.currentProjectOntologies).pipe(
    map((response: ReadOntology[]) => {
      // reset list of ontology classes
      const lang = this._localizationService.getCurrentLanguage();
      const ontologyClasses = [] as ClassToSelect[];
      response.forEach(onto => {
        const classDef = this._sortingService.sortLabelsAlphabetically(
          getAllEntityDefinitionsAsArray(onto.classes),
          'label',
          lang
        ) as ResourceClassDefinitionWithAllLanguages[];
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

  getClassLabel(classDef: ResourceClassDefinitionWithAllLanguages) {
    return OntologyClassHelper.getClassLabelByLanguage(classDef, this._localizationService.getCurrentLanguage());
  }

  constructor(
    private _store: Store,
    private _sortingService: SortingService,
    private _localizationService: LocalizationService
  ) {}
}
