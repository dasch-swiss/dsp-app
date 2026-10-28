import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DspDialogConfig, RouteConstants } from '@dasch-swiss/vre/core/config';
import { LocalizationService, OntologyService, SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { combineLatest, map } from 'rxjs';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { DataModelGraphService } from '../sidenav/data-model-map/data-model-graph.service';
import { DataModelMapComponent } from '../sidenav/data-model-map/data-model-map.component';
import {
  ResourceClassDetailsDialogComponent,
  ResourceClassDetailsDialogData,
} from './resource-class-details-dialog.component';

/** Query parameters of the Ontology map tab: the data model to show and the class to outline, if any. */
export const ONTOLOGY_MAP_PARAM = { ontology: 'ontology', class: 'class' } as const;

/**
 * The Ontology map tab: the map of one data model of the project, drawn large across the page. A class clicked on
 * it opens its details in a side panel, from which it can be opened in the Data tab.
 */
@Component({
  selector: 'app-ontology-map-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataModelMapComponent, MatButtonToggle, MatButtonToggleGroup, TranslatePipe],
  template: `
    @let t = 'pages.dataBrowser.dataModelMap';
    <div class="page">
      @if (ontologies().length > 1) {
        <mat-button-toggle-group
          class="ontologies"
          hideSingleSelectionIndicator
          data-cy="ontology-map-ontologies"
          [attr.aria-label]="'pages.ontologyMap.dataModels' | translate"
          [value]="selected()?.iri"
          (change)="show($event.value)">
          @for (ontology of ontologies(); track ontology.iri) {
            <mat-button-toggle [value]="ontology.iri">{{ ontology.label }}</mat-button-toggle>
          }
        </mat-button-toggle-group>
      }

      @if (selected()) {
        @if (graph(); as graph) {
          <app-data-model-map
            [graph]="graph"
            [selectedIri]="classIri()"
            [anyResourceLabel]="t + '.anyResource' | translate"
            [full]="true"
            (classSelected)="showDetails(graph, $event)" />
        }
      } @else if (ontologiesLoaded()) {
        <p class="empty">{{ 'pages.ontologyMap.noDataModels' | translate }}</p>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      // The tab's whole height, the map box stretched to fill it.
      .page {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        height: 100%;
        // As the data model editor: 8px around the content.
        padding: 8px;
      }

      app-data-model-map {
        flex: 1;
        min-height: 0;
      }

      .ontologies {
        margin-bottom: 16px;
        --mat-button-toggle-height: 32px;
        --mat-button-toggle-label-text-size: 13px;
      }

      .empty {
        color: #6b7280;
      }
    `,
  ],
})
export class OntologyMapPageComponent {
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _graphs = inject(DataModelGraphService);
  private readonly _dialog = inject(MatDialog);
  private readonly _translate = inject(TranslateService);

  private readonly _projectOntologies = toSignal(
    combineLatest([this._graphs.projectOntologies$, inject(LocalizationService).currentLanguage$]).pipe(
      map(([ontologies, lang]) =>
        ontologies
          .map(({ ontology }) => ({ iri: ontology.iri, label: ontology.label }))
          .sort((a, b) => SortingHelper.compareStringsByLanguage(a.label, b.label, lang))
      )
    )
  );
  readonly ontologies = computed(() => this._projectOntologies() ?? []);
  readonly ontologiesLoaded = computed(() => this._projectOntologies() !== undefined);

  private readonly _graphsByIri = toSignal(this._graphs.graphs$);
  private readonly _params = toSignal(this._route.queryParamMap);

  /** The data model named in the URL, else the first one. */
  readonly selected = computed(() => {
    const name = this._params()?.get(ONTOLOGY_MAP_PARAM.ontology);
    const ontologies = this.ontologies();
    return ontologies.find(o => OntologyService.getOntologyNameFromIri(o.iri) === name) ?? ontologies[0];
  });
  readonly graph = computed(() => {
    const iri = this.selected()?.iri;
    return iri ? this._graphsByIri()?.get(iri) : undefined;
  });
  /** The class whose details are open, else the one named in the URL: the map outlines it. */
  private readonly _detailsIri = signal<string | undefined>(undefined);
  readonly classIri = computed(() => this._detailsIri() ?? this._params()?.get(ONTOLOGY_MAP_PARAM.class) ?? undefined);

  show(ontologyIri: string): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: { [ONTOLOGY_MAP_PARAM.ontology]: OntologyService.getOntologyNameFromIri(ontologyIri) },
    });
  }

  showDetails(graph: DataModelGraph, classIri: string): void {
    this._detailsIri.set(classIri);
    this._dialog
      .open<ResourceClassDetailsDialogComponent, ResourceClassDetailsDialogData, string>(
        ResourceClassDetailsDialogComponent,
        {
          ...DspDialogConfig.dialogDrawerConfig(
            {
              graph,
              classIri,
              anyResourceLabel: this._translate.instant('pages.dataBrowser.dataModelMap.anyResource'),
              subclassLabel: this._translate.instant('pages.dataBrowser.dataModelMap.subclassOf'),
            },
            true
          ),
          width: '520px',
          minWidth: 0,
          maxWidth: '100vw',
        }
      )
      .afterClosed()
      .subscribe(iri => {
        this._detailsIri.set(undefined);
        if (iri) this.open(iri);
      });
  }

  /** Opens the class in the Data tab. */
  open(iri: string): void {
    const [ontologyIri, className] = iri.split('#');
    this._router.navigate(['..', RouteConstants.data, OntologyService.getOntologyNameFromIri(ontologyIri), className], {
      relativeTo: this._route,
    });
  }
}
