import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { OntologyAndResourceClasses } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { combineLatest, map } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import { navigateToResourceClass, selectedResourceClassIri$ } from '../resource-class-sidenav/resource-class-route';
import { DataModelFullMapDialogComponent, DataModelFullMapDialogData } from './data-model-full-map-dialog.component';
import { DataModelGraph } from './data-model-graph';
import { DataModelGraphService } from './data-model-graph.service';
import { DataModelMapComponent } from './data-model-map.component';

/** The map of one data model in the sidebar, fed from the project's data models and the class in the URL. */
@Component({
  selector: 'app-data-model-map-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataModelMapComponent, TranslatePipe],
  template: `
    @if (graph(); as graph) {
      <app-data-model-map
        [graph]="graph"
        [selectedIri]="selectedIri()"
        [anyResourceLabel]="'pages.dataBrowser.dataModelMap.anyResource' | translate"
        (classSelected)="open($event)"
        (openFullMap)="openFullMap(graph)" />
    }
  `,
})
export class DataModelMapContainerComponent {
  /** The data model to map. */
  readonly ontology = input.required<OntologyAndResourceClasses>();

  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _dialog = inject(MatDialog);
  private readonly _translate = inject(TranslateService);

  readonly graph = toSignal(
    combineLatest([toObservable(this.ontology), inject(DataModelGraphService).graphs$]).pipe(
      map(([ontology, graphs]) => graphs.get(ontology.ontology.iri))
    )
  );

  readonly selectedIri = toSignal(
    selectedResourceClassIri$(this._router, this._route, inject(OntologyService), inject(ProjectPageService))
  );

  open(iri: string): void {
    navigateToResourceClass(this._router, this._route, iri);
  }

  openFullMap(graph: DataModelGraph): void {
    this._dialog
      .open<DataModelFullMapDialogComponent, DataModelFullMapDialogData, string>(DataModelFullMapDialogComponent, {
        data: {
          title: this.ontology().ontology.label,
          graph,
          selectedIri: this.selectedIri(),
          anyResourceLabel: this._translate.instant('pages.dataBrowser.dataModelMap.anyResource'),
        },
        width: '95vw',
        maxWidth: '1400px',
        height: '90vh',
        autoFocus: 'dialog',
      })
      .afterClosed()
      .subscribe(iri => iri && this.open(iri));
  }
}
