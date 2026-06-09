import { AsyncPipe } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { OntologyAndResourceClasses, ResourceClassAndCountDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { LocalizationService, SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
import { BehaviorSubject, combineLatest, filter, map, Observable } from 'rxjs';
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

  private readonly _ontology$ = new BehaviorSubject<OntologyAndResourceClasses | null>(null);

  resourceClassCounts$: Observable<ResourceClassAndCountDto[]> = combineLatest([
    this._ontology$.pipe(filter((v): v is OntologyAndResourceClasses => v !== null)),
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
