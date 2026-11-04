import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe } from '@ngx-translate/core';
import { localNameOf } from '../ontology-map/ontology-graph-elements';
import { ONTOLOGY_MAP_PARAM } from '../ontology-map/ontology-map-page.component';
import { ResourceClassPanelComponent } from '../ontology-map/resource-class-panel.component';
import { DataModelsRailState } from './data-models-rail-state';
import { RAIL_SECTION_STYLES } from './rail-section-styles';

/** Data models 2 › Classes: the data model's classes in a table; a clicked one opens its panel. */
@Component({
  selector: 'app-data-model-classes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatFormField,
    MatHeaderCell,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIcon,
    MatInput,
    MatPrefix,
    MatRow,
    MatRowDef,
    MatTable,
    ResourceClassPanelComponent,
    TranslatePipe,
  ],
  template: `
    @let r = 'pages.dataModels2';
    @let t = 'pages.dataBrowser.dataModelMap';
    <div class="section">
      <div class="head">
        <h2>{{ r + '.classes' | translate }}</h2>
        <span class="counts">{{
          'pages.ontologyMap.counts' | translate: { classes: state.classRows().length, links: state.linkCount() }
        }}</span>
        <span class="spacer"></span>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
          <mat-icon matPrefix>search</mat-icon>
          <input
            #search
            matInput
            data-cy="data-model-classes-search"
            [placeholder]="r + '.findClass' | translate"
            [attr.aria-label]="r + '.findClass' | translate"
            (input)="query.set(search.value)" />
        </mat-form-field>
      </div>

      <div class="table-box">
        <table mat-table [dataSource]="rows()" data-cy="data-model-classes">
          <ng-container matColumnDef="class">
            <th mat-header-cell *matHeaderCellDef>{{ r + '.colClass' | translate }}</th>
            <td mat-cell *matCellDef="let row">
              <span class="labelled">
                <span class="swatch" [style.background]="state.colors().get(row.id)"></span>
                <span class="texts">
                  <span class="label">{{ row.label }}</span>
                  <code class="name">{{ row.name }}</code>
                </span>
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="properties">
            <th mat-header-cell *matHeaderCellDef class="number">{{ r + '.colProperties' | translate }}</th>
            <td mat-cell *matCellDef="let row" class="number">{{ row.properties }}</td>
          </ng-container>
          <ng-container matColumnDef="linksTo">
            <th mat-header-cell *matHeaderCellDef>{{ r + '.colLinksTo' | translate }}</th>
            <td mat-cell *matCellDef="let row">
              <span class="chips">
                @for (target of row.linksTo; track target) {
                  <span class="chip" [style.background]="state.colors().get(target) ?? '#F3F4F6'">{{
                    state.labelOf(target)
                  }}</span>
                } @empty {
                  <span class="none">—</span>
                }
              </span>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: columns"
            data-cy="data-model-classes-row"
            tabindex="0"
            [class.selected]="row.id === panelIri()"
            (click)="openPanel(row.id)"
            (keydown.enter)="openPanel(row.id)"></tr>
        </table>
        @if (rows().length === 0) {
          <p class="empty">{{ r + '.noMatch' | translate }}</p>
        }
      </div>

      @if (state.graph(); as graph) {
        @if (panelIri(); as iri) {
          <app-resource-class-panel
            class="panel"
            [graph]="graph"
            [classIri]="iri"
            [anyResourceLabel]="t + '.anyResource' | translate"
            [subclassLabel]="t + '.subclassOf' | translate"
            [canEdit]="state.canEdit()"
            (classSelected)="openPanel($event)"
            (closed)="openPanel(undefined)"
            (browse)="browse($event)"
            (filter)="filterOn($event)"
            (edit)="edit($event)" />
        }
      }
    </div>
  `,
  styles: [RAIL_SECTION_STYLES],
})
export class DataModelClassesComponent {
  readonly state = inject(DataModelsRailState);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _params = toSignal(this._route.queryParamMap);

  readonly columns = ['class', 'properties', 'linksTo'];
  readonly query = signal('');
  readonly rows = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.state
      .classRows()
      .filter(row => !query || row.label.toLowerCase().includes(query) || row.name.toLowerCase().includes(query));
  });

  /** The class whose panel is open, named in the URL like in the graph. */
  readonly panelIri = computed(() => {
    const name = this._params()?.get(ONTOLOGY_MAP_PARAM.panel);
    return name ? this.state.classRows().find(row => row.name === name)?.id : undefined;
  });

  /** Opens the class's panel, or closes it; a step in the browser history. */
  openPanel(classIri: string | undefined): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParamsHandling: 'merge',
      queryParams: { ...this.state.modelParam(), [ONTOLOGY_MAP_PARAM.panel]: classIri ? localNameOf(classIri) : null },
    });
  }

  /** Opens the class in the Data tab. */
  browse(iri: string): void {
    const [ontologyIri, className] = iri.split('#');
    this._router.navigate(
      this.state.projectPath(RouteConstants.data, OntologyService.getOntologyNameFromIri(ontologyIri), className)
    );
  }

  /** Shows the class with the classes it is linked with, in the graph. */
  filterOn(iri: string): void {
    this.state.openSection(RouteConstants.graph, { [ONTOLOGY_MAP_PARAM.filter]: localNameOf(iri) });
  }

  /** Opens the class's data model in the data model editor. */
  edit(iri: string): void {
    const [ontologyIri] = iri.split('#');
    this._router.navigate(
      this.state.projectPath(
        RouteConstants.ontology,
        OntologyService.getOntologyNameFromIri(ontologyIri),
        RouteConstants.editor,
        RouteConstants.classes
      )
    );
  }
}
