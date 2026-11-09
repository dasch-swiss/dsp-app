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
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
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
import { RepresentationClass } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { injectDataModelEditing } from '../ontology-map/data-model-editor';
import { classFamilies, familyHue, familyTint, FILE_KINDS } from '../ontology-map/islands';
import { ClassRow, localNameOf } from '../ontology-map/ontology-graph-elements';
import { ONTOLOGY_MAP_PARAM } from '../ontology-map/ontology-map-page.component';
import { PropertyPanelComponent } from '../ontology-map/property-panel.component';
import { typeIconOf, typeNameOf } from '../ontology-map/property-types';
import { ResourceClassPanelComponent } from '../ontology-map/resource-class-panel.component';
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

/** How many properties and linked classes a condensed row shows; the others are counted. */
const MAX_PROPERTIES = 3;
const MAX_LINKS = 2;
/** How strongly the rows of a family with subclasses are tinted with its hue. */
const FAMILY_TINT = 0.2;
const STORAGE_KEY = 'dsp-data-models-classes';
/** The File filter's value for classes without file. */
const NO_FILE = 'none';

type Column = 'class' | 'file' | 'description' | 'properties' | 'linkedFrom' | 'linksTo';
type Density = 'condensed' | 'expanded';
type Level = 'all' | 'top' | 'sub';

/** The translation key of each column's name, under `pages.dataModels2`. */
const COLUMN_LABELS: Record<Column, string> = {
  class: 'pages.dataModels2.colClass',
  file: 'pages.dataModels2.colFile',
  description: 'pages.dataModels2.colDescription',
  properties: 'pages.dataModels2.colProperties',
  linkedFrom: 'pages.dataModels2.colLinkedFrom',
  linksTo: 'pages.dataModels2.colLinksTo',
};

/**
 * Data models 2 › Classes: the data model's classes in a table, as the Data tab's table, subclasses under their
 * superclass in their family's tone. Condensed, a row is one line and what does not fit is counted; expanded, it shows
 * everything. Each column filters from its header, moves by dragging it and resizes from its edge. A clicked class
 * opens its panel; an editor edits a class's name and description in each language from its cell.
 */
