import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { LocalizationService, OntologyService, SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe } from '@ngx-translate/core';
import { combineLatest, map } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { DataModelGraphService } from '../sidenav/data-model-map/data-model-graph.service';
import { DataModelMapComponent, MapDetail } from '../sidenav/data-model-map/data-model-map.component';
import { ResourceClassPanelComponent } from './resource-class-panel.component';

/** Query parameters of the Ontology map tab: the data model to show and the class to outline, if any. */
export const ONTOLOGY_MAP_PARAM = { ontology: 'ontology', class: 'class' } as const;

const DETAIL_KEY = 'dsp-ontology-map-detail';

/**
 * The Ontology map tab: the map of one data model of the project, drawn large across the page, with a toolbar to
 * pick the data model and how much each card shows. A class clicked on it opens its details in a panel docked at
 * the right, from which it can be browsed in the Data tab or edited.
 */
@Component({
  selector: 'app-ontology-map-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DataModelMapComponent,
    MatButton,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    ResourceClassPanelComponent,
    TranslatePipe,
  ],
  template: `
    @let t = 'pages.dataBrowser.dataModelMap';
    @let m = 'pages.ontologyMap';
    <div class="page">
      @if (selected(); as selected) {
        <div class="canvas">
          <div class="toolbar">
            @if (ontologies().length > 1) {
              <button
                mat-stroked-button
                class="data-model"
                data-cy="ontology-map-data-model"
                [matMenuTriggerFor]="dataModels">
                <span class="data-model-label">{{ m + '.dataModel' | translate }}</span>
                <b>{{ selected.label }}</b>
                <mat-icon iconPositionEnd>arrow_drop_down</mat-icon>
              </button>
            } @else {
              <span class="data-model static" data-cy="ontology-map-data-model">
                <span class="data-model-label">{{ m + '.dataModel' | translate }}</span>
                <b>{{ selected.label }}</b>
              </span>
            }
            <mat-menu #dataModels="matMenu">
              @for (ontology of ontologies(); track ontology.iri) {
                <button mat-menu-item (click)="show(ontology.iri)">{{ ontology.label }}</button>
              }
            </mat-menu>
            @if (counts(); as counts) {
              <span class="counts">{{ m + '.counts' | translate: counts }}</span>
            }
            <span class="spacer"></span>
            <mat-button-toggle-group
              class="detail"
              hideSingleSelectionIndicator
              data-cy="ontology-map-detail"
              [attr.aria-label]="m + '.detail' | translate"
              [value]="detail()"
              (change)="setDetail($event.value)">
              <mat-button-toggle value="summary">
                <mat-icon>view_agenda</mat-icon>{{ m + '.summary' | translate }}
              </mat-button-toggle>
              <mat-button-toggle value="properties">
                <mat-icon>list_alt</mat-icon>{{ m + '.properties' | translate }}
              </mat-button-toggle>
            </mat-button-toggle-group>
          </div>

          @if (graph(); as graph) {
            <div class="body">
              <app-data-model-map
                [graph]="graph"
                [selectedIri]="classIri()"
                [anyResourceLabel]="t + '.anyResource' | translate"
                [full]="true"
                [detail]="detail()"
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
        </div>
      } @else if (ontologiesLoaded()) {
        <p class="empty">{{ m + '.noDataModels' | translate }}</p>
      }
    </div>
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      :host {
        display: block;
        height: 100%;
      }

      // The tab's whole height, the map box stretched to fill it.
      .page {
        box-sizing: border-box;
        height: 100%;
        // As the data model editor: 8px around the content.
        padding: 8px;
      }

      // The map's box: the toolbar on top, then the map and, when a class is open, its panel beside it.
      .canvas {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        height: 100%;
        background: $cool_gray_50;
        border: 1px solid $cool_gray_200;
        border-radius: 8px;
        overflow: hidden;
      }

      .toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
      }

      .data-model {
        --mat-button-outlined-container-height: 34px;
        background: white;

        .data-model-label {
          margin-right: 6px;
          font-size: 12px;
          color: $cool_gray_500;
        }

        b {
          font-weight: 500;
        }

        &.static {
          display: inline-flex;
          align-items: center;
          height: 34px;
          padding: 0 12px;
          box-sizing: border-box;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }
      }

      .counts {
        font-size: 12px;
        color: $cool_gray_600;
      }

      .spacer {
        flex: 1;
      }

      .detail {
        --mat-button-toggle-height: 34px;
        --mat-button-toggle-label-text-size: 13px;
        background: white;

        mat-icon {
          margin-right: 6px;
          font-size: 18px;
          width: 18px;
          height: 18px;
          vertical-align: middle;
        }
      }

      .body {
        flex: 1;
        min-height: 0;
        display: flex;
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

      .empty {
        color: $cool_gray_500;
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
  readonly counts = computed(() => {
    const graph = this.graph();
    if (!graph) return undefined;
    return {
      classes: graph.nodes.filter(node => node.kind === 'class').length,
      links: graph.edges.filter(edge => edge.kind === 'link').length,
    };
  });

  /** Whether cards show their summary or their properties; remembered in this browser. */
  readonly detail = signal<MapDetail>(readStored(DETAIL_KEY) === 'properties' ? 'properties' : 'summary');

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

  setDetail(detail: MapDetail): void {
    this.detail.set(detail);
    try {
      localStorage.setItem(DETAIL_KEY, detail);
    } catch {
      // Storage unavailable: the choice lasts until the page reloads.
    }
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

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
