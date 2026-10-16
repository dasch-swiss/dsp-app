import { AsyncPipe } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { ReadOntology, ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { DataClassSortHeaderComponent } from './data-class-sort-header.component';
import { DataClassUrlStateService } from './data-class-url-state.service';
import { DataTableFetcherComponent } from './sidenav/resource-class-sidenav/data-table-fetcher.component';
import { ResourcesListFetcherComponent } from './sidenav/resource-class-sidenav/resources-list-fetcher.component';

/**
 * The result column of the class view, in whichever view the URL asks for.
 *
 * The class identity, its actions, the filter bar, the result count and the view toggle all live in
 * {@link DataClassHeaderComponent}, which the class view renders above the split — so this is just
 * the results.
 */
@Component({
  selector: 'app-data-class-panel',
  template: `
    @if ((view$ | async) === 'table') {
      <!-- No sort header in table view: sorting is done from the column headers, and offering two
           controls for one piece of state invites the user to wonder which one wins. -->
      <app-data-table-fetcher
        [ontologyLabel]="classSelected.ontologyLabel"
        [classLabel]="classSelected.classLabel"
        [ontology]="classSelected.ontology"
        [resClass]="classSelected.resClass" />
    } @else {
      <!-- Outside the fetcher on purpose: the fetcher's template swaps between list, empty state and
           failure panel, and a header living inside it would be destroyed and recreated on every
           re-query — taking keyboard focus with it mid-sort. -->
      <app-data-class-sort-header />
      <app-resources-list-fetcher
        [ontologyLabel]="classSelected.ontologyLabel"
        [classLabel]="classSelected.classLabel" />
    }
  `,
  imports: [AsyncPipe, DataClassSortHeaderComponent, ResourcesListFetcherComponent, DataTableFetcherComponent],
})
export class DataClassPanelComponent {
  /**
   * `ontology` is carried through for the table, which builds its columns from the ontology's own
   * property definitions — the class's `propertiesList` holds IRIs, cardinalities and gui order,
   * but no definitions to take a label or a value type from.
   */
  @Input() classSelected!: {
    classLabel: string;
    ontologyLabel: string;
    ontology: ReadOntology;
    resClass: ResourceClassDefinitionWithAllLanguages;
  };

  readonly view$ = inject(DataClassUrlStateService).view$;
}
