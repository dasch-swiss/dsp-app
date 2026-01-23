import { Component, Input } from '@angular/core';
import { OntologyAndResourceClasses } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { ResourceClassSidenavItemComponent } from './resource-class-sidenav-item.component';

@Component({
  selector: 'app-resource-class-sidenav',
  template: `
    @for (classToDisplay of ontology.classesAndCount; track $index) {
      <app-resource-class-sidenav-item
        [count]="classToDisplay.itemCount"
        [label]="classToDisplay.resourceClass.label!"
        [iri]="classToDisplay.resourceClass.iri"
        [representationClass]="classToDisplay.resourceClass.representationClass" />
    }
  `,
  imports: [ResourceClassSidenavItemComponent],
})
export class ResourceClassSidenavComponent {
  @Input({ required: true }) ontology!: OntologyAndResourceClasses;
}
