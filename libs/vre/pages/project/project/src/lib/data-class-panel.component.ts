import { AsyncPipe } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { ReadOntology, ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { DataClassSortHeaderComponent } from './data-class-sort-header.component';
import { DataClassUrlStateService } from './data-class-url-state.service';
import { DataTableFetcherComponent } from './sidenav/resource-class-sidenav/data-table-fetcher.component';
import { ResourcesListFetcherComponent } from './sidenav/resource-class-sidenav/resources-list-fetcher.component';

/** The result column of the class view, in whichever view the URL asks for. */
@Component({
  selector: 'app-data-class-panel',
  template: `
    @if ((view$ | async) === 'table') {
      <app-data-table-fetcher
        [ontologyLabel]="classSelected.ontologyLabel"
        [classLabel]="classSelected.classLabel"
        [ontology]="classSelected.ontology"
        [resClass]="classSelected.resClass" />
    } @else {
      <!-- Outside the fetcher: a header inside its swapping template would be recreated on every
           re-query and lose keyboard focus mid-sort. -->
      <app-data-class-sort-header />
      <app-resources-list-fetcher
        [ontologyLabel]="classSelected.ontologyLabel"
        [classLabel]="classSelected.classLabel" />
    }
  `,
  imports: [AsyncPipe, DataClassSortHeaderComponent, ResourcesListFetcherComponent, DataTableFetcherComponent],
})
export class DataClassPanelComponent {
  /** `ontology` is for the table, which takes column labels and value types from its property definitions. */
  @Input() classSelected!: {
    classLabel: string;
    ontologyLabel: string;
    ontology: ReadOntology;
    resClass: ResourceClassDefinitionWithAllLanguages;
  };

  readonly view$ = inject(DataClassUrlStateService).view$;
}
