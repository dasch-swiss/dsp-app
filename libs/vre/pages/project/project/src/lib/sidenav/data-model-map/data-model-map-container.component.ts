import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants } from '@dasch-swiss/dsp-js';
import { OntologyAndResourceClasses } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import {
  LocalizationService,
  OntologyService,
  pickPreferredLanguageString,
} from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, combineLatest, map, of } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import { navigateToResourceClass, selectedResourceClassIri$ } from '../resource-class-sidenav/resource-class-route';
import { DataModelFullMapDialogComponent, DataModelFullMapDialogData } from './data-model-full-map-dialog.component';
import { buildDataModelGraph, DataModelGraph } from './data-model-graph';
import { DataModelMapComponent } from './data-model-map.component';

/** The map of one data model in the sidebar, fed from the project's ontologies and the class in the URL. */
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
  /** The data model to map, with its classes and resource counts. */
  readonly ontology = input.required<OntologyAndResourceClasses>();
  /** Every data model of the project, to name classes of other data models that links reach. */
  readonly projectOntologies = input.required<readonly OntologyAndResourceClasses[]>();

  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _projectPageService = inject(ProjectPageService);
  private readonly _dspApiConnection = inject(DspApiConnectionToken);
  private readonly _dialog = inject(MatDialog);
  private readonly _translate = inject(TranslateService);

  /** knora-api declares the built-in links, such as `isPartOf`; it never changes, so the cached copy is fine. */
  private readonly _knoraApi$ = this._dspApiConnection.v2.ontologyCache
    .getOntology(Constants.KnoraApiV2)
    .pipe(map(ontologies => [...ontologies.values()]));

  readonly graph = toSignal(
    combineLatest([
      toObservable(this.ontology),
      toObservable(this.projectOntologies),
      this._projectPageService.ontologies$,
      this._knoraApi$,
      inject(LocalizationService).currentLanguage$,
    ]).pipe(
      map(([ontology, projectOntologies, definitions, knoraApi, language]) =>
        buildDataModelGraph(ontology, projectOntologies, [...definitions, ...knoraApi], labels =>
          pickPreferredLanguageString(labels, language)
        )
      ),
      catchError(error => {
        // The class list below still works; the map is an aid and stays away.
        console.error('Error loading the data model map:', error);
        return of(undefined);
      })
    )
  );

  readonly selectedIri = toSignal(
    selectedResourceClassIri$(this._router, this._route, inject(OntologyService), this._projectPageService)
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
