import { Clipboard } from '@angular/cdk/clipboard';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { LocalizationService, OntologyService, SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { combineLatest, map } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { DataModelGraphService } from '../sidenav/data-model-map/data-model-graph.service';
import { injectDataModelEditing } from './data-model-editor';
import { FilterMenuComponent, FilterOption } from './filter-menu.component';
import { graphSearchResults, GraphSearchResultsComponent, SearchResult } from './graph-search-results.component';
import { classFamilies, familyColors } from './islands';
import {
  GraphLabels,
  GraphSize,
  linkedWith,
  dataModelNameOf,
  localNameOf,
  focusGraph,
  searchGraph,
  throughProperties,
  withInheritedLinks,
  withoutClasses,
  withoutProperties,
} from './ontology-graph-elements';
import { GraphExportArea, OntologyGraphComponent } from './ontology-graph.component';
import { PropertyPanelComponent } from './property-panel.component';
import { ResourceClassPanelComponent } from './resource-class-panel.component';

/**
 * Query parameters of the Ontology map tab: the data model to show, the class to outline, the class whose panel is
 * open, the link property whose panel is open, and the classes or properties the graph is filtered on. Classes are named by the end of their IRI, within the data model.
 */
export const ONTOLOGY_MAP_PARAM = {
  ontology: 'ontology',
  class: 'class',
  panel: 'panel',
  filter: 'filter',
  hide: 'hide',
  property: 'property',
  hideProperty: 'hideProperty',
  propertyPanel: 'propertyPanel',
} as const;

/**
 * A class or property filter: `only` shows the chosen ones (classes with the classes they are linked with), `hide`
 * shows all but the chosen ones; no mode, no filter.
 */
interface ListFilter {
  mode?: 'only' | 'hide';
  iris: string[];
}

/** What a filter chip says after its name: a label, or a text to translate. */
interface ChipValue {
  label?: string;
  key?: string;
  params?: Record<string, unknown>;
}

const NOTHING: DataModelGraph = { nodes: [], edges: [] };

const sameFilter = (a: ListFilter, b: ListFilter) =>
  a.mode === b.mode && a.iris.length === b.iris.length && a.iris.every((iri, i) => iri === b.iris[i]);

const classNameOf = (iri: string) => iri.substring(iri.lastIndexOf('#') + 1);

// Renamed when the sizes moved up a step, so a size chosen before starts again from the new normal, the old large.
const SIZE_KEY = 'dsp-ontology-map-text-size';
/** How wide a class or property panel is, at most half the page; its styles say the same. */
const PANEL_WIDTH = 440;
/** How long the arrow keys rest on a search result before its panel shows. */
const PREVIEW_DELAY_MS = 150;
const LEVEL_LABELS_KEY = 'dsp-ontology-map-level-labels';
const ISLANDS_KEY = 'dsp-ontology-map-islands';
const COLOUR_TAB_KEY = 'dsp-ontology-map-colour-tab';
const TREE_LINES_KEY = 'dsp-ontology-map-tree-lines';
const FULL_WIDTH_KEY = 'dsp-ontology-map-full-width';
/** The widest screen, in CSS px, on which the graph uses the whole width until the user chooses; see `fullWidth`. */
const FULL_WIDTH_UP_TO = 2560;
const LABELS_KEY = 'dsp-ontology-map-labels';

const LABEL_OPTIONS: GraphLabels[] = ['labels', 'names', 'both'];

const SIZES: GraphSize[] = ['small', 'normal', 'large'];

type ExportKey = 'viewPng' | 'wholePng' | 'copyImage' | 'copyLink';

const EXPORT_ITEMS: { key: ExportKey; icon: string }[] = [
  { key: 'viewPng', icon: 'image' },
  { key: 'wholePng', icon: 'zoom_out_map' },
  { key: 'copyImage', icon: 'content_copy' },
  { key: 'copyLink', icon: 'link' },
];

/**
 * The Ontology map tab: the map of one data model of the project, drawn large across the page, with a toolbar to
 * pick the data model and how much each card shows. A class clicked on it opens its details in a panel docked at
 * the right, from which it can be browsed in the Data tab or edited.
 */
@Component({
  selector: 'app-ontology-map-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeOnEscape($event)' },
  imports: [
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    FilterMenuComponent,
    GraphSearchResultsComponent,
    MatIcon,
    MatMenu,
    MatMenuContent,
    MatMenuItem,
    MatMenuTrigger,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatSlideToggle,
    MatTooltip,
    OntologyGraphComponent,
    PropertyPanelComponent,
    ResourceClassPanelComponent,
    TranslatePipe,
  ],
  template: `
    @let t = 'pages.dataBrowser.dataModelMap';
    @let m = 'pages.ontologyMap';
    <div class="page">
      @if (selected(); as selected) {
        <div class="canvas">
          @if (graph(); as graph) {
            <div class="body">
              <app-ontology-graph
                class="view"
                [graph]="graphShown() ?? graph"
                [selectedIri]="classIri()"
                [size]="size()"
                [levelLabels]="levelLabels()"
                [labels]="labels()"
                [islands]="islands()"
                [colourTab]="colourTab()"
                [treeLines]="treeLines()"
                [highlightedProperty]="hoveredProperty() ?? propertyPanelIri()"
                [picked]="picked()"
                [fullWidth]="fullWidth()"
                [covered]="panelOpen() || !fullWidth() ? panelWidth : 0"
                [panelFocus]="panelFocus()"
                [colors]="colors()"
                [families]="families()"
                [search]="search()"
                [anyResourceLabel]="t + '.anyResource' | translate"
                [linksLabel]="'pages.ontologyMap.links' | translate"
                (classSelected)="openPanel($event)"
                (classFiltered)="filterOn($event)"
                (propertySelected)="openPropertyPanel($event)"
                (backgroundClicked)="(panelIri() || propertyPanelIri()) && openPanel(undefined)" />
              <!-- One bar along the top, left of an open panel; on a narrow screen its two halves wrap. -->
              <div class="top-bar" [class.beside-panel]="panelOpen()">
                <!-- What to show, on the left: the search, and the filters beside it. -->
                <div class="top-left">
                  <!-- Typing fades what lies away from the classes and links found; nothing found, nothing fades. -->
                  <label
                    class="float search"
                    cdkOverlayOrigin
                    #searchOrigin="cdkOverlayOrigin"
                    [class.active]="searchText().trim()">
                    <mat-icon>search</mat-icon>
                    <input
                      #searchInput
                      type="search"
                      data-cy="ontology-map-search"
                      [placeholder]="m + '.search.placeholder' | translate"
                      [attr.aria-label]="m + '.search.placeholder' | translate"
                      [value]="searchText()"
                      (input)="searchText.set(searchInput.value); listClosed.set(false); browseAll.set(false)"
                      (click)="listClosed.set(false)"
                      (keydown.arrowdown)="$event.preventDefault(); arrowDown()"
                      (keydown.arrowup)="$event.preventDefault(); searchResults()?.move(-1)"
                      (keydown.enter)="searchResults()?.filterActive()"
                      (keydown.escape)="escapeSearch($event, searchInput)" />
                    @if (searchFound(); as found) {
                      <span class="search-count" data-cy="ontology-map-search-count">{{
                        m + '.search.found' | translate: { count: found }
                      }}</span>
                    } @else if (searchFound() === 0) {
                      <span class="search-count none" data-cy="ontology-map-search-none" role="status">{{
                        m + '.search.none' | translate
                      }}</span>
                    }
                    @if (searchText()) {
                      <button
                        type="button"
                        class="chip-clear"
                        data-cy="ontology-map-search-clear"
                        [attr.aria-label]="m + '.search.clear' | translate"
                        [matTooltip]="m + '.search.clear' | translate"
                        (click)="clearSearch(searchInput)">
                        <mat-icon>close</mat-icon>
                      </button>
                    }
                  </label>
                  <!-- What the search found, under it; a row opens its panel, its Filter filters the graph. -->
                  <ng-template
                    cdkConnectedOverlay
                    [cdkConnectedOverlayOrigin]="searchOrigin"
                    [cdkConnectedOverlayOpen]="searchDropdownOpen()"
                    [cdkConnectedOverlayPositions]="searchDropdownPositions"
                    (overlayOutsideClick)="closeListOnOutsideClick($event)">
                    <app-graph-search-results
                      [results]="searchMatches()"
                      [text]="searchText()"
                      [colors]="colors()"
                      [browseAll]="browsingAll()"
                      [narrowed]="narrowed()"
                      (filtered)="filterOnResult($event, searchInput)"
                      (resetFilter)="clearFilters()"
                      (browsedChange)="browsed.set($event)"
                      (previewed)="preview($event)" />
                  </ng-template>
                  <div class="float filters">
                    <span class="filters-label">{{ m + '.filters' | translate }}</span>
                    <span class="divider"></span>
                    <span class="chip" [class.active]="classFilter().mode">
                      <button
                        type="button"
                        class="chip-trigger"
                        data-cy="ontology-map-class-filter"
                        [matMenuTriggerFor]="classFilterMenu">
                        <mat-icon>filter_list</mat-icon>
                        {{ m + '.classFilter' | translate }}
                        @if (classChip(); as chip) {
                          <b>{{ chip.label ?? (m + '.' + chip.key | translate: chip.params) }}</b>
                        } @else {
                          <mat-icon class="drop">arrow_drop_down</mat-icon>
                        }
                      </button>
                      @if (classFilter().mode) {
                        <button
                          type="button"
                          class="chip-clear"
                          data-cy="ontology-map-class-reset"
                          [attr.aria-label]="m + '.resetFilter' | translate"
                          [matTooltip]="m + '.resetFilter' | translate"
                          (click)="clearFilters()">
                          <mat-icon>close</mat-icon>
                        </button>
                      }
                    </span>
                    <mat-menu #classFilterMenu="matMenu">
                      <ng-template matMenuContent>
                        <app-filter-menu
                          [options]="classMenuOptions()"
                          [ticked]="classTicked()"
                          [allLabel]="m + '.allClasses' | translate"
                          (tickedChange)="onClassesTicked($event)"
                          (only)="setFilter($event)" />
                      </ng-template>
                    </mat-menu>
                    <span class="chip" [class.active]="propertyFilter().mode">
                      <button
                        type="button"
                        class="chip-trigger"
                        data-cy="ontology-map-property-filter"
                        [matMenuTriggerFor]="propertyFilterMenu">
                        <mat-icon>filter_list</mat-icon>
                        {{ m + '.propertyFilter' | translate }}
                        @if (propertyChip(); as chip) {
                          <b>{{ chip.label ?? (m + '.' + chip.key | translate: chip.params) }}</b>
                        } @else {
                          <mat-icon class="drop">arrow_drop_down</mat-icon>
                        }
                      </button>
                      @if (propertyFilter().mode) {
                        <button
                          type="button"
                          class="chip-clear"
                          data-cy="ontology-map-property-reset"
                          [attr.aria-label]="m + '.resetFilter' | translate"
                          [matTooltip]="m + '.resetFilter' | translate"
                          (click)="clearFilters()">
                          <mat-icon>close</mat-icon>
                        </button>
                      }
                    </span>
                    <mat-menu #propertyFilterMenu="matMenu">
                      <ng-template matMenuContent>
                        <app-filter-menu
                          [options]="propertyMenuOptions()"
                          [ticked]="propertyTicked()"
                          [allLabel]="m + '.allProperties' | translate"
                          (tickedChange)="onPropertiesTicked($event)"
                          (only)="setPropertyFilter($event)" />
                      </ng-template>
                    </mat-menu>
                  </div>
                </div>

                <!-- How to show it, and the Export menu: top right, left of an open panel. -->
                <div class="top-right">
                  <button
                    type="button"
                    class="float export"
                    data-cy="ontology-map-labels"
                    [attr.aria-label]="'pages.dataBrowser.viewOptions.title' | translate"
                    [matTooltip]="'pages.dataBrowser.viewOptions.title' | translate"
                    [matTooltipDisabled]="!panelOpen()"
                    [matMenuTriggerFor]="labelsMenu">
                    <mat-icon>tune</mat-icon>
                    <span class="button-text">{{ 'pages.dataBrowser.viewOptions.title' | translate }}</span>
                    <mat-icon class="drop">arrow_drop_down</mat-icon>
                  </button>
                  <!-- View options, as in the tables: what the graph writes, then how links, islands and colours look. -->
                  <mat-menu #labelsMenu="matMenu" xPosition="before" class="view-menu">
                    <span class="menu-heading">{{ m + '.viewMenu.textSize' | translate }}</span>
                    <!-- How big classes, links and their texts are drawn; choosing keeps the menu open. -->
                    <div
                      class="menu-toggle"
                      (click)="$event.stopPropagation()"
                      (keydown)="$event.key !== 'Escape' && $event.stopPropagation()">
                      <mat-button-toggle-group
                        class="size-choice"
                        hideSingleSelectionIndicator
                        [attr.aria-label]="m + '.viewMenu.textSize' | translate"
                        [value]="size()"
                        (change)="setSize($event.value)">
                        @for (option of sizes; track option) {
                          <mat-button-toggle [value]="option" [attr.data-cy]="'ontology-map-size-' + option">
                            <span class="size" [attr.data-size]="option" aria-hidden="true">A</span>
                            {{ m + '.sizes.' + option | translate }}
                          </mat-button-toggle>
                        }
                      </mat-button-toggle-group>
                    </div>
                    <hr class="menu-divider" />
                    <span class="menu-heading">{{ m + '.labelsMenu.heading' | translate }}</span>
                    @for (option of labelOptions; track option) {
                      @let chosen = labels() === option;
                      <!-- Choosing keeps the menu open, to compare the three. -->
                      <button
                        mat-menu-item
                        class="export-entry"
                        role="menuitemradio"
                        [attr.aria-checked]="chosen"
                        [attr.data-cy]="'ontology-map-labels-' + option"
                        (click)="$event.stopPropagation(); setLabels(option)">
                        <mat-icon [class.chosen]="chosen">{{
                          chosen ? 'radio_button_checked' : 'radio_button_unchecked'
                        }}</mat-icon>
                        <span class="export-item">
                          <span>{{ m + '.labelsMenu.' + option | translate }}</span>
                          <span class="export-hint" [class.mono]="option !== 'labels'">{{
                            m + '.labelsMenu.' + option + 'Hint' | translate
                          }}</span>
                        </span>
                      </button>
                    }
                    @for (
                      option of [
                        { section: 'links', key: 'levelLabels', cy: 'level-labels', on: levelLabels() },
                        { section: 'islands', key: 'islandsToggle', cy: 'islands', on: islands() },
                        { section: 'subclasses', key: 'treeLines', cy: 'tree-lines', on: treeLines() },
                        { section: 'colours', key: 'colourTab', cy: 'colour-tab', on: colourTab() },
                        { section: 'panel', key: 'fullWidth', cy: 'full-width', on: fullWidth() },
                      ];
                      track option.key
                    ) {
                      <hr class="menu-divider" />
                      <span class="menu-heading">{{ m + '.viewMenu.' + option.section | translate }}</span>
                      <!-- A switch keeps the menu open, to see the graph change behind it. -->
                      <div class="menu-toggle" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
                        <mat-slide-toggle
                          [attr.data-cy]="'ontology-map-' + option.cy"
                          [checked]="option.on"
                          (change)="setViewOption(option.key, $event.checked)">
                          <span class="export-item">
                            <span>{{ m + '.' + option.key | translate }}</span>
                            <span class="export-hint">{{ m + '.viewMenu.' + option.key + 'Hint' | translate }}</span>
                          </span>
                        </mat-slide-toggle>
                      </div>
                    }
                  </mat-menu>
                  <button
                    type="button"
                    class="float export"
                    data-cy="ontology-map-export"
                    [attr.aria-label]="m + '.export' | translate"
                    [matTooltip]="m + '.export' | translate"
                    [matTooltipDisabled]="!panelOpen()"
                    [matMenuTriggerFor]="exportMenu">
                    <mat-icon>ios_share</mat-icon>
                    <span class="button-text">{{ m + '.export' | translate }}</span>
                    <mat-icon class="drop">arrow_drop_down</mat-icon>
                  </button>
                  <mat-menu #exportMenu="matMenu" xPosition="before" class="export-menu">
                    @for (item of exportItems; track item.key) {
                      @if (item.key === 'copyLink') {
                        <hr class="menu-divider" />
                      }
                      <button
                        class="export-entry"
                        mat-menu-item
                        [attr.data-cy]="'ontology-map-export-' + item.key"
                        (click)="export(item.key)">
                        <mat-icon>{{ item.icon }}</mat-icon>
                        <span class="export-item">
                          <span>{{ m + '.exportMenu.' + item.key | translate }}</span>
                          <span class="export-hint">{{ m + '.exportMenu.' + item.key + 'Hint' | translate }}</span>
                        </span>
                      </button>
                    }
                  </mat-menu>
                </div>
              </div>

              <!-- Zoom, bottom right. -->
              <div
                class="float zoom"
                role="group"
                [attr.aria-label]="m + '.zoom' | translate"
                [class.beside-panel]="panelOpen()">
                <button
                  type="button"
                  class="tool"
                  data-cy="ontology-map-zoom-in"
                  [attr.aria-label]="m + '.zoomIn' | translate"
                  [matTooltip]="m + '.zoomIn' | translate"
                  matTooltipPosition="left"
                  (click)="graphView()?.zoomBy(1.25)">
                  <mat-icon>add</mat-icon>
                </button>
                <button
                  type="button"
                  class="tool"
                  data-cy="ontology-map-zoom-out"
                  [attr.aria-label]="m + '.zoomOut' | translate"
                  [matTooltip]="m + '.zoomOut' | translate"
                  matTooltipPosition="left"
                  (click)="graphView()?.zoomBy(0.8)">
                  <mat-icon>remove</mat-icon>
                </button>
                <span class="divider"></span>
                <button
                  type="button"
                  class="tool"
                  data-cy="ontology-map-fit"
                  [attr.aria-label]="m + '.fit' | translate"
                  [matTooltip]="m + '.fit' | translate"
                  matTooltipPosition="left"
                  (click)="graphView()?.fit()">
                  <mat-icon>fit_screen</mat-icon>
                </button>
              </div>
              @if (panelIri(); as openIri) {
                <app-resource-class-panel
                  class="panel"
                  [graph]="graph"
                  [classIri]="openIri"
                  [anyResourceLabel]="t + '.anyResource' | translate"
                  [subclassLabel]="t + '.subclassOf' | translate"
                  [canEdit]="canEdit() ?? false"
                  [colors]="colors()"
                  [currentModel]="selectedName()"
                  [models]="modelNames()"
                  (classSelected)="openPanel($event)"
                  (closed)="openPanel(undefined)"
                  (openInModel)="openInModel($event)"
                  (browse)="open($event)"
                  (filter)="filterOn($event)"
                  (propertyHovered)="hoveredProperty.set($event)"
                  (edit)="edit($event)"
                  (editProperty)="editProperty($event)" />
              } @else if (propertyPanelIri(); as propertyIri) {
                <app-property-panel
                  class="panel"
                  [graph]="graph"
                  [propertyIri]="propertyIri"
                  [colors]="colors()"
                  [anyResourceLabel]="t + '.anyResource' | translate"
                  [canEdit]="canEdit() ?? false"
                  (classSelected)="openPanel($event)"
                  (closed)="openPanel(undefined)"
                  (filter)="setPropertyFilter([$event])"
                  (propertySelected)="openPropertyPanel($event)"
                  (edit)="editProperty($event)" />
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
      }

      // The map's box, edge to edge: the toolbar on top, then the map and, when a class is open, its panel beside it.
      .canvas {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        height: 100%;
        background: $cool_gray_50;
        overflow: hidden;
      }

      // Controls float over the graph, in its corners, as in a map app; the graph keeps the whole box.
      .float {
        position: absolute;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 4px;
        background: white;
        border: 1px solid $cool_gray_200;
        border-radius: 24px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      }

      // The top bar lets clicks through to the graph between its two halves.
      .top-bar {
        position: absolute;
        z-index: 2;
        top: 16px;
        left: 16px;
        right: 16px;
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
        pointer-events: none;

        > * {
          pointer-events: auto;
        }

        .float {
          position: static;
        }
      }

      // The "Filter" label opens the pill, so its text gets the room a button would have.
      .filters {
        flex-wrap: wrap;
        gap: 4px 6px;
        padding-left: 14px;
      }

      .top-left {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 8px;
      }

      .search {
        gap: 6px;
        height: 42px;
        box-sizing: border-box;
        padding: 0 8px 0 12px;
        cursor: text;

        &.active,
        &:focus-within {
          border-color: $primary;
        }

        > mat-icon {
          flex: none;
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: $cool_gray_500;
        }

        input {
          width: 200px;
          min-width: 0;
          border: 0;
          outline: 0;
          background: none;
          font: inherit;
          font-size: 13px;

          // The browser's own clear button; ours follows the count.
          &::-webkit-search-cancel-button {
            display: none;
          }
        }
      }

      .search-count {
        white-space: nowrap;
        font-size: 12px;
        color: $cool_gray_500;

        &.none {
          color: $red_700;
        }
      }

      // Wrapped onto a second line, the display controls stay on the right.
      .top-right {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .export {
        height: 42px;
        gap: 4px;
        padding: 0 8px 0 14px;
        font: inherit;
        font-size: 13px;
        font-weight: 500;
        color: $cool_gray_700;
        cursor: pointer;

        &:hover {
          background: $cool_gray_50;
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        .drop {
          color: $cool_gray_500;
        }
      }

      // Beside an open panel the corner is narrower: View options and Export keep their icons only.
      .top-bar.beside-panel .button-text {
        display: none;
      }

      .menu-heading {
        display: block;
        padding: 8px 16px 4px;
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: $cool_gray_500;
      }

      .menu-toggle {
        padding: 2px 16px 8px;
        font-size: 13px;

        // The switch's text and its hint on two lines, the switch beside both.
        .export-item {
          max-width: 240px;
          white-space: normal;
        }
      }

      .export-entry mat-icon.chosen {
        color: $primary;
      }

      .mono {
        font-family: 'Roboto Mono', ui-monospace, monospace;
      }

      .menu-divider {
        margin: 4px 0;
        border: 0;
        border-top: 1px solid $cool_gray_100;
      }

      // As in the filter menus: 13px items, 12px hints, 20px icons.
      .export-entry {
        --mat-menu-item-label-text-size: 13px;
        padding-top: 6px;
        padding-bottom: 6px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          margin-right: 12px;
        }
      }

      .export-item {
        display: flex;
        flex-direction: column;
        font-size: 13px;
        line-height: 17px;
      }

      .export-hint {
        font-size: 12px;
        color: $cool_gray_500;
      }

      .zoom {
        right: 16px;
        bottom: 16px;
        flex-direction: column;
        border-radius: 12px;

        .divider {
          width: 22px;
          height: 1px;
          margin: 2px 0;
        }
      }

      // An open panel covers the right of the graph; the controls there move to its left.
      .beside-panel {
        right: calc(min(440px, 50%) + 16px);
      }

      .divider {
        flex: none;
        width: 1px;
        height: 22px;
        margin: 0 4px;
        background: $cool_gray_200;
      }

      .data-model {
        --mat-button-text-container-height: 32px;
        --mat-button-text-container-shape: 16px;
        font-weight: 500;
        white-space: nowrap;

        &.static {
          padding: 0 12px;
          font-size: 14px;
        }
      }

      // As the legend's title.
      .filters-label {
        padding-right: 6px;
        white-space: nowrap;
        font-size: 13px;
        font-weight: 600;
        color: $cool_gray_900;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        height: 32px;
        border: 1px solid $cool_gray_300;
        border-radius: 16px;
        white-space: nowrap;

        &.active {
          border-color: $primary;
          background: $primary_50;
          color: $primary;
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        // "Class: Person", the chosen value after the filter's name.
        b {
          // Against the trigger's gap, so the colon follows the name.
          margin-left: -4px;
          font-weight: 500;

          &::before {
            content: ': ';
            font-weight: 400;
          }
        }
      }

      .chip-trigger,
      .chip-clear,
      .tool {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: 0;
        background: none;
        font: inherit;
        color: inherit;
        cursor: pointer;
      }

      .chip-trigger {
        gap: 4px;
        height: 100%;
        padding: 0 4px 0 10px;
        font-size: 13px;

        .drop {
          margin-left: -2px;
          color: $cool_gray_500;
        }
      }

      .chip.active .chip-trigger {
        padding-right: 2px;
      }

      .chip-clear {
        flex: none;
        width: 20px;
        height: 20px;
        margin-right: 6px;
        border-radius: 50%;
        background: rgba(51, 103, 144, 0.12);

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }

      .tool {
        width: 32px;
        height: 32px;
        border-radius: 16px;
        color: $cool_gray_600;

        &:hover {
          background: $cool_gray_100;
        }

        &.on {
          background: $primary_50;
          color: $primary;
        }

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      // In View options: the three text sizes side by side, each with its letter drawn at its size.
      .size-choice {
        --mat-button-toggle-height: 34px;
        --mat-button-toggle-label-text-size: 13px;
        white-space: nowrap;
      }

      .size {
        margin-right: 4px;
        font-weight: 500;

        &[data-size='small'] {
          font-size: 11px;
        }

        &[data-size='normal'] {
          font-size: 14px;
        }

        &[data-size='large'] {
          font-size: 17px;
        }
      }

      .body {
        position: relative;
        flex: 1;
        min-height: 0;
        display: flex;
      }

      .view {
        flex: 1;
        min-width: 0;
      }

      // The panel floats over the graph, which keeps its size, so opening a class moves nothing.
      .panel {
        position: absolute;
        z-index: 1;
        top: 0;
        right: 0;
        bottom: 0;
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
  private readonly _clipboard = inject(Clipboard);
  private readonly _notification = inject(NotificationService);
  private readonly _translate = inject(TranslateService);
  private readonly _editing = injectDataModelEditing();

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
  private readonly _projectPage = inject(ProjectPageService);
  readonly canEdit = toSignal(this._projectPage.hasProjectAdminRights$);

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
  /** The data model as the graph draws it: links only, with no subclass arrows and no inherited links. */
  private readonly _graphLinks = computed(() => {
    const graph = this.graph();
    return graph ? withInheritedLinks(graph, false) : undefined;
  });

  readonly exportItems = EXPORT_ITEMS;
  readonly sizes = SIZES;
  /** How big the graph draws boxes, text and lines; remembered in this browser. */
  readonly size = signal<GraphSize>(SIZES.find(size => size === readStored(SIZE_KEY)) ?? 'normal');
  /** Whether the graph draws link labels level, rather than along their line; remembered in this browser. */
  readonly levelLabels = signal(readStored(LEVEL_LABELS_KEY) === 'true');
  /** Whether an island shows its frame on hover and can be dragged; off unless turned on. */
  readonly islands = signal(readStored(ISLANDS_KEY) === 'true');
  /** Whether a family's colour shows as a tab at the left of white boxes, rather than as their fill; on unless turned off. */
  readonly colourTab = signal(readStored(COLOUR_TAB_KEY) !== 'false');
  /** Whether a line joins each parent to its subclasses; on unless turned off. */
  readonly treeLines = signal(readStored(TREE_LINES_KEY) !== 'false');
  /**
   * Whether the graph spreads over the whole width, an open panel covering its right, rather than keeping clear of
   * where the panel opens. Until the user chooses, it does on screens up to `FULL_WIDTH_UP_TO` wide, where the room
   * kept for the panel would make the graph small; on wider ones there is room to spare for it.
   */
  readonly fullWidth = signal((readStored(FULL_WIDTH_KEY) ?? String(window.innerWidth <= FULL_WIDTH_UP_TO)) === 'true');
  readonly labelOptions = LABEL_OPTIONS;
  /** Whether the graph writes labels, names or both; remembered in this browser. */
  readonly labels = signal<GraphLabels>(LABEL_OPTIONS.find(option => option === readStored(LABELS_KEY)) ?? 'labels');
  readonly graphView = viewChild(OntologyGraphComponent);
  private readonly _searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  /** The family of every class of the data model, which the Islands view groups and colours classes by. */
  readonly families = computed(() => {
    const graph = this.graph();
    return graph ? classFamilies(graph) : undefined;
  });

  /** A colour per class of the data model, its family's, the same whatever the graph is filtered on. */
  readonly colors = computed(() => {
    const graph = this.graph();
    return graph ? familyColors(graph) : new Map<string, string>();
  });

  /** The class filter in the URL: classes to show with the classes they are linked with, or classes to hide. */
  // Equal filters stay the same object, so opening a panel, which changes the URL too, leaves the graph as it is.
  readonly classFilter = computed(
    () => this._listFilter(ONTOLOGY_MAP_PARAM.filter, ONTOLOGY_MAP_PARAM.hide, name => this._classNamed(name)),
    { equal: sameFilter }
  );
  /** The property filter in the URL: properties to show only the links of, or properties to hide the links of. */
  readonly propertyFilter = computed(
    () =>
      this._listFilter(
        ONTOLOGY_MAP_PARAM.property,
        ONTOLOGY_MAP_PARAM.hideProperty,
        name => this.propertyOptions().find(option => classNameOf(option.id) === name)?.id
      ),
    { equal: sameFilter }
  );
  /** The classes shown with the classes they are linked with; none when the filter hides classes instead. */
  readonly filterIris = computed(() => (this.classFilter().mode === 'only' ? this.classFilter().iris : []));
  readonly classOptions = computed(() =>
    (this.graph()?.nodes ?? [])
      .filter(node => node.kind === 'class')
      .map(node => ({ id: node.id, label: node.label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  );
  /** The link properties of the data model, each once, with how many links use it. */
  readonly propertyOptions = computed(() => {
    const options = new Map<string, { id: string; label: string; links: number }>();
    for (const edge of this._graphLinks()?.edges ?? []) {
      if (edge.kind !== 'link' || edge.source === edge.target) continue;
      const option = options.get(edge.property) ?? { id: edge.property, label: edge.label, links: 0 };
      option.links++;
      options.set(edge.property, option);
    }
    return [...options.values()].sort((a, b) => a.label.localeCompare(b.label));
  });
  readonly classMenuOptions = computed<FilterOption[]>(() =>
    this.classOptions().map(option => ({
      ...option,
      name: localNameOf(option.id),
      color: this.colors().get(option.id),
    }))
  );
  readonly propertyMenuOptions = computed<FilterOption[]>(() =>
    this.propertyOptions().map(option => ({
      id: option.id,
      label: option.label,
      name: localNameOf(option.id),
      count: option.links,
    }))
  );
  /** The classes ticked in the Class menu: those the filter shows. */
  readonly classTicked = computed(() => this._ticked(this.classFilter(), this.classOptions()));
  readonly propertyTicked = computed(() => this._ticked(this.propertyFilter(), this.propertyOptions()));
  readonly classChip = computed(() => this._chip(this.classFilter(), this.classOptions(), 'classesChosen'));
  readonly propertyChip = computed(() => this._chip(this.propertyFilter(), this.propertyOptions(), 'propertiesChosen'));

  /** What the graph draws: the data model, narrowed by the class or the property filter. */
  readonly graphShown = computed(() => {
    const graph = this._graphLinks();
    if (!graph) return undefined;
    const properties = this.propertyFilter();
    if (properties.mode === 'only') return properties.iris.length ? throughProperties(graph, properties.iris) : NOTHING;
    if (properties.mode === 'hide') return withoutProperties(graph, properties.iris);
    const classes = this.classFilter();
    if (classes.mode === 'only') return classes.iris.length ? linkedWith(graph, classes.iris) : NOTHING;
    if (classes.mode === 'hide') return withoutClasses(graph, classes.iris);
    return graph;
  });

  /** A property hovered in the class panel; the graph highlights its links. */
  readonly hoveredProperty = signal<string | undefined>(undefined);

  /** The text searched in the graph's classes and links. */
  readonly searchText = signal('');
  /**
   * The search in the classes and links drawn; see `searchGraph`. While a class or property of its list is gone
   * through, searched or browsed, only that one stands out, with what it links, the rest fading; see `focusGraph`.
   * "All results" shows the whole search again.
   */
  readonly search = computed(() => {
    const graph = this.graphShown() ?? this.graph();
    if (!graph) return undefined;
    const browsed = this.searchDropdownOpen() ? this.browsed() : undefined;
    return browsed ? focusGraph(graph, browsed) : searchGraph(graph, this.searchText());
  });
  /** The classes and link properties the search found, each property once, as its results list them. */
  readonly searchMatches = computed(() => {
    const graph = this.graph();
    const shown = this.graphShown() ?? graph;
    return graphSearchResults(shown ?? NOTHING, graph ?? NOTHING, this.searchText(), this.browsingAll());
  });
  /** Whether the graph shows less than the whole data model, filtered by class or by property. */
  readonly narrowed = computed(() => {
    const graph = this._graphLinks();
    return !!graph && this.graphShown() !== graph;
  });

  /** Whether ↓ in the empty search opened the list of every class and property; typing, or clearing, ends it. */
  readonly browseAll = signal(false);
  /** Whether the list shows every class and property: browsing, nothing typed. */
  readonly browsingAll = computed(() => this.browseAll() && !this.searchText().trim());
  /** How many classes and properties the search found, as its results count them; none without a search. */
  readonly searchFound = computed(() => {
    if (!this.searchText().trim() || !(this.graphShown() ?? this.graph())) return undefined;
    const { classes, properties } = this.searchMatches();
    return classes.length + properties.length;
  });

  /**
   * Whether the search's results list was closed, keeping the search: by Enter on a result, by Esc while its panel
   * shows, or by a panel opened elsewhere. Typing in the search, or clicking it, opens the list again.
   */
  readonly listClosed = signal(false);
  /** Whether the search's results show, under it: while a search is typed, found or not, and its list is open. */
  readonly searchDropdownOpen = computed(
    () => (this.searchFound() !== undefined || this.browsingAll()) && !this.listClosed()
  );

  /**
   * ↓ in the search: goes down the results. With the list closed, it opens it, in the empty search the list of every
   * class and property, its first row gone through at once: the graph fades round it and its panel shows, as for the
   * next ones.
   */
  arrowDown(): void {
    if (this.searchDropdownOpen()) {
      this.searchResults()?.move(1);
      return;
    }
    if (!this.searchText().trim()) this.browseAll.set(true);
    this.listClosed.set(false);
    // The list is drawn on the next turn; then its first row is gone through.
    setTimeout(() => this.searchResults()?.move(0));
  }
  /**
   * The search result gone through in its list, which the graph picks out over the search's fade: a class outlined, a
   * property's links highlighted; none while none is.
   */
  readonly browsed = signal<SearchResult | undefined>(undefined);
  /** The browsed result while its list shows, which the graph draws stronger, in blue. */
  readonly picked = computed(() => (this.searchDropdownOpen() ? this.browsed() : undefined));
  readonly searchDropdownPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
  ];
  readonly searchResults = viewChild(GraphSearchResultsComponent);

  /**
   * Shows the panel of the result the arrow keys reached, the list staying open and the search keeping the focus; for
   * "All results", none. A short pause first, so going through fast does not open every panel on the way. The first
   * panel opened is a step in the browser history; the next ones replace it.
   */
  preview(result: SearchResult | undefined): void {
    clearTimeout(this._previewing);
    this._previewing = setTimeout(() => {
      const open = this.panelOpen();
      if (!result && !open) return;
      const params = result
        ? this._panelParams(result)
        : { [ONTOLOGY_MAP_PARAM.panel]: null, [ONTOLOGY_MAP_PARAM.propertyPanel]: null };
      this._navigate(params, open);
    }, PREVIEW_DELAY_MS);
  }

  private _previewing?: ReturnType<typeof setTimeout>;

  private _panelParams(result: SearchResult): Record<string, string | null> {
    return result.kind === 'class'
      ? { [ONTOLOGY_MAP_PARAM.panel]: classNameOf(result.iri), [ONTOLOGY_MAP_PARAM.propertyPanel]: null }
      : { [ONTOLOGY_MAP_PARAM.propertyPanel]: classNameOf(result.iri), [ONTOLOGY_MAP_PARAM.panel]: null };
  }

  /**
   * A click outside the results list closes it, keeping the search: on the graph, a panel or anywhere else. A click in
   * the search field itself keeps it open, as it opens it.
   */
  closeListOnOutsideClick(event: MouseEvent): void {
    if ((event.target as HTMLElement | null)?.closest('.float.search')) return;
    clearTimeout(this._previewing);
    this.listClosed.set(true);
  }

  /**
   * Esc in the search: closes the results list while a panel shows, keeping both and the focus; else clears the
   * search. The field's own Esc, which would empty it at once, is kept from running.
   */
  escapeSearch(event: Event, input: HTMLInputElement): void {
    event.preventDefault();
    clearTimeout(this._previewing);
    if (this.panelOpen() && this.searchDropdownOpen()) this.listClosed.set(true);
    else this.clearSearch(input);
  }

  /** Filters the graph on a class or property the search found, in place of the search. */
  filterOnResult(result: SearchResult, input: HTMLInputElement): void {
    if (result.kind === 'class') this.setFilter([result.iri]);
    else this.setPropertyFilter([result.iri]);
    this.browseAll.set(false);
    this.searchText.set('');
    input.value = '';
  }

  /**
   * Esc closes the open panel: a class's or property's, or the search's results, which clears the search. Not while
   * typing, where Esc has its own job, nor while a menu or dialog is open, which Esc closes first.
   */
  closeOnEscape(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (event.defaultPrevented || target?.closest('input, textarea, [contenteditable="true"]')) return;
    if (document.querySelector('.mat-mdc-menu-panel, mat-dialog-container')) return;
    if (this.panelIri() || this.propertyPanelIri()) this.openPanel(undefined);
    else if (this.searchDropdownOpen()) {
      const input = this._searchInput()?.nativeElement;
      if (input) this.clearSearch(input);
    }
  }

  clearSearch(input: HTMLInputElement): void {
    clearTimeout(this._previewing);
    this.listClosed.set(false);
    this.browseAll.set(false);
    this.searchText.set('');
    input.value = '';
    input.focus();
  }

  constructor() {
    // The search is ready to type in once the graph shows: its field takes the focus the first time it appears.
    let searchFocused = false;
    effect(() => {
      const input = this._searchInput()?.nativeElement;
      if (!input || searchFocused) return;
      searchFocused = true;
      input.focus();
    });
    // The search takes the focus while its results show, to type on and go through them, a previewed panel or not.
    effect(() => {
      const input = this._searchInput()?.nativeElement;
      if (!input || !this.searchDropdownOpen()) return;
      untracked(() => document.activeElement !== input && input.focus());
    });
    // A panel opened with the list closed, from the graph or the browser history, takes the focus away from the search,
    // so its own keys work and typing does not change the search. Esc closing the list leaves the focus where it is.
    effect(() => {
      const input = this._searchInput()?.nativeElement;
      const panel = this.panelIri() ?? this.propertyPanelIri();
      if (!input || !panel) return;
      untracked(() => !this.searchDropdownOpen() && document.activeElement === input && input.blur());
    });
    // A panel that changes class, or closes, under the pointer never reports the pointer leaving its rows.
    effect(() => {
      this.panelIri();
      this.propertyPanelIri();
      untracked(() => this.hoveredProperty.set(undefined));
    });
  }

  /** Whether a class or property panel covers the right of the graph. */
  readonly panelOpen = computed(() => !!(this.panelIri() || this.propertyPanelIri()));
  /** How wide a panel is, over the right of the graph, as its styles draw it; the graph is fitted left of it, open or not. */
  readonly panelWidth = PANEL_WIDTH;

  /** The class whose panel is open. */
  readonly panelIri = computed(() => this._classFromUrl(ONTOLOGY_MAP_PARAM.panel));
  /** The link property whose panel is open; none while a class panel is open. */
  readonly propertyPanelIri = computed(() => {
    const name = this._params()?.get(ONTOLOGY_MAP_PARAM.propertyPanel);
    if (!name || this.panelIri()) return undefined;
    return this._graphLinks()?.edges.find(edge => edge.kind === 'link' && classNameOf(edge.property) === name)
      ?.property;
  });
  /** What the open panel is about, for the graph to keep clear of the panel. */
  readonly panelFocus = computed(() => {
    const classIri = this.panelIri();
    if (classIri) return { kind: 'class' as const, iri: classIri };
    const property = this.propertyPanelIri();
    return property ? { kind: 'property' as const, iri: property } : undefined;
  });
  /** The class the map outlines: the one whose panel is open, else the one named in the URL. */
  readonly classIri = computed(() => this.panelIri() ?? this._params()?.get(ONTOLOGY_MAP_PARAM.class) ?? undefined);

  /** Opens the class's panel, or closes whichever panel is open; a step in the browser history. */
  openPanel(classIri: string | undefined): void {
    clearTimeout(this._previewing);
    if (classIri) this.listClosed.set(true);
    this._navigate({
      [ONTOLOGY_MAP_PARAM.panel]: classIri ? this._urlName(classIri) : null,
      [ONTOLOGY_MAP_PARAM.propertyPanel]: null,
    });
  }

  /** Opens the link property's panel instead of a class's; a step in the browser history. */
  openPropertyPanel(propertyIri: string): void {
    clearTimeout(this._previewing);
    this.listClosed.set(true);
    this._navigate({ [ONTOLOGY_MAP_PARAM.propertyPanel]: classNameOf(propertyIri), [ONTOLOGY_MAP_PARAM.panel]: null });
  }

  /** Shows these classes with the classes they are linked with, or every class when none; a step in the history. */
  setFilter(classIris: readonly string[]): void {
    if (classIris.length) this._setFilters({ [ONTOLOGY_MAP_PARAM.filter]: classIris });
    else this.clearFilters();
  }

  /** Shows only the links through these properties, or every class when none; a step in the browser history. */
  setPropertyFilter(propertyIris: readonly string[]): void {
    if (propertyIris.length) this._setFilters({ [ONTOLOGY_MAP_PARAM.property]: propertyIris });
    else this.clearFilters();
  }

  /**
   * The classes left ticked in the Class menu. Unticking from every class hides the unticked ones; ticking from none
   * shows the ticked ones with the classes they are linked with.
   */
  onClassesTicked(ticked: readonly string[]): void {
    const all = this.classOptions().map(option => option.id);
    const mode = this._modeFor(this.classFilter(), ticked, all.length);
    if (!mode) return this.clearFilters();
    this._setFilters({
      [mode === 'only' ? ONTOLOGY_MAP_PARAM.filter : ONTOLOGY_MAP_PARAM.hide]:
        mode === 'only' ? ticked : all.filter(iri => !ticked.includes(iri)),
    });
  }

  /** The properties left ticked in the Property menu; as for classes, unticking from all hides links. */
  onPropertiesTicked(ticked: readonly string[]): void {
    const all = this.propertyOptions().map(option => option.id);
    const mode = this._modeFor(this.propertyFilter(), ticked, all.length);
    if (!mode) return this.clearFilters();
    this._setFilters({
      [mode === 'only' ? ONTOLOGY_MAP_PARAM.property : ONTOLOGY_MAP_PARAM.hideProperty]:
        mode === 'only' ? ticked : all.filter(iri => !ticked.includes(iri)),
    });
  }

  /** Shows every class again, whichever filter was on. */
  clearFilters(): void {
    this._setFilters({});
  }

  /** Sets one filter, by class or by property, never both; the others are cleared. */
  private _setFilters(filter: Partial<Record<string, readonly string[]>>): void {
    const params = [
      ONTOLOGY_MAP_PARAM.filter,
      ONTOLOGY_MAP_PARAM.hide,
      ONTOLOGY_MAP_PARAM.property,
      ONTOLOGY_MAP_PARAM.hideProperty,
    ];
    this._navigate(
      Object.fromEntries(params.map(param => [param, filter[param]?.map(iri => this._urlName(iri)).join(',') ?? null]))
    );
  }

  /** How a menu's ticks are kept: all ticked is no filter; nothing ticked, or ticking within `only`, shows them. */
  private _modeFor(filter: ListFilter, ticked: readonly string[], total: number): ListFilter['mode'] {
    if (ticked.length === total) return undefined;
    return filter.mode === 'only' || ticked.length === 0 ? 'only' : 'hide';
  }

  /** A filter from its two query parameters; an empty `only` parameter keeps nothing. */
  private _listFilter(onlyParam: string, hideParam: string, resolve: (name: string) => string | undefined): ListFilter {
    const params = this._params();
    const mode = params?.has(onlyParam) ? 'only' : params?.has(hideParam) ? 'hide' : undefined;
    if (!mode) return { iris: [] };
    const names = (params?.get(mode === 'only' ? onlyParam : hideParam) ?? '').split(',').filter(Boolean);
    return { mode, iris: names.map(resolve).filter((iri): iri is string => iri !== undefined) };
  }

  private _ticked(filter: ListFilter, options: readonly { id: string }[]): string[] {
    const ids = options.map(option => option.id);
    if (filter.mode === 'only') return filter.iris;
    if (filter.mode === 'hide') return ids.filter(id => !filter.iris.includes(id));
    return ids;
  }

  private _chip(
    filter: ListFilter,
    options: readonly { id: string; label: string }[],
    manyKey: string
  ): ChipValue | undefined {
    const labelOf = (iri: string) => options.find(option => option.id === iri)?.label ?? classNameOf(iri);
    const [first] = filter.iris;
    switch (filter.mode) {
      case 'only':
        if (filter.iris.length === 0) return { key: 'filterNone' };
        return filter.iris.length === 1
          ? { label: labelOf(first) }
          : { key: manyKey, params: { count: filter.iris.length } };
      case 'hide':
        return filter.iris.length === 1
          ? { key: 'allButOne', params: { name: labelOf(first) } }
          : { key: 'allBut', params: { count: filter.iris.length } };
      default:
        return undefined;
    }
  }

  /** Shows the class alone with the classes it is linked with. */
  filterOn(classIri: string): void {
    this.setFilter([classIri]);
  }

  /** Changes some query parameters, keeping the others; the data model is named so the class names resolve. */
  /** Sets these query parameters: a step in the browser history, or in place of the current one with `replaceUrl`. */
  private _navigate(params: Record<string, string | null>, replaceUrl = false): Promise<boolean> {
    const ontologyIri = this.selected()?.iri;
    return this._router.navigate([], {
      relativeTo: this._route,
      ...(replaceUrl ? { replaceUrl } : {}),
      queryParamsHandling: 'merge',
      queryParams: {
        ...(ontologyIri ? { [ONTOLOGY_MAP_PARAM.ontology]: OntologyService.getOntologyNameFromIri(ontologyIri) } : {}),
        ...params,
      },
    });
  }

  /** The class of the shown data model that a query parameter names, if it names one. */
  private _classFromUrl(param: string): string | undefined {
    const name = this._params()?.get(param);
    return name ? this._classNamed(name) : undefined;
  }

  private _classNamed(name: string): string | undefined {
    return this.graph()?.nodes.find(node => this._urlName(node.id) === name)?.id;
  }

  /**
   * How the URL names a class: by the end of its IRI, or for a class of another data model, prefixed by that model's
   * name, as `biblio:Book`. A property is named by the end of its IRI.
   */
  private _urlName(iri: string): string {
    const node = this.graph()?.nodes.find(other => other.id === iri);
    const model = node && node.kind !== 'class' ? dataModelNameOf(iri) : undefined;
    return model ? `${model}:${classNameOf(iri)}` : classNameOf(iri);
  }

  /** The name of the data model shown, such as `beol`. */
  readonly selectedName = computed(() => {
    const iri = this.selected()?.iri;
    return iri ? OntologyService.getOntologyNameFromIri(iri) : '';
  });
  /** The names of the project's data models. */
  readonly modelNames = computed(() => this.ontologies().map(o => OntologyService.getOntologyNameFromIri(o.iri)));

  /** Shows a class of another data model of the project in its own, its panel open; a step in the history. */
  openInModel(iri: string): void {
    const model = dataModelNameOf(iri);
    if (!model) return;
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: { [ONTOLOGY_MAP_PARAM.ontology]: model, [ONTOLOGY_MAP_PARAM.panel]: classNameOf(iri) },
    });
  }

  setSize(size: GraphSize): void {
    this.size.set(size);
    store(SIZE_KEY, size);
  }

  setLabels(labels: GraphLabels): void {
    this.labels.set(labels);
    store(LABELS_KEY, labels);
  }

  setLevelLabels(level: boolean): void {
    this.levelLabels.set(level);
    store(LEVEL_LABELS_KEY, String(level));
  }

  setIslands(islands: boolean): void {
    this.islands.set(islands);
    store(ISLANDS_KEY, String(islands));
  }

  /** A switch of the View options menu. */
  setViewOption(key: string, on: boolean): void {
    if (key === 'levelLabels') this.setLevelLabels(on);
    else if (key === 'islandsToggle') this.setIslands(on);
    else if (key === 'colourTab') this.setColourTab(on);
    else if (key === 'treeLines') {
      this.treeLines.set(on);
      store(TREE_LINES_KEY, String(on));
    } else if (key === 'fullWidth') {
      this.fullWidth.set(on);
      store(FULL_WIDTH_KEY, String(on));
    }
  }

  setColourTab(colourTab: boolean): void {
    this.colourTab.set(colourTab);
    store(COLOUR_TAB_KEY, String(colourTab));
  }

  /** Runs an Export menu item: a PNG downloaded or copied, or the link to this view copied. */
  export(key: ExportKey): void {
    switch (key) {
      case 'viewPng':
      case 'wholePng':
        return this._downloadPng(key === 'viewPng' ? 'view' : 'whole');
      case 'copyImage':
        return this._copyImage();
      case 'copyLink':
        this._clipboard.copy(window.location.href);
        return this._notify('linkCopied');
    }
  }

  private _downloadPng(area: GraphExportArea): void {
    const png = this.graphView()?.png(area);
    if (!png) return;
    const name = OntologyService.getOntologyNameFromIri(this.selected()?.iri ?? '') || 'data-model';
    png.then(
      blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${name}_ontology-map${area === 'whole' ? '_whole' : ''}.png`;
        link.click();
        URL.revokeObjectURL(url);
      },
      () => this._notify('exportFailed', 'error')
    );
  }

  private _copyImage(): void {
    const png = this.graphView()?.png('view');
    if (!png) return;
    // The promise itself goes to the clipboard, so Safari keeps the click's permission while the image is drawn.
    navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]).then(
      () => this._notify('imageCopied'),
      () => this._notify('exportFailed', 'error')
    );
  }

  private _notify(key: string, type: 'success' | 'error' = 'success'): void {
    this._notification.openSnackBar(this._translate.instant(`pages.ontologyMap.exportMenu.${key}`), type);
  }

  /** Opens the class in the Data tab. */
  open(iri: string): void {
    const [ontologyIri, className] = iri.split('#');
    this._router.navigate(
      this._projectPath(RouteConstants.data, OntologyService.getOntologyNameFromIri(ontologyIri), className)
    );
  }

  /** Edits the class in the data model editor's dialog; see `injectDataModelEditing`. */
  edit(iri: string): void {
    this._editing.editClass(iri);
  }

  /** Edits the property in the data model editor's dialog; see `injectDataModelEditing`. */
  editProperty(iri: string): void {
    this._editing.editProperty(iri);
  }

  /** The path to a page of the project from the app's root: this page sits at different depths. */
  private _projectPath(...segments: string[]): string[] {
    return ['/', RouteConstants.project, this._projectPage.currentProjectUuid, ...segments];
  }
}

function store(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the choice lasts until the page reloads.
  }
}

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
