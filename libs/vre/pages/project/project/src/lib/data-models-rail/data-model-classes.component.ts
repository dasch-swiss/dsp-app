import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
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
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { RepresentationClass } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { DefaultClass, DefaultResourceClasses, OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CanDo, injectDataModelEditing } from '../ontology-map/data-model-editor';
import { openDeleteBlockersDialog } from '../ontology-map/delete-blockers-dialog.component';
import { classFamilies, familyHue, familyTint, FILE_KINDS } from '../ontology-map/islands';
import { ClassRow, localNameOf } from '../ontology-map/ontology-graph-elements';
import { ONTOLOGY_MAP_PARAM } from '../ontology-map/ontology-map-page.component';
import { PropertyPanelComponent } from '../ontology-map/property-panel.component';
import { typeIconOf, typeNameOf } from '../ontology-map/property-types';
import { ResourceClassPanelComponent } from '../ontology-map/resource-class-panel.component';
import { ClassChipsComponent } from './class-chips.component';
import { ColumnHeaderComponent } from './column-header.component';
import { ColumnsMenuComponent } from './columns-menu.component';
import { DataModelClassCardsComponent, PropertyOrder } from './data-model-class-cards.component';
import { DataModelsRailState } from './data-models-rail-state';
import { escapeClosesPanel } from './escape-closes';
import { HighlightPipe } from './highlight.pipe';
import { LanguageTextsComponent } from './language-texts.component';
import { LanguagesMenuComponent, parseLanguages } from './languages-menu.component';
import { RAIL_SECTION_STYLES } from './rail-section-styles';
import { rememberedSignal } from './remembered-signal';
import { TableColumns } from './table-columns';
import { TABLE_STYLES } from './table-styles';

/** How many properties and linked classes a condensed row shows; the others are counted. */
const MAX_PROPERTIES = 3;
const MAX_LINKS = 2;
/** How strongly the rows of a family with subclasses are tinted with its hue. */
const FAMILY_TINT = 0.2;
/** Where the languages the Data models 2 tables show in are remembered, the same for both. */
const LANGUAGES_KEY = 'dsp-data-models-languages';
const STORAGE_KEY = 'dsp-data-models-classes';
/** The File filter's value for classes without file. */
const NO_FILE = 'none';