@Component({
  selector: 'app-data-model-classes',
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
    MatRadioButton,
    MatRadioGroup,
    MatRow,
    MatRowDef,
    MatSlideToggle,
    MatTable,
    PropertyPanelComponent,
    ResourceClassPanelComponent,
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
        <h2>{{ r + '.classes' | translate }}</h2>
        <span class="counts">{{
          'pages.ontologyMap.counts' | translate: { classes: state.classRows().length, links: state.linkCount() }
        }}</span>
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
        <span class="spacer"></span>
        <mat-slide-toggle
          class="all-languages"
          data-cy="data-model-classes-all-languages"
          [checked]="allLanguages()"
          (change)="allLanguages.set($event.checked)">
          {{ r + '.allLanguages' | translate }}
        </mat-slide-toggle>
        <mat-button-toggle-group
          class="density"
          hideSingleSelectionIndicator
          data-cy="data-model-classes-density"
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
        <app-columns-menu [columns]="cols" [labels]="columnLabels" cyPrefix="data-model-classes" />
      </div>

      <div class="table-box" [class.scrolled]="scrolled()" (scroll)="onScroll($event)">
        <table
          mat-table
          [dataSource]="rows()"
          data-cy="data-model-classes"
          [class.expanded]="expanded"
          [style.width.px]="cols.tableWidth()"
          cdkDropList
          cdkDropListOrientation="horizontal"
          cdkDropListElementContainer="thead tr"
          [cdkDropListSortPredicate]="cols.canDropAt"
          (cdkDropListDropped)="cols.drop($event)">
          <ng-container matColumnDef="class" sticky>
            <th
              mat-header-cell
              *matHeaderCellDef
              class="frozen"
              cdkDrag
              cdkDragDisabled
              [style.width.px]="cols.widthOf('class')"
              [class.filtered]="level() !== 'all'">
              <app-column-header
                [columns]="cols"
                column="class"
                [label]="columnLabels.class"
                [filtered]="level() !== 'all'"
                filterCy="data-model-classes-filter-class"
                resizeCy="data-model-classes-resize">
                <mat-radio-group [value]="level()" (change)="level.set($event.value)">
                  <mat-radio-button value="all">{{ r + '.allClasses' | translate }}</mat-radio-button>
                  <mat-radio-button value="top">{{ r + '.topClasses' | translate }}</mat-radio-button>
                  <mat-radio-button value="sub">{{ r + '.subclasses' | translate }}</mat-radio-button>
                </mat-radio-group>
              </app-column-header>
            </th>
            <td mat-cell *matCellDef="let row" class="frozen">
              <span class="labelled" [style.padding-left.px]="row.depth * 18" [title]="row.name">
                <span class="swatch" [style.background]="state.colors().get(row.id)"></span>
                <span class="texts">
                  <app-language-texts
                    kind="label"
                    cyPrefix="data-model-classes"
                    [texts]="row.labels"
                    [shown]="row.label"
                    [owner]="row.label"
                    [allLanguages]="allLanguages()"
                    [canEdit]="canEditTexts()"
                    [activeLanguage]="textEditing.activeLanguage(row.id, 'label')"
                    [expanded]="expanded"
                    [highlight]="searchTerms()"
                    (edit)="editText(row, 'label', $event)" />
                  @if (row.superclass; as superclass) {
                    <span class="subclass-of">
                      @for (
                        part of r + '.subclassOf'
                          | translate: { class: state.labelOf(superclass) }
                          | highlight: searchTerms();
                        track $index
                      ) {
                        @if (part.match) {
                          <mark>{{ part.text }}</mark>
                        } @else {
                          <span>{{ part.text }}</span>
                        }
                      }
                    </span>
                  }
                  @if (expanded) {
                    <code class="name">
                      @for (part of row.name | highlight: searchTerms(); track $index) {
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
          <ng-container matColumnDef="file">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="movable"
              cdkDrag
              [style.width.px]="cols.widthOf('file')"
              [class.filtered]="files().size">
              <app-column-header
                [columns]="cols"
                column="file"
                [label]="columnLabels.file"
                [filtered]="!!files().size"
                filterCy="data-model-classes-filter-file"
                resizeCy="data-model-classes-resize">
                <span class="filter-head">
                  <span class="filter-heading">{{ columnLabels.file | translate }}</span>
                  <button mat-button type="button" class="filter-all" (click)="toggleAll(files, fileOptions())">
                    {{ (allOn(files(), fileOptions()) ? r + '.deselectAll' : r + '.selectAll') | translate }}
                  </button>
                </span>
                @for (option of fileOptions(); track option) {
                  <mat-checkbox [checked]="files().has(option)" (change)="toggle(files, option)">
                    <span class="option">
                      @if (option === noFile) {
                        <mat-icon class="no-file">block</mat-icon>
                        {{ r + '.noFile' | translate }}
                      } @else {
                        <mat-icon>{{ fileIcon($any(option)) }}</mat-icon>
                        {{ 'pages.ontologyMap.islands.fileKinds.' + option | translate }}
                      }
                    </span>
                  </mat-checkbox>
                }
              </app-column-header>
            </th>
            <td mat-cell *matCellDef="let row">
              @if (row.representation; as representation) {
                <span class="file">
                  <mat-icon>{{ fileIcon(representation) }}</mat-icon>
                  <span>
                    @for (
                      part of 'pages.ontologyMap.islands.fileKinds.' + representation
                        | translate
                        | highlight: searchTerms();
                      track $index
                    ) {
                      @if (part.match) {
                        <mark>{{ part.text }}</mark>
                      } @else {
                        <span>{{ part.text }}</span>
                      }
                    }
                  </span>
                </span>
              } @else {
                <span class="none">—</span>
              }
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
                filterCy="data-model-classes-filter-description"
                resizeCy="data-model-classes-resize">
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
                cyPrefix="data-model-classes"
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
          <ng-container matColumnDef="properties">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="movable"
              cdkDrag
              [style.width.px]="cols.widthOf('properties')"
              [class.filtered]="types().size">
              <app-column-header
                [columns]="cols"
                column="properties"
                [label]="columnLabels.properties"
                [filtered]="!!types().size"
                filterCy="data-model-classes-filter-properties"
                resizeCy="data-model-classes-resize">
                <span class="filter-head">
                  <span class="filter-heading">{{ r + '.hasPropertyOf' | translate }}</span>
                  <button mat-button type="button" class="filter-all" (click)="toggleAll(types, typeOptions())">
                    {{ (allOn(types(), typeOptions()) ? r + '.deselectAll' : r + '.selectAll') | translate }}
                  </button>
                </span>
                @for (option of typeOptions(); track option) {
                  <mat-checkbox [checked]="types().has(option)" (change)="toggle(types, option)">{{
                    typeName(option)
                  }}</mat-checkbox>
                }
              </app-column-header>
            </th>
            <td mat-cell *matCellDef="let row">
              <span class="line">
                <!-- Condensed, the chips give way to the cell's width; the count of the others stays in view. -->
                <span class="cut">
                  @for (property of shownProperties(row); track property.id) {
                    <button
                      type="button"
                      class="property"
                      data-cy="data-model-classes-property"
                      [class.link]="property.linkTarget"
                      [class.on]="property.id === propertyPanelIri()"
                      (click)="$event.stopPropagation(); openProperty(property.id)"
                      [title]="typeName(property.type)"
                      (keydown.enter)="$event.stopPropagation()">
                      <mat-icon>{{ typeIcon(property.type) }}</mat-icon>
                      <span>
                        @for (part of property.label | highlight: searchTerms(); track $index) {
                          @if (part.match) {
                            <mark>{{ part.text }}</mark>
                          } @else {
                            <span>{{ part.text }}</span>
                          }
                        }
                      </span>
                      @if (property.linkTarget; as target) {
                        <span>→</span>
                        <span>
                          @for (part of state.labelOf(target) | highlight: searchTerms(); track $index) {
                            @if (part.match) {
                              <mark>{{ part.text }}</mark>
                            } @else {
                              <span>{{ part.text }}</span>
                            }
                          }
                        </span>
                      }
                    </button>
                  }
                </span>
                @if (!expanded && row.propertyList.length > maxProperties) {
                  <span class="more" data-cy="data-model-classes-more-properties"
                    >+{{ row.propertyList.length - maxProperties }}</span
                  >
                }
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="linkedFrom">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="movable"
              cdkDrag
              [style.width.px]="cols.widthOf('linkedFrom')"
              [class.filtered]="sources().size">
              <app-column-header
                [columns]="cols"
                column="linkedFrom"
                [label]="columnLabels.linkedFrom"
                [filtered]="!!sources().size"
                menuPosition="before"
                filterCy="data-model-classes-filter-linked-from"
                resizeCy="data-model-classes-resize">
                <span class="filter-head">
                  <span class="filter-heading">{{ columnLabels.linkedFrom | translate }}</span>
                  <button mat-button type="button" class="filter-all" (click)="toggleAll(sources, sourceOptions())">
                    {{ (allOn(sources(), sourceOptions()) ? r + '.deselectAll' : r + '.selectAll') | translate }}
                  </button>
                </span>
                @for (option of sourceOptions(); track option) {
                  <mat-checkbox [checked]="sources().has(option)" (change)="toggle(sources, option)">{{
                    state.labelOf(option)
                  }}</mat-checkbox>
                }
              </app-column-header>
            </th>
            <td mat-cell *matCellDef="let row">
              <app-class-chips
                [iris]="row.linkedFrom"
                [max]="maxLinks"
                [expanded]="expanded"
                [highlight]="searchTerms()" />
            </td>
          </ng-container>
          <ng-container matColumnDef="linksTo">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="movable"
              cdkDrag
              [style.width.px]="cols.widthOf('linksTo')"
              [class.filtered]="targets().size">
              <app-column-header
                [columns]="cols"
                column="linksTo"
                [label]="columnLabels.linksTo"
                [filtered]="!!targets().size"
                menuPosition="before"
                filterCy="data-model-classes-filter-links"
                resizeCy="data-model-classes-resize">
                <span class="filter-head">
                  <span class="filter-heading">{{ columnLabels.linksTo | translate }}</span>
                  <button mat-button type="button" class="filter-all" (click)="toggleAll(targets, targetOptions())">
                    {{ (allOn(targets(), targetOptions()) ? r + '.deselectAll' : r + '.selectAll') | translate }}
                  </button>
                </span>
                @for (option of targetOptions(); track option) {
                  <mat-checkbox [checked]="targets().has(option)" (change)="toggle(targets, option)">{{
                    state.labelOf(option)
                  }}</mat-checkbox>
                }
              </app-column-header>
            </th>
            <td mat-cell *matCellDef="let row">
              <app-class-chips
                [iris]="row.linksTo"
                [max]="maxLinks"
                [expanded]="expanded"
                [highlight]="searchTerms()" />
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols.shown(); sticky: true"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: cols.shown()"
            data-cy="data-model-classes-row"
            tabindex="0"
            [class.selected]="row.id === panelIri()"
            [style.background]="row.id === panelIri() ? null : tints().get(row.id)"
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
          <app-resource-class-panel
            class="panel"
            [graph]="graph"
            [classIri]="iri"
            [anyResourceLabel]="t + '.anyResource' | translate"
            [subclassLabel]="t + '.subclassOf' | translate"
            [canEdit]="state.canEdit()"
            [colors]="state.colors()"
            (classSelected)="openPanel($event)"
            (closed)="openPanel(undefined)"
            (browse)="browse($event)"
            (filter)="filterOn($event)"
            (edit)="edit($event)"
            (editProperty)="editing.editProperty($event)" />
        } @else if (propertyPanelIri(); as iri) {
          <app-property-panel
            class="panel"
            [graph]="graph"
            [propertyIri]="iri"
            [colors]="state.colors()"
            [anyResourceLabel]="t + '.anyResource' | translate"
            [canEdit]="state.canEdit()"
            (classSelected)="openPanel($event)"
            (closed)="openProperty(undefined)"
            (filter)="filterOnProperty($event)"
            (edit)="editing.editProperty($event)" />
        }
      }
    </div>
  `,
  styles: [
    RAIL_SECTION_STYLES,
    TABLE_STYLES,
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      .labelled {
        min-width: 0;
      }

      .subclass-of {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 11.5px;
        line-height: 15px;
        color: $cool_gray_600;
      }

      .file {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: $cool_gray_700;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          color: $primary;
        }
      }

      .description {
        color: $cool_gray_700;
      }

      // The properties on one line, cut at the cell's edge; the "+N" after them always shows.
      .line {
        display: flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
      }

      .cut {
        flex: 0 1 auto;
        min-width: 0;
        display: flex;
        gap: 4px;
        overflow: hidden;
      }

      .property {
        flex: none;
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 0 7px 0 5px;
        border: 0;
        border-radius: 11px;
        background: $cool_gray_100;
        font: inherit;
        font-size: 12px;
        line-height: 22px;
        color: $cool_gray_700;
        cursor: pointer;

        mat-icon {
          width: 14px;
          height: 14px;
          font-size: 14px;
        }

        &:hover,
        &.on {
          background: $cool_gray_200;
        }

        &.link {
          background: #eaeff3;
          color: #264c6a;

          &:hover,
          &.on {
            background: #d5e0e9;
          }
        }
      }

      .more {
        flex: none;
        padding: 0 4px;
        font-size: 12px;
        font-weight: 500;
        color: $primary;
      }

      table.expanded {
        .labelled,
        .line {
          align-items: flex-start;
        }

        .swatch {
          margin-top: 3px;
        }

        .cut {
          flex-wrap: wrap;
          overflow: visible;
        }
      }
    `,
  ],
})
export class DataModelClassesComponent {
  readonly state = inject(DataModelsRailState);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _params = toSignal(this._route.queryParamMap);
  private readonly _translate = inject(TranslateService);
  readonly editing = injectDataModelEditing();

