import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
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
import { TranslatePipe } from '@ngx-translate/core';
import { injectDataModelEditing } from '../ontology-map/data-model-editor';
import { localNameOf, PropertyRow } from '../ontology-map/ontology-graph-elements';
import { ONTOLOGY_MAP_PARAM } from '../ontology-map/ontology-map-page.component';
import { PropertyPanelComponent } from '../ontology-map/property-panel.component';
import { typeIconOf, typeNameOf } from '../ontology-map/property-types';
import { ClassChipsComponent } from './class-chips.component';
import { ColumnHeaderComponent } from './column-header.component';
import { ColumnsMenuComponent } from './columns-menu.component';
import { DataModelsRailState } from './data-models-rail-state';
import { TextKind } from './description-editor.component';
import { HighlightPipe } from './highlight.pipe';
import { LanguageTextEdit, LanguageTextsComponent } from './language-texts.component';
import { RAIL_SECTION_STYLES } from './rail-section-styles';
import { rememberedSignal } from './remembered-signal';
import { TableColumns } from './table-columns';
import { TABLE_STYLES } from './table-styles';
import { TextEditing, TextEditorPopoverComponent } from './text-editor-popover.component';

/** How many classes a condensed "Used by" shows; the others are counted. */
const MAX_USED_BY = 3;
const STORAGE_KEY = 'dsp-data-models-properties';
/** The Points to filter's value for properties that are not links. */
const NO_TARGET = 'none';

type Column = 'property' | 'description' | 'type' | 'pointsTo' | 'usedBy';
type Density = 'condensed' | 'expanded';

/** The translation key of each column's name. */
const COLUMN_LABELS: Record<Column, string> = {
  property: 'pages.dataModels2.colProperty',
  description: 'pages.dataModels2.colDescription',
  type: 'pages.dataModels2.colType',
  pointsTo: 'pages.dataModels2.colPointsTo',
  usedBy: 'pages.dataModels2.colUsedBy',
};

/**
 * Data models 2 › Properties: every property of the data model in a table, as the Classes table. Condensed, a row is
 * one line and what does not fit is counted; expanded, it shows everything. Each column filters from its header, moves
 * by dragging it and resizes from its edge. A clicked property opens its panel; an editor edits a property's name and
 * description in each language from its cell.
 */
