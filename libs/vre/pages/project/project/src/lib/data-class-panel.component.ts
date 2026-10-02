import { AsyncPipe } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { DataClassSortHeaderComponent } from './data-class-sort-header.component';
import { DataClassUrlStateService } from './data-class-url-state.service';
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
      <p class="table-placeholder">Table view</p>
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
  imports: [AsyncPipe, DataClassSortHeaderComponent, ResourcesListFetcherComponent],
})
export class DataClassPanelComponent {
  @Input() classSelected!: {
    classLabel: string;
    ontologyLabel: string;
    resClass: ResourceClassDefinitionWithAllLanguages;
  };

  readonly view$ = inject(DataClassUrlStateService).view$;
}