  readonly columns = new TableColumns<Column>({
    storageKey: STORAGE_KEY,
    columns: ['class', 'file', 'description', 'properties', 'linkedFrom', 'linksTo'],
    defaultWidths: { class: 240, file: 120, description: 320, properties: 420, linkedFrom: 240, linksTo: 240 },
    minWidths: { class: 140, file: 90, description: 140, properties: 160, linkedFrom: 130, linksTo: 130 },
  });
  readonly columnLabels = COLUMN_LABELS;
  readonly maxProperties = MAX_PROPERTIES;
  readonly maxLinks = MAX_LINKS;
  readonly noFile = NO_FILE;

  /** Condensed rows of one line, or expanded rows showing everything; remembered in this browser. */
  readonly density = rememberedSignal<Density>(`${STORAGE_KEY}-density`, 'condensed', stored =>
    stored === 'expanded' ? 'expanded' : 'condensed'
  );
  /** Every language of a name or description stacked, or only the one the app shows; remembered in this browser. */
  readonly allLanguages = rememberedSignal(`${STORAGE_KEY}-all-languages`, false, stored => stored === 'true');
  /** Whether the table is scrolled sideways, which shadows the frozen class column. */
  readonly scrolled = signal(false);

  /** The class names and descriptions edited from their cells. */
  readonly textEditing = new TextEditing((target, texts) =>
    this.editing.saveClassTexts(target.id, target.kind === 'label' ? { labels: texts } : { descriptions: texts })
  );
  readonly canEditTexts = computed(() => this.state.canEdit() && this.editing.canSaveInPlace);