@Component({
  selector: 'app-data-model-properties',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkDrag,
    CdkDropList,
    ClassChipsComponent,
    ColumnHeaderComponent,
    ColumnsMenuComponent,
    HighlightPipe,
    LanguageTextsComponent,
    MatButton,
    MatButtonToggle,
    MatButtonToggleGroup,
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
    MatInput,
    MatPrefix,
    MatRow,
    MatRowDef,
    MatSlideToggle,
    MatTable,
    PropertyPanelComponent,
    TextEditorPopoverComponent,
    TranslatePipe,
  ],
  template: `
    @let r = 'pages.dataModels2';
    @let t = 'pages.dataBrowser.dataModelMap';
    @let expanded = density() === 'expanded';
    @let cols = columns;
    <div class="section">
      <div class="head">
        <h2>{{ r + '.properties' | translate }}</h2>
        <span class="counts">{{
          r + '.propertiesCount' | translate: { count: state.propertyRows().length, links: state.linkCount() }
        }}</span>
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
        <span class="spacer"></span>
        <mat-slide-toggle
          class="all-languages"
          data-cy="data-model-properties-all-languages"
          [checked]="allLanguages()"
          (change)="allLanguages.set($event.checked)">
          {{ r + '.allLanguages' | translate }}
        </mat-slide-toggle>
        <mat-button-toggle-group
          class="density"
          hideSingleSelectionIndicator
          data-cy="data-model-properties-density"
          [attr.aria-label]="r + '.density' | translate"
          [value]="density()"
          (change)="density.set($event.value)">
          <mat-button-toggle value="condensed">
            <mat-icon>density_small</mat-icon>
            {{ r + '.condensed' | translate }}
          </mat-button-toggle>
          <mat-button-toggle value="expanded">
            <mat-icon>density_large</mat-icon>
            {{ r + '.expanded' | translate }}
          </mat-button-toggle>
        </mat-button-toggle-group>
        <app-columns-menu [columns]="cols" [labels]="columnLabels" cyPrefix="data-model-properties" />
      </div>

      <div class="table-box" [class.scrolled]="scrolled()" (scroll)="onScroll($event)">
        <table
          mat-table
          [dataSource]="rows()"
          data-cy="data-model-properties"
          [class.expanded]="expanded"
          [style.width.px]="cols.tableWidth()"
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
              <span class="texts">
                <app-language-texts
                  kind="label"
                  cyPrefix="data-model-properties"
                  [texts]="row.labels"
                  [shown]="row.label"
                  [owner]="row.label"
                  [allLanguages]="allLanguages()"
                  [canEdit]="canEditTexts()"
                  [activeLanguage]="textEditing.activeLanguage(row.id, 'label')"
                  [expanded]="expanded"
                  [highlight]="nameTerms()"
                  (edit)="editText(row, 'label', $event)" />
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
                [allLanguages]="allLanguages()"
                [canEdit]="canEditTexts()"
                [activeLanguage]="textEditing.activeLanguage(row.id, 'description')"
                [expanded]="expanded"
                [highlight]="descriptionTerms()"
                (edit)="editText(row, 'description', $event)" />
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
                    {{ (allOn(types(), typeOptions()) ? r + '.deselectAll' : r + '.selectAll') | translate }}
                  </button>
                </span>
                @for (option of typeOptions(); track option) {
                  <mat-checkbox [checked]="types().has(option)" (change)="toggle(types, option)">
                    <span class="option">
                      <mat-icon>{{ typeIcon(option) }}</mat-icon>
                      {{ typeName(option) }}
                    </span>
                  </mat-checkbox>
                }
              </app-column-header>
            </th>
            <td mat-cell *matCellDef="let row">
              <span class="type">
                <mat-icon>{{ typeIcon(row.type) }}</mat-icon
                >{{ typeName(row.type) }}
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
                    {{ (allOn(targets(), targetOptions()) ? r + '.deselectAll' : r + '.selectAll') | translate }}
                  </button>
                </span>
                @for (option of targetOptions(); track option) {
                  <mat-checkbox [checked]="targets().has(option)" (change)="toggle(targets, option)">{{
                    option === noTarget ? (r + '.noTarget' | translate) : state.labelOf(option)
                  }}</mat-checkbox>
                }
              </app-column-header>
            </th>
            <td mat-cell *matCellDef="let row">
              <app-class-chips [iris]="row.linkTarget ? [row.linkTarget] : []" [expanded]="expanded" />
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
                    {{ (allOn(users(), userOptions()) ? r + '.deselectAll' : r + '.selectAll') | translate }}
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
              <app-class-chips [iris]="row.usedBy" [max]="maxUsedBy" [expanded]="expanded" />
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols.shown(); sticky: true"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: cols.shown()"
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

      <app-text-editor-popover [editing]="textEditing" />

      @if (state.graph(); as graph) {
        @if (panelIri(); as iri) {
          <app-property-panel
            class="panel"
            [graph]="graph"
            [propertyIri]="iri"
            [colors]="state.colors()"
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
    TABLE_STYLES,
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      // A frozen cell takes the row's background, which plain rows leave transparent.
      .mat-mdc-cell.frozen {
        background: white;
      }

      .mat-mdc-row.selected .mat-mdc-cell.frozen {
        background: inherit;
      }

      .description {
        color: $cool_gray_700;
      }

      mark {
        border-radius: 2px;
        background: #fde68a;
        color: inherit;
      }

      // A type, in its column and in the column's filter, all in the same tone.
      .type,
      .option {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #4b5563;

        mat-icon {
          color: inherit;
        }

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    `,
  ],
})
export class DataModelPropertiesComponent {
  readonly state = inject(DataModelsRailState);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _params = toSignal(this._route.queryParamMap);
  private readonly _editing = injectDataModelEditing();

  readonly columns = new TableColumns<Column>({
    storageKey: STORAGE_KEY,
    columns: ['property', 'description', 'type', 'pointsTo', 'usedBy'],
    defaultWidths: { property: 260, description: 360, type: 140, pointsTo: 200, usedBy: 300 },
    minWidths: { property: 140, description: 140, type: 90, pointsTo: 110, usedBy: 130 },
  });
  readonly columnLabels = COLUMN_LABELS;
  readonly maxUsedBy = MAX_USED_BY;
  readonly noTarget = NO_TARGET;

