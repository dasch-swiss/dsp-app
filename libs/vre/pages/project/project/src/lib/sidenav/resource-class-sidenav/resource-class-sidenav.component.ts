import { AsyncPipe } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { OntologyAndResourceClasses, ResourceClassAndCountDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { LocalizationService, SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
import { combineLatest, map, Observable, ReplaySubject } from 'rxjs';
import { ResourceClassSidenavItemComponent } from './resource-class-sidenav-item.component';

@Component({
  selector: 'app-resource-class-sidenav',
  template: `
    @for (classToDisplay of resourceClassCounts$ | async; track $index) {
      <app-resource-class-sidenav-item
        [count]="classToDisplay.itemCount"
        [label]="classToDisplay.resourceClass.label!"
        [iri]="classToDisplay.resourceClass.iri"
        [representationClass]="classToDisplay.resourceClass.representationClass" />
    }
  `,
  imports: [AsyncPipe, ResourceClassSidenavItemComponent],
})
export class ResourceClassSidenavComponent implements OnChanges {
  @Input({ required: true }) ontology!: OntologyAndResourceClasses;

  // ReplaySubject (no initial value) so consumers don't need to filter out a `null`
  // placeholder for the gap between construction and the first ngOnChanges.
  private readonly _ontology$ = new ReplaySubject<OntologyAndResourceClasses>(1);

  resourceClassCounts$: Observable<ResourceClassAndCountDto[]> = combineLatest([
    this._ontology$,
    this._localizationService.currentLanguage$,
  ]).pipe(
    map(([ontology, lang]) =>
      SortingHelper.sortByLocalizedString(ontology.classesAndCount || [], rcc => rcc.resourceClass.label, lang)
    )
  );

  constructor(private readonly _localizationService: LocalizationService) {}

  ngOnChanges() {
    this._ontology$.next(this.ontology);
  }
}
