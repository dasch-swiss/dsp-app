import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ListApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { LocalizationService, OntologyService, SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
import { combineLatest, map, switchMap } from 'rxjs';
import { familyColors } from '../ontology-map/islands';
import { classRows, propertyRows } from '../ontology-map/ontology-graph-elements';
import { ONTOLOGY_MAP_PARAM } from '../ontology-map/ontology-map-page.component';
import { ProjectPageService } from '../project-page.service';
import { DataModelGraphService } from '../sidenav/data-model-map/data-model-graph.service';

/**
 * What the Data models 2 tab's sections share: the data models of the project, the one the URL names, its graph,
 * tables and colours, and the project's lists. Provided by the tab, so every section reads the same.
 */
@Injectable()
export class DataModelsRailState {
  private readonly _router = inject(Router);
  private readonly _graphs = inject(DataModelGraphService);
  private readonly _project = inject(ProjectPageService);
  private readonly _listApi = inject(ListApiService);
  private readonly _params = toSignal(inject(ActivatedRoute).queryParamMap);

  private readonly _ontologies = toSignal(
    combineLatest([this._graphs.projectOntologies$, inject(LocalizationService).currentLanguage$]).pipe(
      map(([ontologies, lang]) =>
        ontologies
          .map(({ ontology }) => ({ iri: ontology.iri, label: ontology.label }))
          .sort((a, b) => SortingHelper.compareStringsByLanguage(a.label, b.label, lang))
      )
    )
  );
  readonly ontologies = computed(() => this._ontologies() ?? []);
  readonly loaded = computed(() => this._ontologies() !== undefined);
  readonly canEdit = toSignal(this._project.hasProjectAdminRights$, { initialValue: false });

  /** The data model named in the URL, else the first one. */
  readonly selected = computed(() => {
    const name = this._params()?.get(ONTOLOGY_MAP_PARAM.ontology);
    const ontologies = this.ontologies();
    return ontologies.find(o => OntologyService.getOntologyNameFromIri(o.iri) === name) ?? ontologies[0];
  });
  private readonly _graphsByIri = toSignal(this._graphs.graphs$);
  readonly graph = computed(() => {
    const iri = this.selected()?.iri;
    return iri ? this._graphsByIri()?.get(iri) : undefined;
  });
  /** A colour per class, its family's, as the Overview graph draws it. */
  readonly colors = computed(() => {
    const graph = this.graph();
    return graph ? familyColors(graph) : new Map<string, string>();
  });
  readonly classRows = computed(() => {
    const graph = this.graph();
    return graph ? classRows(graph) : [];
  });
  readonly propertyRows = computed(() => {
    const graph = this.graph();
    return graph ? propertyRows(graph) : [];
  });
  readonly linkCount = computed(() => this.graph()?.edges.filter(edge => edge.kind === 'link').length ?? 0);

  readonly lists = toSignal(
    this._project.currentProject$.pipe(
      switchMap(project => this._listApi.listInProject(project.id)),
      map(response => response.lists)
    )
  );

  /** The query parameter that keeps the data model across sections. */
  readonly modelParam = computed(() => {
    const iri = this.selected()?.iri;
    return iri ? { [ONTOLOGY_MAP_PARAM.ontology]: OntologyService.getOntologyNameFromIri(iri) } : {};
  });

  labelOf(iri: string): string {
    return this.graph()?.nodes.find(node => node.id === iri)?.label ?? iri.substring(iri.lastIndexOf('#') + 1);
  }

  /** Opens a section of the tab, keeping the data model; `params` add to it. */
  openSection(section: string, params: Record<string, string> = {}): void {
    this._router.navigate(this.projectPath(RouteConstants.dataModels2, section), {
      queryParams: { ...this.modelParam(), ...params },
    });
  }

  /** The path to a page of the project, from the app's root. */
  projectPath(...segments: string[]): string[] {
    return ['/', RouteConstants.project, this._project.currentProjectUuid, ...segments];
  }
}