  readonly query = signal('');
  /** The column filters; an empty set or text filters nothing. */
  readonly level = signal<Level>('all');
  readonly files = signal(new Set<string>());
  readonly describedAs = signal('');
  readonly types = signal(new Set<string>());
  readonly targets = signal(new Set<string>());
  readonly sources = signal(new Set<string>());

  /** What the search and the Description filter look for, marked where the table shows it. */
  readonly searchTerms = computed(() => [this.query()]);
  readonly descriptionTerms = computed(() => [this.query(), this.describedAs()]);

  /** What each filter offers: what the classes have. */
  readonly fileOptions = computed(() => {
    const present = new Set<string>(this.state.classRows().map(row => row.representation ?? NO_FILE));
    return [...FILE_KINDS.map(kind => kind.representation as string), NO_FILE].filter(option => present.has(option));
  });
  readonly typeOptions = computed(() =>
    [...new Set(this.state.classRows().flatMap(row => row.propertyList.map(property => property.type)))].sort((a, b) =>
      typeNameOf(a).localeCompare(typeNameOf(b))
    )
  );
  readonly sourceOptions = computed(() => this._byLabel(this.state.classRows().flatMap(row => row.linkedFrom)));
  readonly targetOptions = computed(() => this._byLabel(this.state.classRows().flatMap(row => row.linksTo)));

