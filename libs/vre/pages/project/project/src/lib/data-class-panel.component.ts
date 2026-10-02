import { Component, Input } from '@angular/core';
import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { DataClassSortHeaderComponent } from './data-class-sort-header.component';
import { ResourcesListFetcherComponent } from './sidenav/resource-class-sidenav/resources-list-fetcher.component';

/**
 * The list column of the class view.
 *
 * The class identity, its actions, the filter bar and the result count all moved up into
 * {@link DataClassHeaderComponent}, which the class view renders above the split — so this is now
 * just the list.
 */
@Component({
  selector: 'app-data-class-panel',
  template: `
    <!-- Outside the fetcher on purpose: the fetcher's template swaps between list, empty state and
         failure panel, and a header living inside it would be destroyed and recreated on every
         re-query — taking keyboard focus with it mid-sort. -->
    <app-data-class-sort-header />
    <app-resources-list-fetcher [ontologyLabel]="classSelected.ontologyLabel" [classLabel]="classSelected.classLabel" />
  `,
  imports: [DataClassSortHeaderComponent, ResourcesListFetcherComponent],
})
export class DataClassPanelComponent {
  @Input() classSelected!: {
    classLabel: string;
    ontologyLabel: string;
    resClass: ResourceClassDefinitionWithAllLanguages;
  };
}
