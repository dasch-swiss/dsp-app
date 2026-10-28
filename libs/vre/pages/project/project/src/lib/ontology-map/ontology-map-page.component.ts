import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { LocalizationService, OntologyService, SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe } from '@ngx-translate/core';
import { combineLatest, map } from 'rxjs';
import { DataModelGraphService } from '../sidenav/data-model-map/data-model-graph.service';
import { DataModelMapComponent } from '../sidenav/data-model-map/data-model-map.component';

/** Query parameters of the Ontology map tab: the data model to show and the class to outline, if any. */
export const ONTOLOGY_MAP_PARAM = { ontology: 'ontology', class: 'class' } as const;

/** The Ontology map tab: the map of one data model of the project, drawn large. */
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

      @if (selected(); as selected) {
        <h1 class="title">
          {{ selected.label }}
          @if (graph(); as graph) {
            @let classCount = classCountOf(graph);
            <span class="class-count">
              {{ t + (classCount === 1 ? '.classCountOne' : '.classCount') | translate: { count: classCount } }}
            </span>
          }
        </h1>
        @if (graph(); as graph) {
          <app-data-model-map
            [graph]="graph"
            [selectedIri]="classIri()"
            [anyResourceLabel]="t + '.anyResource' | translate"
            [full]="true"
            (classSelected)="open($event)" />
        }
      } @else if (ontologiesLoaded()) {
        <p class="empty">{{ 'pages.ontologyMap.noDataModels' | translate }}</p>
      }
    </div>
  `,
  styles: [
    `
      .page {
        box-sizing: border-box;
        max-width: 1440px;
        margin: 0 auto;
        padding: 24px;
      }

      .ontologies {
        margin-bottom: 16px;
        --mat-button-toggle-height: 32px;
        --mat-button-toggle-label-text-size: 13px;
      }

      .title {
        margin: 0 0 12px;
        font-size: 22px;
        font-weight: 500;
        line-height: 28px;
      }

      .class-count {
        margin-left: 8px;
        font-size: 14px;
        font-weight: 400;
        color: #6b7280;
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
  readonly classIri = computed(() => this._params()?.get(ONTOLOGY_MAP_PARAM.class) ?? undefined);

  classCountOf(graph: { nodes: { kind: string }[] }): number {
    return graph.nodes.filter(node => node.kind === 'class').length;
  }

  show(ontologyIri: string): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: { [ONTOLOGY_MAP_PARAM.ontology]: OntologyService.getOntologyNameFromIri(ontologyIri) },
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