type Column = 'class' | 'file' | 'description' | 'properties' | 'linkedFrom' | 'linksTo';
type Density = 'condensed' | 'expanded';
/** How the classes show: as cards, one per class with its properties, or in the table. */
type ClassesLayout = 'cards' | 'table';
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
  host: { '(document:keydown.escape)': 'closeOnEscape($event)' },
  imports: [
    CdkDrag,
    CdkDropList,
    ClassChipsComponent,
    ColumnHeaderComponent,
    ColumnsMenuComponent,
    DataModelClassCardsComponent,
    HighlightPipe,
    LanguagesMenuComponent,
    LanguageTextsComponent,
    MatButton,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatCell,
    MatCellDef,
    MatCheckbox,
    MatColumnDef,
    MatDivider,
    MatFormField,
    MatHeaderCell,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuContent,
    MatMenuItem,
    MatMenuTrigger,
    MatInput,
    MatPrefix,
    MatRadioButton,
    MatRadioGroup,
    MatRow,
    MatRowDef,
    MatSlideToggle,
    MatTable,
    MatTooltip,
    PropertyPanelComponent,
    ResourceClassPanelComponent,
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
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
          <mat-icon matPrefix>search</mat-icon>
          <input
            #search
            matInput
            data-cy="data-model-classes-search"
            [placeholder]="(layout() === 'cards' ? r + '.findInCards' : r + '.findClass') | translate"
            [attr.aria-label]="(layout() === 'cards' ? r + '.findInCards' : r + '.findClass') | translate"
            (input)="query.set(search.value)" />
        </mat-form-field>
        <!-- For editors: a class of the kind picked, made in the data model editor's dialog, then opened in the panel. -->
        @if (canCreate()) {
          <button
            mat-flat-button
            color="primary"
            type="button"
            class="create"
            data-cy="data-model-classes-create"
            [matMenuTriggerFor]="createMenu">
            <mat-icon>add</mat-icon>
            {{ r + '.createClass' | translate }}
          </button>
          <mat-menu #createMenu="matMenu">
            @for (kind of classKinds; track kind.iri) {
              <button
                mat-menu-item
                type="button"
                [attr.data-cy]="'data-model-classes-create-' + kind.label"
                (click)="createClass(kind)">
                <mat-icon>{{ kind.icon }}</mat-icon>
                {{ kind.label }}
              </button>
            }
          </mat-menu>
        }
        <!-- What each layout adds, wrapping on its own so the layout switch stays put at the right. -->
        <div class="tools">
          @if (layout() === 'cards' && rows().length) {
            <button mat-button type="button" data-cy="data-model-class-cards-fold" (click)="toggleAllCards()">
              <mat-icon>{{ allCardsOpen() ? 'unfold_less' : 'unfold_more' }}</mat-icon>
              {{ (allCardsOpen() ? r + '.collapseAll' : r + '.expandAll') | translate }}
            </button>
            <!-- How the cards show links: apart from the values, and their targets in colour. -->
            <button
              mat-button
              type="button"
              class="view-options"
              data-cy="data-model-class-cards-view-options"
              [matMenuTriggerFor]="cardsView">
              <mat-icon>tune</mat-icon>
              {{ 'pages.dataBrowser.viewOptions.title' | translate }}
            </button>
            <mat-menu #cardsView="matMenu" xPosition="before">
              <div
                class="cards-view"
                (click)="$event.stopPropagation()"
                (keydown)="$event.key !== 'Escape' && $event.stopPropagation()">
                <span class="view-heading first">{{ r + '.links' | translate }}</span>
                <mat-slide-toggle
                  class="view-toggle"
                  data-cy="data-model-class-cards-group-links"
                  [checked]="groupLinks()"
                  (change)="groupLinks.set($event.checked)">
                  {{ r + '.groupLinks' | translate }}
                </mat-slide-toggle>
                <mat-slide-toggle
                  class="view-toggle"
                  data-cy="data-model-class-cards-link-chips"
                  [checked]="linkChips()"
                  (change)="linkChips.set($event.checked)">
                  {{ r + '.linkChips' | translate }}
                </mat-slide-toggle>
              </div>
            </mat-menu>
          }
          @if (layout() === 'table') {
            <app-columns-menu [columns]="cols" [labels]="columnLabels" cyPrefix="data-model-classes">
              <span class="view-heading">{{ r + '.display' | translate }}</span>
              <mat-slide-toggle
                class="view-toggle"
                data-cy="data-model-classes-row-colors"
                [checked]="rowColors()"
                (change)="rowColors.set($event.checked)">
                {{ r + '.rowColors' | translate }}
              </mat-slide-toggle>
            </app-columns-menu>
            <app-languages-menu [(chosen)]="languages" cyPrefix="data-model-classes" />
          }
          @if (layout() === 'table' && folding() && foldable().size) {
            <button mat-button type="button" data-cy="data-model-classes-expand" (click)="toggleAllFolds()">
              <mat-icon>{{ allExpanded() ? 'unfold_less' : 'unfold_more' }}</mat-icon>
              {{ (allExpanded() ? r + '.collapseAll' : r + '.expandAll') | translate }}
            </button>
          }
          @if (layout() === 'table') {
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
          }
        </div>
        <!-- Cards, as the Data models tab shows a data model, or the table; last, so it stays put when switched. -->
        <mat-button-toggle-group
          class="density layout-switch"
          hideSingleSelectionIndicator
          data-cy="data-model-classes-layout"
          [attr.aria-label]="r + '.layout' | translate"
          [value]="layout()"
          (change)="layout.set($event.value)">
          <mat-button-toggle
            value="cards"
            data-cy="data-model-classes-layout-cards"
            [matTooltip]="r + '.cardsTip' | translate">
            <mat-icon>view_module</mat-icon>
            {{ r + '.cards' | translate }}
          </mat-button-toggle>
          <mat-button-toggle value="table" data-cy="data-model-classes-layout-table">
            <mat-icon>table_rows</mat-icon>
            {{ r + '.table' | translate }}
          </mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      @if (layout() === 'cards') {
        <app-data-model-class-cards
          class="cards-box"
          [rows]="rows()"
          [classes]="state.classRows()"
          [colors]="state.colors()"
          [labelOf]="labelOf"
          [selected]="panelIri()"
          [canEdit]="state.canEdit()"
          [groupLinks]="groupLinks()"
          [linkChips]="linkChips()"
          [canReorder]="editing.canReorder"
          [query]="query()"
          [(folded)]="foldedCards"
          (reorder)="reorderProperties($event)"
          [graph]="state.graph()"
          (browse)="browse($event)"
          (editClass)="edit($event)"
          (editProperty)="editing.editProperty($event)" />
        @if (rows().length === 0) {
          <p class="empty">{{ r + '.noMatch' | translate }}</p>
        }
      } @else {
        <div class="table-box" [class.scrolled]="scrolled()" (scroll)="onScroll($event)">
          <table
            mat-table
            [dataSource]="rows()"
            data-cy="data-model-classes"
            [class.expanded]="expanded"
            [style.width.px]="cols.tableWidth() + actionsWidth"
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
                <span class="labelled" [style.padding-left.px]="row.depth * indent" [title]="row.name">
                  @if (folding()) {
                    @if (foldable().has(row.id)) {
                      <button
                        type="button"
                        class="toggle"
                        data-cy="data-model-classes-toggle"
                        [attr.aria-expanded]="!collapsed().has(row.id)"
                        [attr.aria-label]="
                          (collapsed().has(row.id) ? r + '.expandRow' : r + '.collapseRow') | translate
                        "
                        (click)="$event.stopPropagation(); toggleFold(row.id)">
                        <mat-icon>{{ collapsed().has(row.id) ? 'chevron_right' : 'expand_more' }}</mat-icon>
                      </button>
                    } @else {
                      <span class="leaf" aria-hidden="true"></span>
                    }
                  }
                  <span class="swatch" [style.background]="state.colors().get(row.id)"></span>
                  <span class="texts">
                    <app-language-texts
                      kind="label"
                      cyPrefix="data-model-classes"
                      [texts]="row.labels"
                      [shown]="row.label"
                      [owner]="row.label"
                      [languages]="languages()"
                      [canEdit]="canEditTexts()"
                      [expanded]="expanded"
                      [highlight]="searchTerms()"
                      (edit)="editText(row)" />
                    @if (!folding() && row.superclass; as superclass) {
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
                  [languages]="languages()"
                  [canEdit]="canEditTexts()"
                  [expanded]="expanded"
                  [highlight]="descriptionTerms()"
                  (edit)="editText(row)" />
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
                  [highlight]="searchTerms()"
                  [selected]="panelIri()"
                  (classSelected)="openPanel($event)" />
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
                  [highlight]="searchTerms()"
                  [selected]="panelIri()"
                  (classSelected)="openPanel($event)" />
              </td>
            </ng-container>
            <!-- Each class's actions, in a menu kept in view at the end of the row, as in the Properties table. -->
            <ng-container matColumnDef="actions" stickyEnd>
              <th mat-header-cell *matHeaderCellDef class="actions-cell" [style.width.px]="actionsWidth"></th>
              <td mat-cell *matCellDef="let row" class="actions-cell">
                <button
                  mat-icon-button
                  type="button"
                  class="row-menu"
                  data-cy="data-model-classes-actions"
                  [attr.aria-label]="r + '.classActions' | translate: { class: row.label }"
                  [matTooltip]="r + '.classActions' | translate: { class: row.label }"
                  matTooltipShowDelay="600"
                  [matMenuTriggerFor]="rowMenu"
                  [matMenuTriggerData]="{ row }"
                  (click)="$event.stopPropagation()"
                  (keydown.enter)="$event.stopPropagation()"
                  (menuOpened)="checkDelete(row.id)">
                  <mat-icon>more_vert</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="shownColumns(); sticky: true"></tr>
            <tr
              mat-row
              *matRowDef="let row; columns: shownColumns()"
              data-cy="data-model-classes-row"
              tabindex="0"
              [class.selected]="row.id === panelIri()"
              [style.background]="row.id === panelIri() || !rowColors() ? null : tints().get(row.id)"
              (click)="openPanel(row.id)"
              (keydown.enter)="openPanel(row.id)"></tr>
          </table>
          @if (rows().length === 0) {
            <p class="empty">{{ r + '.noMatch' | translate }}</p>
          }
        </div>
      }

      <mat-menu #rowMenu="matMenu" xPosition="before">
        <ng-template matMenuContent let-row="row">
          @if (state.canEdit()) {
            <button mat-menu-item type="button" data-cy="data-model-classes-edit" (click)="edit(row.id)">
              <mat-icon>edit</mat-icon>
              {{ r + '.editClass' | translate }}
            </button>
          }
          <button mat-menu-item type="button" data-cy="data-model-classes-browse" (click)="browse(row.id)">
            <mat-icon>view_list</mat-icon>
            {{ r + '.deleteBlockers.browse' | translate }}
          </button>
          <button mat-menu-item type="button" data-cy="data-model-classes-diagram" (click)="filterOn(row.id)">
            <mat-icon>hub</mat-icon>
            {{ r + '.showInDiagram' | translate }}
          </button>
          <!-- Deleting the class once the API says nothing uses it; else what is in the way, and how to clear it. -->
          @if (state.canEdit() && editing.canDelete) {
            @let check = deleteChecks().get(row.id);
            <mat-divider />
            <button
              mat-menu-item
              type="button"
              class="delete"
              data-cy="data-model-classes-delete"
              [class.blocked]="check?.canDo === false"
              [disabled]="!check"
              (click)="check?.canDo ? deleteClass(row) : openDeleteHelp(row)">
              <mat-icon>delete</mat-icon>
              <span class="menu-text">
                {{ r + '.deleteClass' | translate }}
                @if (!check) {
                  <small>{{ r + '.checkingDelete' | translate }}</small>
                } @else if (!check.canDo) {
                  <small>{{ r + '.cannotDeleteClassHelp' | translate }}</small>
                }
              </span>
            </button>
          }
        </ng-template>
      </mat-menu>

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
            [linkChips]="linkChips()"
            [groupLinks]="groupLinks()"
            (classSelected)="openPanel($event)"
            (closed)="openPanel(undefined)"
            (browse)="browse($event)"
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
            (propertySelected)="openProperty($event)"
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

      // Says the Cards layout is new, until the layouts are switched once.
      // Title, search, tools and the layout switch on one line; only the tools wrap.
      .head {
        flex-wrap: nowrap;
      }

      // The layout switch at the top right, whether or not the tools beside it wrap.
      .layout-switch {
        flex: none;
        align-self: flex-start;
      }

      .tools {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 8px 12px;
        // Never narrower than its widest tool, which would then lie over the create button.
        min-width: min-content;
        // Each tool keeps its width; a tool that does not fit goes to the next line rather than over its neighbour.
        > * {
          flex: none;
          white-space: nowrap;
        }
      }

      // The title on one line, whatever room the tools take.
      .head h2 {
        white-space: nowrap;
      }

      // On a narrow screen the search gives room first, down to a usable width.
      .head .search {
        flex: 0 1 280px;
        min-width: 140px;
      }

      .labelled {
        min-width: 0;
      }

      // The tree: chevrons as in Controlled vocabularies.
      .toggle {
        flex: none;
        display: flex;
        width: 24px;
        height: 24px;
        padding: 0;
        border: 0;
        border-radius: 4px;
        background: none;
        color: $cool_gray_600;
        cursor: pointer;

        &:hover {
          background: $cool_gray_100;
        }
      }

      .leaf {
        flex: none;
        width: 24px;
      }

      // The table's other options, in View options under its columns.
      .view-heading {
        margin-top: 8px;
        padding: 8px 0 4px;
        border-top: 1px solid $cool_gray_200;
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: $cool_gray_500;
      }

      .view-toggle {
        padding: 4px 0 6px;
        font-size: 13px;
      }

      // The cards' View options: no columns above, so its first heading has no line.
      .view-options {
        font-size: 13px;
      }

      .cards-view {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 220px;
        padding: 4px 12px;

        .view-heading.first {
          margin-top: 0;
          border-top: 0;
        }
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

      // Deleting, in red once possible, and why not, under it.
      .delete:not([disabled]):not(.blocked),
      .delete:not([disabled]):not(.blocked) mat-icon {
        color: #b3261e;
      }

      .menu-text small {
        display: block;
        font-size: 11.5px;
        line-height: 1.3;
        color: $cool_gray_500;
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
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _dialog = inject(MatDialog);
  private readonly _injector = inject(Injector);
  /** The width of the menu column, past the columns shown. */
  readonly actionsWidth = 48;
  /** The columns shown, then the menu's. */
  readonly shownColumns = computed(() => [...this.columns.shown(), 'actions']);
  /** What the API says of deleting each class whose menu was opened. */
  readonly deleteChecks = signal(new Map<string, CanDo>());

  /** Asks the API whether the class can be deleted, for its menu to say so. */
  checkDelete(classIri: string): void {
    if (!this.state.canEdit() || !this.editing.canDelete) return;
    this.deleteChecks.update(checks => {
      const next = new Map(checks);
      next.delete(classIri);
      return next;
    });
    this.editing
      .canDeleteClass(classIri)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(check => this.deleteChecks.update(checks => new Map(checks).set(classIri, check)));
  }

  /** Deletes the class once confirmed, closing its panel; the data model is then read again. */
  deleteClass(row: ClassRow): void {
    this.editing
      .deleteClass(row.id, row.label)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(deleted => deleted && this.panelIri() === row.id && this.openPanel(undefined));
  }

  /** The checklist of what keeps the class from being deleted, each with the action that clears it. */
  openDeleteHelp(row: ClassRow): void {
    openDeleteBlockersDialog(this._dialog, this._injector, {
      kind: 'class',
      iri: row.id,
      label: row.label,
      graph: this.state.graph,
      open: iri => this.openPanel(iri),
      browse: iri => this.browse(iri),
    });
  }

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

  /**
   * Cards, one per class with its properties as the Data models tab shows them, or the table; cards at first, as that
   * is the picture people know; remembered in this browser.
   */
  readonly layout = rememberedSignal<ClassesLayout>(`${STORAGE_KEY}-layout`, 'cards', stored =>
    stored === 'table' ? 'table' : 'cards'
  );
  /** The cards folded to their title: none at first, so every class shows its properties, as in the Data models tab. */
  readonly foldedCards = signal(new Set<string>());
  readonly allCardsOpen = computed(() => {
    const rows = this.rows();
    return rows.length > 0 && rows.every(row => !this.foldedCards().has(row.id));
  });

  /** Whether the cards show a class's values, then its links, apart; off at first; remembered in this browser. */
  readonly groupLinks = rememberedSignal(`${STORAGE_KEY}-group-links`, false, stored => stored === 'true');
  /** Whether the cards show a link's target as a chip in its family's colour; off at first; remembered. */
  readonly linkChips = rememberedSignal(`${STORAGE_KEY}-link-chips`, false, stored => stored === 'true');

  /** Saves the form order a property was dragged to on a card; the data model is then read again. */
  reorderProperties({ classIri, propertyIris }: PropertyOrder): void {
    this.editing.reorderProperties(classIri, propertyIris).pipe(takeUntilDestroyed(this._destroyRef)).subscribe();
  }

  toggleAllCards(): void {
    this.foldedCards.set(this.allCardsOpen() ? new Set(this.rows().map(row => row.id)) : new Set());
  }

  /** The kinds of class to create, as the data model editor offers them. */
  readonly classKinds = DefaultResourceClasses.data;
  /** Whether "Create resource class" shows: for editors, where the editor's dialogs are at hand. */
  readonly canCreate = computed(() => this.state.canEdit() && this.editing.canCreate);

  /** Creates a class of that kind in the data model shown; the table then opens it in the panel, the cards don't. */
  createClass(kind: DefaultClass): void {
    const ontologyIri = this.state.selected()?.iri;
    if (!ontologyIri) return;
    this.editing.createClass(ontologyIri, kind, iri => {
      if (this.layout() === 'table') this.openPanel(iri);
    });
  }

  /** A class's label from its IRI, for the cards. */
  readonly labelOf = (iri: string) => this.state.labelOf(iri);
  /** Condensed rows of one line, or expanded rows showing everything; remembered in this browser. */
  readonly density = rememberedSignal<Density>(`${STORAGE_KEY}-density`, 'condensed', stored =>
    stored === 'expanded' ? 'expanded' : 'condensed'
  );
  /** The languages names and descriptions show in; none chosen follows the app language. Shared by both tables. */
  readonly languages = rememberedSignal<string[] | null>(LANGUAGES_KEY, null, parseLanguages);
  /** Whether the rows of a family with subclasses take its tone; off at first; remembered in this browser. */
  readonly rowColors = rememberedSignal(`${STORAGE_KEY}-family-colours`, false, stored => stored === 'true');
  /** Whether the table is scrolled sideways, which shadows the frozen class column. */
  readonly scrolled = signal(false);

  /** The class names and descriptions edited from their cells. */
  readonly canEditTexts = computed(() => this.state.canEdit() && this.editing.canEditInPlace);

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

  /** How far a level of subclasses is indented, in px: one chevron's width. */
  readonly indent = 24;
  /** The classes folded, their subclasses hidden. */
  readonly collapsed = signal(new Set<string>());
  /** Each class with subclasses, and how many it has; it gets a chevron. */
  readonly foldable = computed(() => {
    const counts = new Map<string, number>();
    for (const row of this.state.classRows()) {
      if (row.superclass) counts.set(row.superclass, (counts.get(row.superclass) ?? 0) + 1);
    }
    return counts;
  });
  /**
   * Whether the table shows the classes as a tree, folding: nothing searched or filtered. A search or a filter lists
   * what it finds wherever it is, each subclass saying its superclass.
   */
  readonly folding = computed(
    () =>
      !this.query().trim() &&
      this.level() === 'all' &&
      !this.files().size &&
      !this.describedAs().trim() &&
      !this.types().size &&
      !this.targets().size &&
      !this.sources().size
  );
  readonly allExpanded = computed(() => this.collapsed().size === 0);

  toggleFold(iri: string): void {
    this.collapsed.update(collapsed => {
      const next = new Set(collapsed);
      if (!next.delete(iri)) next.add(iri);
      return next;
    });
  }

  toggleAllFolds(): void {
    this.collapsed.set(this.allExpanded() ? new Set(this.foldable().keys()) : new Set());
  }

  /** Whether a folded class is above the row. */
  private _folded(row: ClassRow): boolean {
    const collapsed = this.collapsed();
    if (!collapsed.size) return false;
    const superclassOf = new Map(this.state.classRows().map(other => [other.id, other.superclass]));
    const seen = new Set<string>();
    for (let up = row.superclass; up && !seen.has(up); up = superclassOf.get(up)) {
      if (collapsed.has(up)) return true;
      seen.add(up);
    }
    return false;
  }

  readonly rows = computed(() => {
    const folding = this.folding();
    const query = this.query().trim().toLowerCase();
    const level = this.level();
    const files = this.files();
    const describedAs = this.describedAs().trim().toLowerCase();
    const types = this.types();
    const targets = this.targets();
    const sources = this.sources();
    // The table searches the columns it shows; the cards, what they show: names, file and properties.
    const searched: Column[] = this.layout() === 'cards' ? ['class', 'file', 'properties'] : this.columns.shown();
    return this.state
      .classRows()
      .filter(row => !query || searched.some(column => this._columnHas(row, column, query)))
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
      .filter(row => !sources.size || row.linkedFrom.some(source => sources.has(source)))
      .filter(row => !folding || !this._folded(row));
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
  editText(row: ClassRow): void {
    this.editing.editClass(row.id);
  }

  /**
   * Esc closes the class's or property's side panel open. Not the name or description editor, which edits: Esc never drops an edit,
   * and leaves the panel under it open too.
   */
  closeOnEscape(event: Event): void {
    if (!escapeClosesPanel(event)) return;
    if (this.panelIri()) this.openPanel(undefined);
    else if (this.propertyPanelIri()) this.openProperty(undefined);
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
        return row.propertyList.some(
          property =>
            has(property.label) ||
            has(property.id.substring(property.id.lastIndexOf('#') + 1)) ||
            hasClass(property.linkTarget)
        );
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
