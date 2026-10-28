import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { LocalizationService, OntologyService, SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe } from '@ngx-translate/core';
import { combineLatest, map } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { DataModelGraphService } from '../sidenav/data-model-map/data-model-graph.service';
import { DataModelMapComponent } from '../sidenav/data-model-map/data-model-map.component';
import { ResourceClassPanelComponent } from './resource-class-panel.component';

/** Query parameters of the Ontology map tab: the data model to show and the class to outline, if any. */
export const ONTOLOGY_MAP_PARAM = { ontology: 'ontology', class: 'class' } as const;

/**
 * The Ontology map tab: the map of one data model of the project, drawn large across the page. A class clicked on
 * it opens its details in a panel docked at the right, from which it can be browsed in the Data tab or edited.
 */
@Component({
  selector: 'app-ontology-map-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataModelMapComponent, MatButtonToggle, MatButtonToggleGroup, ResourceClassPanelComponent, TranslatePipe],
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
        @if (graph(); as graph) {
          <div class="body">
            <app-data-model-map
              [graph]="graph"
              [selectedIri]="classIri()"
              [anyResourceLabel]="t + '.anyResource' | translate"
              [full]="true"
              (classSelected)="panelIri.set($event)" />
            @if (panelIri(); as openIri) {
              <app-resource-class-panel
                class="panel"
                [graph]="graph"
                [classIri]="openIri"
                [dataModelLabel]="selected.label"
                [anyResourceLabel]="t + '.anyResource' | translate"
                [subclassLabel]="t + '.subclassOf' | translate"
                [canEdit]="canEdit() ?? false"
                (classSelected)="panelIri.set($event)"
                (closed)="panelIri.set(undefined)"
                (browse)="open($event)"
                (edit)="edit($event)" />
            }
          </div>
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

      // The map and, when a class is open, its panel beside it; the map narrows to make room.
      .body {
        flex: 1;
        min-height: 0;
        display: flex;
        gap: 8px;
      }

      app-data-model-map {
        flex: 1;
        min-width: 0;
      }

      .panel {
        flex: none;
        width: 440px;
        max-width: 50%;
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
  readonly canEdit = toSignal(inject(ProjectPageService).hasProjectAdminRights$);

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

  /** The class whose panel is open. */
  readonly panelIri = signal<string | undefined>(undefined);
  /** The class the map outlines: the one whose panel is open, else the one named in the URL. */
  readonly classIri = computed(() => this.panelIri() ?? this._params()?.get(ONTOLOGY_MAP_PARAM.class) ?? undefined);

  show(ontologyIri: string): void {
    this.panelIri.set(undefined);
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

  /** Opens the class's data model in the data model editor. */
  edit(iri: string): void {
    const [ontologyIri] = iri.split('#');
    this._router.navigate(
      [
        '..',
        RouteConstants.ontology,
        OntologyService.getOntologyNameFromIri(ontologyIri),
        RouteConstants.editor,
        RouteConstants.classes,
      ],
      { relativeTo: this._route }
    );
  }
}
