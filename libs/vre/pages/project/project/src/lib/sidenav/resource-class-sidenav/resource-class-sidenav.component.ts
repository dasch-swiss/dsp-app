import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OntologyAndResourceClasses, ResourceClassAndCountDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { LocalizationService, SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
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

  constructor(private readonly _localizationService: LocalizationService) {
    this._localizationService.currentLanguage$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.ngOnChanges();
    });
  }

  ngOnChanges() {
    const lang = this._localizationService.currentLanguage;
    const classesCount = this.ontology.classesAndCount || [];

    // SortingHelper.sortByLabelsAlphabetically looks for a `labels` key on each item.
    // Project this shape onto each entry so the helper can apply its language-fallback
    // logic (preferred language -> any non-empty label) when sorting.
    const decorated = classesCount.map(c => ({ ...c, labels: c.resourceClass.label ?? [] }));
    this.resourceClassCounts = SortingHelper.sortByLabelsAlphabetically(decorated, 'labels', lang);
  }
}