  readonly rows = computed(() => {
    const query = this.query().trim().toLowerCase();
    const level = this.level();
    const files = this.files();
    const describedAs = this.describedAs().trim().toLowerCase();
    const types = this.types();
    const targets = this.targets();
    const sources = this.sources();
    const shown = this.columns.shown();
    return this.state
      .classRows()
      .filter(row => !query || shown.some(column => this._columnHas(row, column, query)))
      .filter(row => level === 'all' || (level === 'sub') === !!row.superclass)
      .filter(row => !files.size || files.has(row.representation ?? NO_FILE))
      .filter(
        row =>
          !describedAs ||
          row.description.toLowerCase().includes(describedAs) ||
          row.descriptions.some(text => text.value.toLowerCase().includes(describedAs))
      )
      .filter(row => !types.size || row.propertyList.some(property => types.has(property.type)))
      .filter(row => !targets.size || row.linksTo.some(target => targets.has(target)))
      .filter(row => !sources.size || row.linkedFrom.some(source => sources.has(source)));
  });

  /** Every row of a family with subclasses, main class included, in the family's tone. */
  readonly tints = computed(() => {
    const graph = this.state.graph();
    const tints = new Map<string, string>();
    if (!graph) return tints;
    const families = classFamilies(graph);
    const withSubclasses = new Set([...families.values()].filter(family => family.sub).map(family => family.root));
    for (const [iri, family] of families) {
      if (withSubclasses.has(family.root)) tints.set(iri, familyTint(familyHue(family.index).base, FAMILY_TINT));
    }
    return tints;
  });

