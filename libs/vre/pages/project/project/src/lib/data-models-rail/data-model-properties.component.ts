import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
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
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { TableViewOptionsComponent, ViewOptionsEntry } from '@dasch-swiss/vre/pages/data-browser';
import { DefaultProperties, DefaultProperty, OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { injectDataModelEditing } from '../ontology-map/data-model-editor';
import { localNameOf, PropertyRow } from '../ontology-map/ontology-graph-elements';
import { ONTOLOGY_MAP_PARAM } from '../ontology-map/ontology-map-page.component';
import { PropertyPanelComponent } from '../ontology-map/property-panel.component';
import { typeNameOf } from '../ontology-map/property-types';
import { ResourceClassPanelComponent } from '../ontology-map/resource-class-panel.component';
import { CanDoChecks } from './can-do-checks';
import { ClassChipsComponent } from './class-chips.component';
import { ColumnHeaderComponent } from './column-header.component';
import { DataModelsRailState } from './data-models-rail-state';
import { debounced } from './debounced';
import { escapeClosesPanel } from './escape-closes';
import { HighlightPipe } from './highlight.pipe';
import { LanguageTextsComponent } from './language-texts.component';
import { PropertyTypeIconPipe, PropertyTypeNamePipe } from './property-type.pipes';
import { RAIL_SECTION_STYLES } from './rail-section-styles';
import { TableColumns } from './table-columns';
import { TABLE_STYLES } from './table-styles';

/** How many classes a condensed "Used by" shows; the others are counted. */
const MAX_USED_BY = 3;
const STORAGE_KEY = 'dsp-data-models-properties';
/** The Points to filter's value for properties that are not links. */
const NO_TARGET = 'none';

/** Whether every option of a filter is ticked. */
function allOn(selected: Set<string>, options: string[]): boolean {
  return options.length > 0 && options.every(option => selected.has(option));
}

type Column = 'property' | 'description' | 'type' | 'pointsTo' | 'usedBy';

/** The translation key of each column's name. */
const COLUMN_LABELS: Record<Column, string> = {
  property: 'pages.dataModels2.colProperty',
  description: 'pages.dataModels2.colDescription',
  type: 'pages.dataModels2.colType',
  pointsTo: 'pages.dataModels2.colPointsTo',
  usedBy: 'pages.dataModels2.colUsedBy',
};

/**
 * Data models 2 › Properties: every property of the data model in a table, each row showing all it has. Each column
 * filters from its header, moves
 * by dragging it and resizes from its edge. A clicked property opens its panel; an editor edits a property's name and
 * description in each language from its cell.
 */
@Component({
  selector: 'app-data-model-properties',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeOnEscape($event)' },
  imports: [
    CdkDrag,
    CdkDropList,
    ClassChipsComponent,
    ColumnHeaderComponent,
    HighlightPipe,
    PropertyTypeIconPipe,
    PropertyTypeNamePipe,
    LanguageTextsComponent,
    MatButton,
    MatCell,
    MatCellDef,
    MatCheckbox,
    MatColumnDef,
    MatFormField,
    MatHeaderCell,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatInput,
    MatPrefix,
    MatRow,
    MatRowDef,
    MatTable,
    MatTooltip,
    PropertyPanelComponent,
    ResourceClassPanelComponent,
    TableViewOptionsComponent,
    TranslatePipe,
  ],
  template: `
    @let r = 'pages.dataModels2';
    @let t = 'pages.dataBrowser.dataModelMap';
    @let expanded = true;
    @let cols = columns;
    <div class="section">
      <div class="head">
        <h2>{{ r + '.properties' | translate }}</h2>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
          <mat-icon matPrefix>search</mat-icon>
          <input
            #search
            matInput
            data-cy="data-model-properties-search"
            [placeholder]="r + '.findProperty' | translate"
            [attr.aria-label]="r + '.findProperty' | translate"
            (input)="typed.set(search.value)" />
        </mat-form-field>
        <!-- Which columns show, as in the Data tab's table. -->
        <app-table-view-options
          class="view-options"
          [entries]="columnEntries()"
          [showRowHeight]="false"
          (columnVisibilityChanged)="showColumn($event.key, $event.isVisible)"
          (allColumnsVisibilityChanged)="columns.showAll($event)" />
        <!-- For editors, at the head's right end: a property of the type picked, for no class yet, made in the data model
             editor's dialog. -->
        @if (canCreate()) {
          <button
            mat-flat-button
            color="primary"
            type="button"
            class="create"
            data-cy="data-model-properties-create"
            [matMenuTriggerFor]="createMenu">
            <mat-icon>add</mat-icon>
            {{ r + '.createProperty' | translate }}
          </button>
          <mat-menu #createMenu="matMenu">
            @for (category of propertyTypes; track category.group) {
              <button mat-menu-item type="button" [matMenuTriggerFor]="typeMenu">{{ category.group }}</button>
              <mat-menu #typeMenu="matMenu">
                @for (type of category.elements; track type.label) {
                  <button
                    mat-menu-item
                    type="button"
                    [attr.data-cy]="'data-model-properties-create-' + type.label"
                    (click)="createProperty(type)">
                    <mat-icon>{{ type.icon }}</mat-icon>
                    {{ type.label }}
                  </button>
                }
              </mat-menu>
            }
          </mat-menu>
        }
      </div>

      <div class="table-box" [class.scrolled]="scrolled()" (scroll)="onScroll($event)">
        <table
          mat-table
          [dataSource]="rows()"
          data-cy="data-model-properties"
          [class.expanded]="expanded"
          [style.width.px]="cols.tableWidth() + actionsWidth()"
          cdkDropList
          cdkDropListOrientation="horizontal"
          cdkDropListElementContainer="thead tr"
          [cdkDropListSortPredicate]="cols.canDropAt"
          (cdkDropListDropped)="cols.drop($event)">
          <ng-container matColumnDef="property" sticky>
            <th
              mat-header-cell
              *matHeaderCellDef
              class="frozen"
              cdkDrag
              cdkDragDisabled
              [style.width.px]="cols.widthOf('property')"
              [class.filtered]="namedAs().trim()">
              <app-column-header
                [columns]="cols"
                column="property"
                [label]="columnLabels.property"
                [filtered]="!!namedAs().trim()"
                filterCy="data-model-properties-filter-property"
                resizeCy="data-model-properties-resize">
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="contains">
                  <input
                    #named
                    matInput
                    [placeholder]="r + '.contains' | translate"
                    [attr.aria-label]="r + '.contains' | translate"
                    [value]="namedAs()"
                    (input)="namedAs.set(named.value)" />
                </mat-form-field>
                <button type="button" class="clear" (click)="namedAs.set('')">
                  {{ r + '.clearFilter' | translate }}
                </button>
              </app-column-header>
            </th>
            <td mat-cell *matCellDef="let row" class="frozen" [title]="row.name">
              <span class="labelled">
                <span class="texts">
                  <app-language-texts
                    kind="label"
                    cyPrefix="data-model-properties"
                    [texts]="row.labels"
                    [shown]="row.label"
                    [owner]="row.label"
                    [expanded]="expanded"
                    [highlight]="nameTerms()" />
                  @if (expanded) {
                    <code class="name">
                      @for (part of row.name | highlight: nameTerms(); track $index) {
                        @if (part.match) {
                          <mark>{{ part.text }}</mark>
                        } @else {
                          <span>{{ part.text }}</span>
                        }
                      }
                    </code>
                  }
                </span>
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="description">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="movable"
              cdkDrag
              [style.width.px]="cols.widthOf('description')"
              [class.filtered]="describedAs().trim()">
              <app-column-header
                [columns]="cols"
                column="description"
                [label]="columnLabels.description"
                [filtered]="!!describedAs().trim()"
                filterCy="data-model-properties-filter-description"
                resizeCy="data-model-properties-resize">
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="contains">
                  <input
                    #contains
                    matInput
                    [placeholder]="r + '.contains' | translate"
                    [attr.aria-label]="r + '.contains' | translate"
                    [value]="describedAs()"
                    (input)="describedAs.set(contains.value)" />
                </mat-form-field>
                <button type="button" class="clear" (click)="describedAs.set('')">
                  {{ r + '.clearFilter' | translate }}
                </button>
              </app-column-header>
            </th>
            <td mat-cell *matCellDef="let row" class="description">
              <app-language-texts
                kind="description"
                cyPrefix="data-model-properties"
                [texts]="row.descriptions"
                [shown]="row.description"
                [owner]="row.label"
                [expanded]="expanded"
                [highlight]="descriptionTerms()" />
            </td>
          </ng-container>
          <ng-container matColumnDef="type">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="movable"
              cdkDrag
              [style.width.px]="cols.widthOf('type')"
              [class.filtered]="types().size">
              <app-column-header
                [columns]="cols"
                column="type"
                [label]="columnLabels.type"
                [filtered]="!!types().size"
                filterCy="data-model-properties-filter-type"
                resizeCy="data-model-properties-resize">
                <span class="filter-head">
                  <span class="filter-heading">{{ columnLabels.type | translate }}</span>
                  <button mat-button type="button" class="filter-all" (click)="toggleAll(types, typeOptions())">
                    {{ (allTypesOn() ? r + '.deselectAll' : r + '.selectAll') | translate }}
                  </button>
                </span>
                @for (option of typeOptions(); track option) {
                  <mat-checkbox [checked]="types().has(option)" (change)="toggle(types, option)">
                    <span class="option">
                      <mat-icon>{{ option | propertyTypeIcon }}</mat-icon>
                      {{ option | propertyTypeName }}
                    </span>
                  </mat-checkbox>
                }
              </app-column-header>
            </th>
            <td mat-cell *matCellDef="let row">
              <span class="type">
                <mat-icon>{{ row.type | propertyTypeIcon }}</mat-icon>
                <span>
                  @for (part of row.type | propertyTypeName | highlight: searchTerms(); track $index) {
                    @if (part.match) {
                      <mark>{{ part.text }}</mark>
                    } @else {
                      <span>{{ part.text }}</span>
                    }
                  }
                </span>
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="pointsTo">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="movable"
              cdkDrag
              [style.width.px]="cols.widthOf('pointsTo')"
              [class.filtered]="targets().size">
              <app-column-header
                [columns]="cols"
                column="pointsTo"
                [label]="columnLabels.pointsTo"
                [filtered]="!!targets().size"
                filterCy="data-model-properties-filter-points-to"
                resizeCy="data-model-properties-resize">
                <span class="filter-head">
                  <span class="filter-heading">{{ columnLabels.pointsTo | translate }}</span>
                  <button mat-button type="button" class="filter-all" (click)="toggleAll(targets, targetOptions())">
                    {{ (allTargetsOn() ? r + '.deselectAll' : r + '.selectAll') | translate }}
                  </button>
                </span>
                @for (option of targetOptions(); track option) {
                  <mat-checkbox [checked]="targets().has(option)" (change)="toggle(targets, option)">
                    @if (option === noTarget) {
                      {{ r + '.noTarget' | translate }}
                    } @else {
                      <!-- In the class's color, as in the column. -->
                      <span class="chip"
                        ><span class="tab" [style.background]="state.colors().get(option)"></span
                        ><span class="chip-label">{{ state.labelOf(option) }}</span></span
                      >
                    }
                  </mat-checkbox>
                }
              </app-column-header>
            </th>
            <td mat-cell *matCellDef="let row">
              <app-class-chips
                [iris]="row.linkTarget ? [row.linkTarget] : []"
                [expanded]="expanded"
                [highlight]="searchTerms()" />
            </td>
          </ng-container>
          <ng-container matColumnDef="usedBy">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="movable"
              cdkDrag
              [style.width.px]="cols.widthOf('usedBy')"
              [class.filtered]="users().size">
              <app-column-header
                [columns]="cols"
                column="usedBy"
                [label]="columnLabels.usedBy"
                [filtered]="!!users().size"
                menuPosition="before"
                filterCy="data-model-properties-filter-used-by"
                resizeCy="data-model-properties-resize">
                <span class="filter-head">
                  <span class="filter-heading">{{ columnLabels.usedBy | translate }}</span>
                  <button mat-button type="button" class="filter-all" (click)="toggleAll(users, userOptions())">
                    {{ (allUsersOn() ? r + '.deselectAll' : r + '.selectAll') | translate }}
                  </button>
                </span>
                @for (option of userOptions(); track option) {
                  <mat-checkbox [checked]="users().has(option)" (change)="toggle(users, option)">{{
                    state.labelOf(option)
                  }}</mat-checkbox>
                }
              </app-column-header>
            </th>
            <td mat-cell *matCellDef="let row">
              @if (row.unused) {
                <span class="none" data-cy="data-model-properties-unused">{{ r + '.notUsedByClass' | translate }}</span>
              }
              <app-class-chips
                [iris]="row.usedBy"
                [max]="maxUsedBy"
                [expanded]="expanded"
                [highlight]="searchTerms()" />
            </td>
          </ng-container>
          <!-- Each property's actions, as icons shown on hover, kept in view at the end of the row. -->
          <ng-container matColumnDef="actions" stickyEnd>
            <th mat-header-cell *matHeaderCellDef class="actions-cell" [style.width.px]="actionsWidth()"></th>
            <td
              mat-cell
              *matCellDef="let row"
              class="actions-cell"
              (click)="$event.stopPropagation()"
              (keydown.enter)="$event.stopPropagation()">
              <span class="row-actions">
                @if (canEdit()) {
                  <button
                    mat-icon-button
                    type="button"
                    data-cy="data-model-properties-edit"
                    [attr.aria-label]="r + '.editProperty' | translate"
                    [matTooltip]="r + '.editProperty' | translate"
                    (click)="edit(row.id)">
                    <mat-icon>edit</mat-icon>
                  </button>
                }
                <!-- Deletes once the API says nothing uses the property; why not, on hover, otherwise. -->
                @if (canEdit() && editing.canDelete) {
                  @let check = deleteChecks().get(row.id);
                  <span
                    (mouseenter)="checkDelete(row.id)"
                    [matTooltip]="
                      (!check
                        ? r + '.checkingDelete'
                        : check.canDo
                          ? r + '.deleteProperty'
                          : r + '.cannotDeletePropertyShort'
                      ) | translate
                    ">
                    <button
                      mat-icon-button
                      type="button"
                      class="delete"
                      data-cy="data-model-properties-delete"
                      [attr.aria-label]="r + '.deleteProperty' | translate"
                      [disabled]="!check?.canDo"
                      (click)="deleteProperty(row)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </span>
                }
              </span>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="shownColumns(); sticky: true"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: shownColumns()"
            (mouseenter)="checkDelete(row.id, true)"
            (mouseleave)="cancelCheck()"
            (focusin)="checkDelete(row.id)"
            data-cy="data-model-properties-row"
            [class.selected]="row.id === panelIri()"></tr>
        </table>
        @if (rows().length === 0) {
          <p class="empty">{{ r + '.noMatch' | translate }}</p>
        }
      </div>

      @if (state.graph(); as graph) {
        <!-- A class clicked in the table or the property's panel, described here, over the property's panel. -->
        @if (classPanelIri(); as iri) {
          <app-resource-class-panel
            class="panel"
            [graph]="graph"
            [classIri]="iri"
            [anyResourceLabel]="t + '.anyResource' | translate"
            [canEdit]="state.canEdit()"
            [colors]="state.colors()"
            (classSelected)="showClass($event)"
            (closed)="closeClass()"
            (browse)="browse($event)"
            (edit)="editing.editClass($event)"
            (editProperty)="edit($event)" />
        } @else if (panelIri(); as iri) {
          <app-property-panel
            class="panel"
            [graph]="graph"
            [propertyIri]="iri"
            [colors]="state.colors()"
            [anyResourceLabel]="t + '.anyResource' | translate"
            [canEdit]="state.canEdit()"
            (classSelected)="showClass($event)"
            (closed)="openPanel(undefined)"
            (propertySelected)="openPanel($event)"
            (edit)="edit($event)" />
        }
      }
    </div>
  `,
  styles: [
    RAIL_SECTION_STYLES,
    TABLE_STYLES,
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      // View options, then Create property, at the head's right end, away from the search.
      .head .view-options {
        margin-left: auto;
      }

      // A frozen cell takes the row's background, which plain rows leave transparent.
      .mat-mdc-cell.frozen {
        background: white;
      }

      // Hovered or selected, the whole row takes the colour, the frozen cell too.
      .mat-mdc-row:hover .mat-mdc-cell.frozen,
      .mat-mdc-row.selected .mat-mdc-cell.frozen {
        background: inherit;
      }

      .description {
        color: $cool_gray_700;
      }

      // A type, in its column and in the column's filter, all in the same tone.
      .type,
      .option {
        display: flex;
        align-items: center;
        gap: 4px;
        color: $cool_gray_600;

        mat-icon {
          color: inherit;
        }

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      // The tree: chevrons as in Controlled vocabularies and Resource classes.
      .labelled {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }

      .none {
        color: $cool_gray_400;
      }

      // The menu column on white, as the frozen one.
      .mat-mdc-cell.actions-cell {
        background: white;
      }

      .mat-mdc-row:hover .mat-mdc-cell.actions-cell,
      .mat-mdc-row.selected .mat-mdc-cell.actions-cell {
        background: inherit;
      }

      // The row's icons, small, shown on hover or with the focus.
      .row-actions {
        display: inline-flex;
        // Transparent, not hidden, so Tab still reaches its buttons.
        opacity: 0;
        pointer-events: none;
        .mat-mdc-icon-button {
          // Sized for the 18px icon, which sits off-centre in Material's 24px otherwise.
          --mat-icon-button-icon-size: 18px;
          width: 32px;
          height: 32px;
          padding: 7px;
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .mat-mdc-row:hover .row-actions,
      .row-actions:focus-within {
        opacity: 1;
        pointer-events: auto;
      }

      // A row only shows: clicking it does nothing, only its fold arrow, pen and bin act.
      .mat-mdc-row {
        cursor: default;
      }

      // The pen and the bin in the app's blue, as on the class cards; the bin turns red only while pointed at.
      .row-actions .mat-mdc-icon-button:not([disabled]) {
        color: $primary;
      }

      .row-actions .delete:not([disabled]):hover {
        color: $red_800;
        background: $red_50;
      }
    `,
  ],
})
export class DataModelPropertiesComponent {
  readonly state = inject(DataModelsRailState);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _dialog = inject(MatDialog);
  private readonly _params = toSignal(this._route.queryParamMap);
  readonly editing = injectDataModelEditing();
  private readonly _destroyRef = inject(DestroyRef);
  readonly canEdit = this.state.canEdit;
  /** The width of the actions column, past the columns shown: the pen, and the bin where deleting is possible. */
  readonly actionsWidth = computed(() => (this.canEdit() ? (this.editing.canDelete ? 2 : 1) * 32 + 16 : 0));
  /** The columns shown, then, for editors, the actions'. */
  readonly shownColumns = computed(() => [...this.columns.shown(), ...(this.canEdit() ? ['actions'] : [])]);

  /** What the API says of deleting each property, once asked; none while it checks. */
  private readonly _deleteChecks = new CanDoChecks(iri => this.editing.canDeleteProperty(iri), this._destroyRef);
  readonly deleteChecks = this._deleteChecks.results;
  /** The value types of a property to create, by group, as the data model editor offers them. */
  readonly propertyTypes = DefaultProperties.data;
  /** Whether "Create property" shows: for editors, where the editor's dialogs are at hand. */
  readonly canCreate = computed(() => this.state.canEdit() && this.editing.canCreate);

  /** Creates a property of that type in the data model shown, for no class yet, then opens it in the panel. */
  createProperty(type: DefaultProperty): void {
    const ontologyIri = this.state.selected()?.iri;
    if (ontologyIri) this.editing.createProperty(ontologyIri, type, iri => this.openPanel(iri));
  }

  readonly columns = new TableColumns<Column>({
    storageKey: STORAGE_KEY,
    columns: ['property', 'description', 'type', 'pointsTo', 'usedBy'],
    defaultWidths: { property: 260, description: 360, type: 140, pointsTo: 200, usedBy: 300 },
    minWidths: { property: 140, description: 140, type: 90, pointsTo: 110, usedBy: 130 },
  });
  readonly columnLabels = COLUMN_LABELS;
  /** A column ticked or unticked in View options; its key is one of this table's columns. */
  showColumn(key: string, shown: boolean): void {
    this.columns.show(key as Column, shown);
  }
  private readonly _translate = inject(TranslateService);
  /** Read so the column names follow a change of language. */
  private readonly _lang = toSignal(this._translate.onLangChange);
  /** Each column for the View options menu, in the table's order; the property column stays shown. */
  readonly columnEntries = computed((): ViewOptionsEntry[] => {
    this._lang();
    const hidden = this.columns.hidden();
    return this.columns.order().map((key, index) => ({
      column: { key, label: this._translate.instant(COLUMN_LABELS[key]), isSticky: index === 0 },
      isVisible: !hidden.includes(key),
    }));
  });
  readonly maxUsedBy = MAX_USED_BY;
  readonly noTarget = NO_TARGET;

  /** Whether the table is scrolled sideways, which shadows the frozen property column. */
  readonly scrolled = signal(false);

  /** What is typed in the search; the search runs on it once typing pauses. */
  readonly typed = signal('');
  readonly query = debounced(this.typed);
  /** The column filters; an empty set or text filters nothing. */
  readonly namedAs = signal('');
  readonly describedAs = signal('');
  readonly types = signal(new Set<string>());
  readonly targets = signal(new Set<string>());
  readonly users = signal(new Set<string>());

  /** What the search and the filters look for, marked in the names and descriptions. */
  readonly nameTerms = computed(() => [this.query(), this.namedAs()]);
  readonly descriptionTerms = computed(() => [this.query(), this.describedAs()]);
  readonly searchTerms = computed(() => [this.query()]);

  /** What each filter offers: what the properties have. */
  readonly typeOptions = computed(() =>
    [...new Set(this.state.propertyRows().map(row => row.type))].sort((a, b) =>
      typeNameOf(a).localeCompare(typeNameOf(b))
    )
  );
  readonly targetOptions = computed(() => {
    const rows = this.state.propertyRows();
    const targets = this._byLabel(rows.flatMap(row => (row.linkTarget ? [row.linkTarget] : [])));
    return rows.some(row => !row.linkTarget) ? [...targets, NO_TARGET] : targets;
  });
  readonly userOptions = computed(() => this._byLabel(this.state.propertyRows().flatMap(row => row.usedBy)));
  /** Whether every option of each filter is ticked. */
  readonly allTypesOn = computed(() => allOn(this.types(), this.typeOptions()));
  readonly allTargetsOn = computed(() => allOn(this.targets(), this.targetOptions()));
  readonly allUsersOn = computed(() => allOn(this.users(), this.userOptions()));

  /** The properties, one per row, by label: a sub-property among the others, not under its parent. */
  readonly rows = computed(() => {
    const query = this.query().trim().toLowerCase();
    const namedAs = this.namedAs().trim().toLowerCase();
    const describedAs = this.describedAs().trim().toLowerCase();
    const types = this.types();
    const targets = this.targets();
    const users = this.users();
    const shown = this.columns.shown();
    return this.state
      .propertyRows()
      .filter(row => !query || shown.some(column => this._columnHas(row, column, query)))
      .filter(row => !namedAs || this._isNamed(row, namedAs))
      .filter(
        row =>
          !describedAs ||
          row.description.toLowerCase().includes(describedAs) ||
          row.descriptions.some(text => text.value.toLowerCase().includes(describedAs))
      )
      .filter(row => !types.size || types.has(row.type))
      .filter(row => !targets.size || targets.has(row.linkTarget ?? NO_TARGET))
      .filter(row => !users.size || row.usedBy.some(user => users.has(user)))
      .sort((a, b) => a.label.localeCompare(b.label) || a.name.localeCompare(b.name));
  });

  /** The property whose panel is open, named in the URL like in the graph. */
  readonly panelIri = computed(() => {
    const name = this._params()?.get(ONTOLOGY_MAP_PARAM.propertyPanel);
    return name ? this.state.propertyRows().find(row => row.name === name)?.id : undefined;
  });

  /** The class whose panel is open over the property's, from a click on its chip; named in the URL. */
  readonly classPanelIri = computed(() => {
    const name = this._params()?.get(ONTOLOGY_MAP_PARAM.panel);
    return name ? this.state.classRows().find(row => row.name === name)?.id : undefined;
  });

  private readonly _search = viewChild<ElementRef<HTMLInputElement>>('search');

  constructor() {
    // Arriving on the page, typing finds what it lists.
    afterNextRender(() => this._search()?.nativeElement.focus());
    // Read again after an edit: what could not be deleted may be deletable now, and the other way round.
    effect(() => {
      this.state.graph();
      untracked(() => this._deleteChecks.clear());
    });
  }

  onScroll(event: Event): void {
    this.scrolled.set((event.target as HTMLElement).scrollLeft > 0);
  }

  /** Ticks every option of a filter, or none when they all are. */
  toggleAll(filter: WritableSignal<Set<string>>, options: string[]): void {
    filter.set(allOn(filter(), options) ? new Set() : new Set(options));
  }

  /** Adds the option to a filter, or takes it out. */
  toggle(filter: WritableSignal<Set<string>>, option: string): void {
    filter.update(chosen => {
      const next = new Set(chosen);
      if (!next.delete(option)) next.add(option);
      return next;
    });
  }

  /**
   * Esc closes the property's side panel open. Not the name or description editor, which edits: Esc never drops an edit,
   * and leaves the panel under it open too.
   */
  closeOnEscape(event: Event): void {
    if (!escapeClosesPanel(event, this._dialog)) return;
    if (this.classPanelIri()) this.closeClass();
    else if (this.panelIri()) this.openPanel(undefined);
  }

  /** Opens the property's panel, or closes it; a step in the browser history. */
  openPanel(propertyIri: string | undefined): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParamsHandling: 'merge',
      queryParams: {
        ...this.state.modelParam(),
        [ONTOLOGY_MAP_PARAM.propertyPanel]: propertyIri ? localNameOf(propertyIri) : null,
        [ONTOLOGY_MAP_PARAM.panel]: null,
      },
    });
  }

  /**
   * Opens a class of the data model in its panel, here, a step in the browser history; one of another data model in
   * the Classes section, where its data model shows.
   */
  showClass(iri: string): void {
    if (!this.state.classRows().some(row => row.id === iri)) {
      this.state.openSection(RouteConstants.classes, { [ONTOLOGY_MAP_PARAM.panel]: localNameOf(iri) });
      return;
    }
    this._router.navigate([], {
      relativeTo: this._route,
      queryParamsHandling: 'merge',
      queryParams: { ...this.state.modelParam(), [ONTOLOGY_MAP_PARAM.panel]: localNameOf(iri) },
    });
  }

  /** Closes the class's panel, back to the property's if one was open. */
  closeClass(): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParamsHandling: 'merge',
      queryParams: { [ONTOLOGY_MAP_PARAM.panel]: null },
    });
  }

  /** Browses the class's resources. */
  browse(iri: string): void {
    const [ontologyIri, className] = iri.split('#');
    this._router.navigate(
      this.state.projectPath(RouteConstants.data, OntologyService.getOntologyNameFromIri(ontologyIri), className)
    );
  }

  /** Asks the API whether the property can be deleted, for its bin to say so; `soon` waits for the pointer to rest. */
  checkDelete(propertyIri: string, soon = false): void {
    if (!this.canEdit() || !this.editing.canDelete) return;
    if (soon) this._deleteChecks.checkSoon(propertyIri);
    else this._deleteChecks.check(propertyIri);
  }

  cancelCheck(): void {
    this._deleteChecks.cancel();
  }

  /** Deletes the property once confirmed, closing its panel; the data model is then read again. */
  deleteProperty(row: PropertyRow): void {
    this.editing
      .deleteProperty(row.id, row.label)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(deleted => deleted && this.panelIri() === row.id && this.openPanel(undefined));
  }

  /** Edits the property in the data model editor's dialog; see `injectDataModelEditing`. */
  edit(iri: string): void {
    this.editing.editProperty(iri);
  }

  /** Whether what a column shows of a property has the searched text, in any language. */
  private _columnHas(row: PropertyRow, column: Column, query: string): boolean {
    const has = (text: string | undefined) => !!text && text.toLowerCase().includes(query);
    switch (column) {
      case 'property':
        return this._isNamed(row, query);
      case 'description':
        return has(row.description) || row.descriptions.some(text => has(text.value));
      case 'type':
        return has(typeNameOf(row.type));
      case 'pointsTo':
        return !!row.linkTarget && has(this.state.labelOf(row.linkTarget));
      case 'usedBy':
        return row.usedBy.some(iri => has(this.state.labelOf(iri)));
    }
  }

  /** Whether the property's name, or its label in any language, has the text. */
  private _isNamed(row: PropertyRow, text: string): boolean {
    return (
      row.label.toLowerCase().includes(text) ||
      row.name.toLowerCase().includes(text) ||
      row.labels.some(label => label.value.toLowerCase().includes(text))
    );
  }

  private _byLabel(iris: string[]): string[] {
    return [...new Set(iris)].sort((a, b) => this.state.labelOf(a).localeCompare(this.state.labelOf(b)));
  }
}
