import { Component, Input, OnChanges } from '@angular/core';
import {
  OntologyAndResourceClasses,
  ResourceClassAndCountDto,
  ResourceClassDto,
} from '@dasch-swiss/vre/3rd-party-services/open-api';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { ResourceClassSidenavItemComponent } from './resource-class-sidenav-item.component';

@Component({
  selector: 'app-resource-class-sidenav',
  template: `
    @for (classToDisplay of resourceClassCounts; track $index) {
      <app-resource-class-sidenav-item
        [count]="classToDisplay.itemCount"
        [label]="classToDisplay.resourceClass.label!"
        [iri]="classToDisplay.resourceClass.iri"
        [representationClass]="classToDisplay.resourceClass.representationClass" />
    }
  `,
  imports: [ResourceClassSidenavItemComponent],
})
export class ResourceClassSidenavComponent implements OnChanges {
  @Input({ required: true }) ontology!: OntologyAndResourceClasses;
  resourceClassCounts: ResourceClassAndCountDto[] = [];

  constructor(private readonly _localizationService: LocalizationService) {}

  ngOnChanges() {
    const lang = this._localizationService.getCurrentLanguage();
    const classesCount = this.ontology.classesAndCount || [];

    this.resourceClassCounts = [...classesCount].sort((a, b) => {
      const labelA = this.getLabelInLanguage(a.resourceClass, lang).toLowerCase();
      const labelB = this.getLabelInLanguage(b.resourceClass, lang).toLowerCase();
      return labelA.localeCompare(labelB);
    });
  }

  getLabelInLanguage(resourceClass: ResourceClassDto, lang = 'en'): string {
    return resourceClass.label ? resourceClass.label.find(l => l.language === lang)?.value || '' : '';
  }
}