  /** The class whose panel is open, named in the URL like in the graph. */
  readonly panelIri = computed(() => {
    const name = this._params()?.get(ONTOLOGY_MAP_PARAM.panel);
    return name ? this.state.classRows().find(row => row.name === name)?.id : undefined;
  });

  /** The property whose panel is open, from a click on its chip; the class panel goes first. */
  readonly propertyPanelIri = computed(() => {
    const name = this._params()?.get(ONTOLOGY_MAP_PARAM.propertyPanel);
    return name ? this.state.propertyRows().find(row => row.name === name)?.id : undefined;
  });

  private readonly _search = viewChild<ElementRef<HTMLInputElement>>('search');

  constructor() {
    // Arriving on the page, typing finds a class.
    afterNextRender(() => this._search()?.nativeElement.focus());
  }

  onScroll(event: Event): void {
    this.scrolled.set((event.target as HTMLElement).scrollLeft > 0);
  }

  /** The properties a row shows: the first few condensed, all of them expanded. */
  shownProperties(row: ClassRow): ClassRow['propertyList'] {
    return this.density() === 'expanded' ? row.propertyList : row.propertyList.slice(0, MAX_PROPERTIES);
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

  fileIcon(representation: RepresentationClass): string {
    return FILE_KINDS.find(kind => kind.representation === representation)?.icon ?? 'insert_drive_file';
  }

  typeName(type: string): string {
    return typeNameOf(type);
  }

  typeIcon(type: string): string {
    return typeIconOf(type);
  }

  /** Opens the editor of a class's name or description, on the language asked for. */
  editText(row: ClassRow, kind: TextKind, edit: LanguageTextEdit): void {
    this.textEditing.open({
      ...edit,
      id: row.id,
      label: row.label,
      kind,
      texts: kind === 'label' ? row.labels : row.descriptions,
    });
  }

  /** Opens the class's panel, or closes it; a step in the browser history. */
  openPanel(classIri: string | undefined): void {
    this._navigate({
      [ONTOLOGY_MAP_PARAM.panel]: classIri ? localNameOf(classIri) : null,
      [ONTOLOGY_MAP_PARAM.propertyPanel]: null,
    });
  }

  /** Opens the property's panel in place of the class's, or closes it; a step in the browser history. */
  openProperty(propertyIri: string | undefined): void {
    this._navigate({
      [ONTOLOGY_MAP_PARAM.panel]: null,
      [ONTOLOGY_MAP_PARAM.propertyPanel]: propertyIri ? localNameOf(propertyIri) : null,
    });
  }

  /** Shows only the links through the property, in the graph. */
  filterOnProperty(iri: string): void {
    this.state.openSection(RouteConstants.graph, { [ONTOLOGY_MAP_PARAM.property]: localNameOf(iri) });
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

  /** Edits the class in the data model editor's dialog; see `injectDataModelEditing`. */
  edit(iri: string): void {
    this.editing.editClass(iri);
  }

  private _navigate(queryParams: Record<string, string | null>): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParamsHandling: 'merge',
      queryParams: { ...this.state.modelParam(), ...queryParams },
    });
  }

  /** Whether what a column shows of a class has the searched text, in any language. */
  private _columnHas(row: ClassRow, column: Column, query: string): boolean {
    const has = (text: string | undefined) => !!text && text.toLowerCase().includes(query);
    const hasClass = (iri: string | undefined) => !!iri && has(this.state.labelOf(iri));
    switch (column) {
      case 'class':
        return has(row.label) || has(row.name) || row.labels.some(text => has(text.value)) || hasClass(row.superclass);
      case 'file':
        return (
          !!row.representation &&
          has(this._translate.instant(`pages.ontologyMap.islands.fileKinds.${row.representation}`))
        );
      case 'description':
        return has(row.description) || row.descriptions.some(text => has(text.value));
      case 'properties':
        return row.propertyList.some(property => has(property.label) || hasClass(property.linkTarget));
      case 'linkedFrom':
        return row.linkedFrom.some(hasClass);
      case 'linksTo':
        return row.linksTo.some(hasClass);
    }
  }

  private _byLabel(iris: string[]): string[] {
    return [...new Set(iris)].sort((a, b) => this.state.labelOf(a).localeCompare(this.state.labelOf(b)));
  }
}