  /** Condensed rows of one line, or expanded rows showing everything; remembered in this browser. */
  readonly density = rememberedSignal<Density>(`${STORAGE_KEY}-density`, 'condensed', stored =>
    stored === 'expanded' ? 'expanded' : 'condensed'
  );
  /** Every language of a name or description stacked, or only the one the app shows; remembered in this browser. */
  readonly allLanguages = rememberedSignal(`${STORAGE_KEY}-all-languages`, false, stored => stored === 'true');
  /** Whether the table is scrolled sideways, which shadows the frozen property column. */
  readonly scrolled = signal(false);

  /** The property names and descriptions edited from their cells. */
  readonly textEditing = new TextEditing((target, texts) =>
    this._editing.savePropertyTexts(target.id, target.kind === 'label' ? { labels: texts } : { descriptions: texts })
  );
  readonly canEditTexts = computed(() => this.state.canEdit() && this._editing.canSaveInPlace);

  readonly query = signal('');
  /** The column filters; an empty set or text filters nothing. */
  readonly namedAs = signal('');
  readonly describedAs = signal('');
  readonly types = signal(new Set<string>());
  readonly targets = signal(new Set<string>());
  readonly users = signal(new Set<string>());

  /** What the search and the filters look for, marked in the names and descriptions. */
  readonly nameTerms = computed(() => [this.query(), this.namedAs()]);
  readonly descriptionTerms = computed(() => [this.describedAs()]);

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

  readonly rows = computed(() => {
    const query = this.query().trim().toLowerCase();
    const namedAs = this.namedAs().trim().toLowerCase();
    const describedAs = this.describedAs().trim().toLowerCase();
    const types = this.types();
    const targets = this.targets();
    const users = this.users();
    return this.state
      .propertyRows()
      .filter(row => !query || this._isNamed(row, query))
      .filter(row => !namedAs || this._isNamed(row, namedAs))
      .filter(
        row =>
          !describedAs ||
          row.description.toLowerCase().includes(describedAs) ||
          row.descriptions.some(text => text.value.toLowerCase().includes(describedAs))
      )
      .filter(row => !types.size || types.has(row.type))
      .filter(row => !targets.size || targets.has(row.linkTarget ?? NO_TARGET))
      .filter(row => !users.size || row.usedBy.some(user => users.has(user)));
  });

  /** The property whose panel is open, named in the URL like in the graph. */
  readonly panelIri = computed(() => {
    const name = this._params()?.get(ONTOLOGY_MAP_PARAM.propertyPanel);
    return name ? this.state.propertyRows().find(row => row.name === name)?.id : undefined;
  });

  private readonly _search = viewChild<ElementRef<HTMLInputElement>>('search');

  constructor() {
    // Arriving on the page, typing finds a property.
    afterNextRender(() => this._search()?.nativeElement.focus());
  }

  onScroll(event: Event): void {
    this.scrolled.set((event.target as HTMLElement).scrollLeft > 0);
  }

  /** Whether every option of a filter is ticked. */
  allOn(selected: Set<string>, options: string[]): boolean {
    return options.length > 0 && options.every(option => selected.has(option));
  }

  /** Ticks every option of a filter, or none when they all are. */
  toggleAll(filter: WritableSignal<Set<string>>, options: string[]): void {
    filter.set(this.allOn(filter(), options) ? new Set() : new Set(options));
  }

  /** Adds the option to a filter, or takes it out. */
  toggle(filter: WritableSignal<Set<string>>, option: string): void {
    filter.update(chosen => {
      const next = new Set(chosen);
      if (!next.delete(option)) next.add(option);
      return next;
    });
  }

  typeIcon(type: string): string {
    return typeIconOf(type);
  }

  typeName(type: string): string {
    return typeNameOf(type);
  }

  /** Opens the editor of a property's name or description, on the language asked for. */
  editText(row: PropertyRow, kind: TextKind, edit: LanguageTextEdit): void {
    this.textEditing.open({
      ...edit,
      id: row.id,
      label: row.label,
      kind,
      texts: kind === 'label' ? row.labels : row.descriptions,
    });
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

  /** Edits the property in the data model editor's dialog; see `injectDataModelEditing`. */
  edit(iri: string): void {
    this._editing.editProperty(iri);
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
