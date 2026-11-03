import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
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
import { PropertyPanelComponent } from '../ontology-map/property-panel.component';
import { typeIconOf, typeNameOf } from '../ontology-map/property-types';
import { DataModelsRailState } from './data-models-rail-state';
import { RAIL_SECTION_STYLES } from './rail-section-styles';

/** How many classes "Used by" names before it counts the rest. */
const USED_BY_SHOWN = 3;

/** Data models 2 › Properties: every property of the data model in a table; a clicked one opens its panel. */
@Component({
  selector: 'app-data-model-properties',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
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
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatPrefix,
    MatRow,
    MatRowDef,
    MatTable,
    PropertyPanelComponent,
    TranslatePipe,
  ],
  template: `
    @let r = 'pages.dataModels2';
    @let t = 'pages.dataBrowser.dataModelMap';
    <div class="section">
      <div class="head">
        <h2>{{ r + '.properties' | translate }}</h2>
        <span class="counts">{{
          r + '.propertiesCount' | translate: { count: state.propertyRows().length, links: state.linkCount() }
        }}</span>
        <span class="spacer"></span>
        <button mat-stroked-button class="type-filter" data-cy="data-model-properties-type" [matMenuTriggerFor]="types">
          {{ r + '.colType' | translate }}:
          <b>{{ type() ? typeName(type()!) : (r + '.allTypes' | translate) }}</b>
          <mat-icon iconPositionEnd>arrow_drop_down</mat-icon>
        </button>
        <mat-menu #types="matMenu">
          <button mat-menu-item (click)="type.set(undefined)">{{ r + '.allTypes' | translate }}</button>
          @for (option of typeOptions(); track option) {
            <button mat-menu-item (click)="type.set(option)">
              <mat-icon>{{ typeIcon(option) }}</mat-icon
              >{{ typeName(option) }}
            </button>
          }
        </mat-menu>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
          <mat-icon matPrefix>search</mat-icon>
          <input
            #search
            matInput
            data-cy="data-model-properties-search"
            [placeholder]="r + '.findProperty' | translate"
            [attr.aria-label]="r + '.findProperty' | translate"
            (input)="query.set(search.value)" />
        </mat-form-field>
      </div>

      <div class="table-box">
        <table mat-table [dataSource]="rows()" data-cy="data-model-properties">
          <ng-container matColumnDef="property">
            <th mat-header-cell *matHeaderCellDef>{{ r + '.colProperty' | translate }}</th>
            <td mat-cell *matCellDef="let row">
              <span class="texts">
                <span>{{ row.label }}</span>
                <code class="name">{{ row.name }}</code>
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>{{ r + '.colType' | translate }}</th>
            <td mat-cell *matCellDef="let row">
              <span class="type" [attr.data-type]="row.type">
                <mat-icon>{{ typeIcon(row.type) }}</mat-icon
                >{{ typeName(row.type) }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="pointsTo">
            <th mat-header-cell *matHeaderCellDef>{{ r + '.colPointsTo' | translate }}</th>
            <td mat-cell *matCellDef="let row">
              @if (row.linkTarget; as target) {
                <span class="chip" [style.background]="state.colors().get(target) ?? '#F3F4F6'">{{
                  state.labelOf(target)
                }}</span>
              } @else {
                <span class="none">—</span>
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="usedBy">
            <th mat-header-cell *matHeaderCellDef>{{ r + '.colUsedBy' | translate }}</th>
            <td mat-cell *matCellDef="let row">
              <span class="chips">
                @for (iri of row.usedBy.slice(0, usedByShown); track iri) {
                  <span class="chip" [style.background]="state.colors().get(iri)">{{ state.labelOf(iri) }}</span>
                }
                @if (row.usedBy.length > usedByShown) {
                  <span class="chip more">+{{ row.usedBy.length - usedByShown }}</span>
                }
              </span>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: columns"
            data-cy="data-model-properties-row"
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
          <app-property-panel
            class="panel"
            [graph]="graph"
            [propertyIri]="iri"
            [colors]="state.colors()"
            [dataModelLabel]="state.selected()?.label ?? ''"
            [anyResourceLabel]="t + '.anyResource' | translate"
            [canEdit]="state.canEdit()"
            (classSelected)="showClass($event)"
            (closed)="openPanel(undefined)"
            (filter)="filterOn($event)"
            (edit)="edit($event)" />
        }
      }
    </div>
  `,
  styles: [
    RAIL_SECTION_STYLES,
    `
      .type-filter {
        --mat-button-outlined-container-height: 36px;
        background: white;

        b {
          margin-left: 4px;
          font-weight: 500;
        }
      }

      .type {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #4b5563;

        &[data-type='Link'] {
          color: #336790;
        }

        &[data-type='List'] {
          color: #92400e;
        }

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      .chip.more {
        background: #f3f4f6;
        color: #4b5563;
      }
    `,
  ],
})
export class DataModelPropertiesComponent {
  readonly state = inject(DataModelsRailState);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _params = toSignal(this._route.queryParamMap);

  readonly columns = ['property', 'type', 'pointsTo', 'usedBy'];
  readonly usedByShown = USED_BY_SHOWN;
  readonly query = signal('');
  /** The value type shown alone, or every type. */
  readonly type = signal<string | undefined>(undefined);
  readonly typeOptions = computed(() => [...new Set(this.state.propertyRows().map(row => row.type))].sort());
  readonly rows = computed(() => {
    const query = this.query().trim().toLowerCase();
    const type = this.type();
    return this.state
      .propertyRows()
      .filter(row => !type || row.type === type)
      .filter(row => !query || row.label.toLowerCase().includes(query) || row.name.toLowerCase().includes(query));
  });

  /** The property whose panel is open, named in the URL like in the graph. */
  readonly panelIri = computed(() => {
    const name = this._params()?.get(ONTOLOGY_MAP_PARAM.propertyPanel);
    return name ? this.state.propertyRows().find(row => row.name === name)?.id : undefined;
  });

  typeIcon(type: string): string {
    return typeIconOf(type);
  }

  typeName(type: string): string {
    return typeNameOf(type);
  }

  /** Opens the property's panel, or closes it; a step in the browser history. */
  openPanel(propertyIri: string | undefined): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParamsHandling: 'merge',
      queryParams: {
        ...this.state.modelParam(),
        [ONTOLOGY_MAP_PARAM.propertyPanel]: propertyIri ? localNameOf(propertyIri) : null,
      },
    });
  }

  /** Opens a class the panel names, in the Classes section. */
  showClass(iri: string): void {
    this.state.openSection(RouteConstants.classes, { [ONTOLOGY_MAP_PARAM.panel]: localNameOf(iri) });
  }

  /** Shows only the links through the property, in the graph. */
  filterOn(iri: string): void {
    this.state.openSection(RouteConstants.graph, { [ONTOLOGY_MAP_PARAM.property]: localNameOf(iri) });
  }

  /** Opens the property's data model in the data model editor, on its properties. */
  edit(iri: string): void {
    const [ontologyIri] = iri.split('#');
    this._router.navigate(
      this.state.projectPath(
        RouteConstants.ontology,
        OntologyService.getOntologyNameFromIri(ontologyIri),
        RouteConstants.editor,
        RouteConstants.properties
      )
    );
  }
}
