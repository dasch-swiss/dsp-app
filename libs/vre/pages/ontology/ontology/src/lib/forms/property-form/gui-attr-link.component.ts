import { Component, Input } from '@angular/core';
import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { LocalizationService, SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
import { combineLatest, map } from 'rxjs';
import { PropertyForm } from './property-form.type';

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
          <mat-option *ngFor="let oClass of onto.classes" [value]="oClass.id">
            {{ oClass.labels | appStringifyStringLiteral }}</mat-option
          >
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

  ontologyClasses$ = combineLatest([
    this._projectPageService.ontologies$,
    this._localizationService.currentLanguage$,
  ]).pipe(
    map(([response, lang]) => {
      const ontologyClasses = [] as ClassToSelect[];
      response.forEach(onto => {
        const classes = onto.getClassDefinitionsByType(ResourceClassDefinitionWithAllLanguages);
        const classDefs = SortingHelper.sortByLabelsAlphabetically(classes, 'label', lang);
        if (classDefs.length) {
          ontologyClasses.push({
            ontologyId: onto.id,
            ontologyLabel: onto.label,
            classes: classDefs,
          } as ClassToSelect);
        }
      });
      return ontologyClasses;
    })
  );

  constructor(
    private _projectPageService: ProjectPageService,
    private _localizationService: LocalizationService
  ) {}
}
