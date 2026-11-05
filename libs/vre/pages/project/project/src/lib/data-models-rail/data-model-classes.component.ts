import { CdkConnectedOverlay, ConnectedPosition } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
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
import { ColumnResizeDirective } from '@dasch-swiss/vre/pages/data-browser';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { injectDataModelEditing } from '../ontology-map/data-model-editor';
import { classFamilies, familyHue, familyTint, FILE_KINDS } from '../ontology-map/islands';
import { ClassRow, localNameOf } from '../ontology-map/ontology-graph-elements';
import { ONTOLOGY_MAP_PARAM } from '../ontology-map/ontology-map-page.component';
import { PropertyPanelComponent } from '../ontology-map/property-panel.component';
import { typeIconOf, typeNameOf } from '../ontology-map/property-types';
import { ResourceClassPanelComponent } from '../ontology-map/resource-class-panel.component';
import { LanguageText } from '../sidenav/data-model-map/data-model-graph';
import { DataModelsRailState } from './data-models-rail-state';
import { DESCRIPTION_LANGUAGES, DescriptionEditorComponent } from './description-editor.component';
import { RAIL_SECTION_STYLES } from './rail-section-styles';

/** How many properties and linked classes a condensed row shows; the others are counted. */
const MAX_PROPERTIES = 3;
const MAX_LINKS = 2;
/** How strongly the rows of a family with subclasses are tinted with its hue. */
const FAMILY_TINT = 0.2;
const DENSITY_KEY = 'dsp-data-models-classes-density';
const WIDTHS_KEY = 'dsp-data-models-classes-widths';

type Column = 'class' | 'file' | 'description' | 'properties' | 'linksTo';
const DEFAULT_WIDTHS: Record<Column, number> = {
  class: 240,
  file: 120,
  description: 320,
  properties: 420,
  linksTo: 240,
};
/** Below these, a header's name and filter button no longer fit. */
const MIN_WIDTHS: Record<Column, number> = { class: 140, file: 90, description: 140, properties: 160, linksTo: 130 };

const readWidths = (): Partial<Record<Column, number>> => {
  try {
    return JSON.parse(localStorage.getItem(WIDTHS_KEY) ?? '{}');
  } catch {
    return {};
  }
};
/** The File filter's value for classes without file. */
const NO_FILE = 'none';

type Density = 'condensed' | 'expanded';
type Level = 'all' | 'top' | 'sub';

const ALL_LANGUAGES_KEY = 'dsp-data-models-classes-all-languages';

const readAllLanguages = (): boolean => {
  try {
    return localStorage.getItem(ALL_LANGUAGES_KEY) === 'true';
  } catch {
    return false;
  }
};

const readDensity = (): Density => {
  try {
    return localStorage.getItem(DENSITY_KEY) === 'expanded' ? 'expanded' : 'condensed';
  } catch {
    return 'condensed';
  }
};

/**
 * Data models 2 › Classes: the data model's classes in a table, as the Data tab's table, subclasses under their
 * superclass in their family's tone. Condensed, a row is one line and what does not fit is counted; expanded, it shows
 * everything. Each column filters from its header. A clicked class opens its panel.
 */
@Component({
  selector: 'app-data-model-classes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkConnectedOverlay,
    ColumnResizeDirective,
    DescriptionEditorComponent,
    MatButton,
    MatIconButton,
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
    MatMenu,
    MatMenuTrigger,
    MatPrefix,
    MatRadioButton,
    MatRadioGroup,
    MatSlideToggle,
    MatRow,
    MatRowDef,
    MatTable,
    PropertyPanelComponent,
    ResourceClassPanelComponent,
    TranslatePipe,
  ],
  template: `
    @let r = 'pages.dataModels2';
    @let t = 'pages.dataBrowser.dataModelMap';
    @let expanded = density() === 'expanded';
    <div class="section">
      <div class="head">
        <h2>{{ r + '.classes' | translate }}</h2>
        <span class="counts">{{
          'pages.ontologyMap.counts' | translate: { classes: state.classRows().length, links: state.linkCount() }
        }}</span>
        <span class="spacer"></span>
        <mat-slide-toggle
          class="all-languages"
          data-cy="data-model-classes-all-languages"
          [checked]="allLanguages()"
          (change)="setAllLanguages($event.checked)">
          {{ r + '.allLanguages' | translate }}
        </mat-slide-toggle>
        <mat-button-toggle-group
          class="density"
          hideSingleSelectionIndicator
          data-cy="data-model-classes-density"
          [attr.aria-label]="r + '.density' | translate"
          [value]="density()"
          (change)="setDensity($event.value)">
          <mat-button-toggle value="condensed">
            <mat-icon>density_small</mat-icon>
            {{ r + '.condensed' | translate }}
          </mat-button-toggle>
          <mat-button-toggle value="expanded">
            <mat-icon>density_large</mat-icon>
            {{ r + '.expanded' | translate }}
          </mat-button-toggle>
        </mat-button-toggle-group>
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

      <div class="table-box" [class.scrolled]="scrolled()" (scroll)="onScroll($event)">
        <table
          mat-table
          [dataSource]="rows()"
          data-cy="data-model-classes"
          [class.expanded]="expanded"
          [style.width.px]="tableWidth()">
          <ng-container matColumnDef="class" sticky>
            <th
              mat-header-cell
              *matHeaderCellDef
              [style.width.px]="widthOf('class')"
              [class.filtered]="level() !== 'all'">
              <span class="header">
                <span class="header-label">{{ r + '.colClass' | translate }}</span>
                <button
                  type="button"
                  class="filter"
                  data-cy="data-model-classes-filter-class"
                  [class.on]="level() !== 'all'"
                  [attr.aria-label]="r + '.filterOn' | translate: { column: r + '.colClass' | translate }"
                  [matMenuTriggerFor]="levelMenu">
                  <mat-icon>filter_list</mat-icon>
                </button>
              </span>
              <mat-menu #levelMenu="matMenu">
                <div
                  class="filter-menu"
                  (click)="$event.stopPropagation()"
                  (keydown)="$event.key !== 'Escape' && $event.stopPropagation()">
                  <mat-radio-group [value]="level()" (change)="level.set($event.value)">
                    <mat-radio-button value="all">{{ r + '.allClasses' | translate }}</mat-radio-button>
                    <mat-radio-button value="top">{{ r + '.topClasses' | translate }}</mat-radio-button>
                    <mat-radio-button value="sub">{{ r + '.subclasses' | translate }}</mat-radio-button>
                  </mat-radio-group>
                </div>
              </mat-menu>
              <span
                appColumnResize
                data-cy="data-model-classes-resize"
                [minWidth]="minWidths.class"
                [defaultWidth]="defaultWidths.class"
                [width]="widthOf('class')"
                [attr.aria-label]="r + '.resizeColumn' | translate"
                (widthChanged)="resize('class', $event)"
                (widthReset)="resize('class', undefined)"></span>
            </th>
            <td mat-cell *matCellDef="let row">
              <span class="labelled" [style.padding-left.px]="row.depth * 18" [title]="row.name">
                <span class="swatch" [style.background]="state.colors().get(row.id)"></span>
                <span class="texts">
                  <span class="label">{{ row.label }}</span>
                  @if (row.superclass; as superclass) {
                    <span class="subclass-of">{{
                      r + '.subclassOf' | translate: { class: state.labelOf(superclass) }
                    }}</span>
                  }
                  @if (expanded) {
                    <code class="name">{{ row.name }}</code>
                  }
                </span>
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="file">
            <th mat-header-cell *matHeaderCellDef [style.width.px]="widthOf('file')" [class.filtered]="files().size">
              <span class="header">
                <span class="header-label">{{ r + '.colFile' | translate }}</span>
                <button
                  type="button"
                  class="filter"
                  data-cy="data-model-classes-filter-file"
                  [class.on]="files().size"
                  [attr.aria-label]="r + '.filterOn' | translate: { column: r + '.colFile' | translate }"
                  [matMenuTriggerFor]="fileMenu">
                  <mat-icon>filter_list</mat-icon>
                </button>
              </span>
              <mat-menu #fileMenu="matMenu">
                <div
                  class="filter-menu"
                  (click)="$event.stopPropagation()"
                  (keydown)="$event.key !== 'Escape' && $event.stopPropagation()">
                  <span class="filter-head">
                    <span class="filter-heading">{{ r + '.colFile' | translate }}</span>
                    <button mat-button type="button" class="filter-all" (click)="toggleAll(files, fileOptions())">
                      {{ (allOn(files(), fileOptions()) ? r + '.deselectAll' : r + '.selectAll') | translate }}
                    </button>
                  </span>
                  @for (option of fileOptions(); track option) {
                    <mat-checkbox [checked]="files().has(option)" (change)="toggle(files, option)">{{
                      option === noFile
                        ? (r + '.noFile' | translate)
                        : ('pages.ontologyMap.islands.fileKinds.' + option | translate)
                    }}</mat-checkbox>
                  }
                </div>
              </mat-menu>
              <span
                appColumnResize
                data-cy="data-model-classes-resize"
                [minWidth]="minWidths.file"
                [defaultWidth]="defaultWidths.file"
                [width]="widthOf('file')"
                [attr.aria-label]="r + '.resizeColumn' | translate"
                (widthChanged)="resize('file', $event)"
                (widthReset)="resize('file', undefined)"></span>
            </th>
            <td mat-cell *matCellDef="let row">
              @if (row.representation; as representation) {
                <span class="file">
                  <mat-icon>{{ fileIcon(representation) }}</mat-icon>
                  {{ 'pages.ontologyMap.islands.fileKinds.' + representation | translate }}
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
              [style.width.px]="widthOf('description')"
              [class.filtered]="describedAs().trim()">
              <span class="header">
                <span class="header-label">{{ r + '.colDescription' | translate }}</span>
                <button
                  type="button"
                  class="filter"
                  data-cy="data-model-classes-filter-description"
                  [class.on]="describedAs().trim()"
                  [attr.aria-label]="r + '.filterOn' | translate: { column: r + '.colDescription' | translate }"
                  [matMenuTriggerFor]="descriptionMenu">
                  <mat-icon>filter_list</mat-icon>
                </button>
              </span>
              <mat-menu #descriptionMenu="matMenu">
                <div
                  class="filter-menu"
                  (click)="$event.stopPropagation()"
                  (keydown)="$event.key !== 'Escape' && $event.stopPropagation()">
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
                </div>
              </mat-menu>
              <span
                appColumnResize
                data-cy="data-model-classes-resize"
                [minWidth]="minWidths.description"
                [defaultWidth]="defaultWidths.description"
                [width]="widthOf('description')"
                [attr.aria-label]="r + '.resizeColumn' | translate"
                (widthChanged)="resize('description', $event)"
                (widthReset)="resize('description', undefined)"></span>
            </th>
            <td mat-cell *matCellDef="let row" class="description">
              @for (text of textsOf(row); track text.language) {
                <div
                  #line
                  class="lang-line"
                  [class.single]="!allLanguages()"
                  [class.active]="isEditing(row, text.language)">
                  @if (allLanguages()) {
                    <span class="lang">{{ text.language }}</span>
                  }
                  <span class="lang-text" [title]="expanded ? '' : text.value">{{ text.value }}</span>
                  @if (canEditDescriptions()) {
                    <button
                      mat-icon-button
                      type="button"
                      class="lang-edit"
                      data-cy="data-model-classes-edit-description"
                      [attr.aria-label]="
                        r + '.descriptionEditor.edit' | translate: { language: text.language, class: row.label }
                      "
                      (click)="$event.stopPropagation(); editDescription(row, text.language, line)">
                      <mat-icon>edit</mat-icon>
                    </button>
                  }
                </div>
              } @empty {
                @if (row.description) {
                  <!-- A description without a language: shown as it is. -->
                  <span class="lang-text" [title]="expanded ? '' : row.description">{{ row.description }}</span>
                } @else if (!canEditDescriptions()) {
                  <span class="none">—</span>
                }
              }
              @if (canEditDescriptions() && missingOf(row).length) {
                <div #gaps class="lang-missing" [class.single]="!allLanguages()">
                  @for (language of missingOf(row); track language) {
                    <button
                      type="button"
                      class="lang-add"
                      data-cy="data-model-classes-add-description"
                      [class.active]="isEditing(row, language)"
                      [attr.aria-label]="r + '.descriptionEditor.add' | translate: { language, class: row.label }"
                      (click)="$event.stopPropagation(); editDescription(row, language, gaps)">
                      + {{ language }}
                    </button>
                  }
                </div>
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="properties">
            <th
              mat-header-cell
              *matHeaderCellDef
              [style.width.px]="widthOf('properties')"
              [class.filtered]="types().size">
              <span class="header">
                <span class="header-label">{{ r + '.colProperties' | translate }}</span>
                <button
                  type="button"
                  class="filter"
                  data-cy="data-model-classes-filter-properties"
                  [class.on]="types().size"
                  [attr.aria-label]="r + '.filterOn' | translate: { column: r + '.colProperties' | translate }"
                  [matMenuTriggerFor]="typeMenu">
                  <mat-icon>filter_list</mat-icon>
                </button>
              </span>
              <mat-menu #typeMenu="matMenu">
                <div
                  class="filter-menu"
                  (click)="$event.stopPropagation()"
                  (keydown)="$event.key !== 'Escape' && $event.stopPropagation()">
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
                </div>
              </mat-menu>
              <span
                appColumnResize
                data-cy="data-model-classes-resize"
                [minWidth]="minWidths.properties"
                [defaultWidth]="defaultWidths.properties"
                [width]="widthOf('properties')"
                [attr.aria-label]="r + '.resizeColumn' | translate"
                (widthChanged)="resize('properties', $event)"
                (widthReset)="resize('properties', undefined)"></span>
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
                      {{ property.label }}
                      @if (property.linkTarget; as target) {
                        → {{ state.labelOf(target) }}
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
          <ng-container matColumnDef="linksTo">
            <th
              mat-header-cell
              *matHeaderCellDef
              [style.width.px]="widthOf('linksTo')"
              [class.filtered]="targets().size">
              <span class="header">
                <span class="header-label">{{ r + '.colLinksTo' | translate }}</span>
                <button
                  type="button"
                  class="filter"
                  data-cy="data-model-classes-filter-links"
                  [class.on]="targets().size"
                  [attr.aria-label]="r + '.filterOn' | translate: { column: r + '.colLinksTo' | translate }"
                  [matMenuTriggerFor]="targetMenu">
                  <mat-icon>filter_list</mat-icon>
                </button>
              </span>
              <mat-menu #targetMenu="matMenu" xPosition="before">
                <div
                  class="filter-menu"
                  (click)="$event.stopPropagation()"
                  (keydown)="$event.key !== 'Escape' && $event.stopPropagation()">
                  <span class="filter-head">
                    <span class="filter-heading">{{ r + '.colLinksTo' | translate }}</span>
                    <button mat-button type="button" class="filter-all" (click)="toggleAll(targets, targetOptions())">
                      {{ (allOn(targets(), targetOptions()) ? r + '.deselectAll' : r + '.selectAll') | translate }}
                    </button>
                  </span>
                  @for (option of targetOptions(); track option) {
                    <mat-checkbox [checked]="targets().has(option)" (change)="toggle(targets, option)">{{
                      state.labelOf(option)
                    }}</mat-checkbox>
                  }
                </div>
              </mat-menu>
              <span
                appColumnResize
                data-cy="data-model-classes-resize"
                [minWidth]="minWidths.linksTo"
                [defaultWidth]="defaultWidths.linksTo"
                [width]="widthOf('linksTo')"
                [attr.aria-label]="r + '.resizeColumn' | translate"
                (widthChanged)="resize('linksTo', $event)"
                (widthReset)="resize('linksTo', undefined)"></span>
            </th>
            <td mat-cell *matCellDef="let row">
              <span class="line">
                <span class="cut">
                  @for (target of shownLinks(row); track target) {
                    <span class="chip" [style.background]="state.colors().get(target) ?? '#F3F4F6'">{{
                      state.labelOf(target)
                    }}</span>
                  } @empty {
                    <span class="none">—</span>
                  }
                </span>
                @if (!expanded && row.linksTo.length > maxLinks) {
                  <span class="more">+{{ row.linksTo.length - maxLinks }}</span>
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
            [style.background]="row.id === panelIri() ? null : tints().get(row.id)"
            (click)="openPanel(row.id)"
            (keydown.enter)="openPanel(row.id)"></tr>
        </table>
        @if (rows().length === 0) {
          <p class="empty">{{ r + '.noMatch' | translate }}</p>
        }
      </div>

      @if (state.graph(); as graph) {
        @if (editingDescription(); as editing) {
          <ng-template
            cdkConnectedOverlay
            [cdkConnectedOverlayOpen]="true"
            cdkConnectedOverlayHasBackdrop
            cdkConnectedOverlayPush
            cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
            [cdkConnectedOverlayOrigin]="editing.origin"
            [cdkConnectedOverlayPositions]="popoverPositions"
            (backdropClick)="closeDescription()"
            (detach)="closeDescription()">
            <app-description-editor
              [descriptions]="editing.row.descriptions"
              [language]="editing.language"
              [classLabel]="editing.row.label"
              [saving]="savingDescription()"
              (saved)="saveDescription(editing.row, $event)"
              (cancelled)="closeDescription()" />
          </ng-template>
        }

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
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      .all-languages {
        flex: none;
        margin-right: 12px;
        font-size: 13px;
      }

      .density {
        --mat-standard-button-toggle-height: 34px;
        --mat-standard-button-toggle-label-text-size: 13px;
        background: white;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          margin-right: 4px;
          vertical-align: -4px;
        }
      }

      // As the Data tab's table: fixed columns with borders, uppercase headers, one 44px line per row.
      table {
        table-layout: fixed;
      }

      // A fixed layout needs the table's own width: the sum of its columns, the whole box at least.
      .table-box table {
        min-width: 100%;
      }

      .mat-mdc-header-cell {
        position: relative;

        &:hover .column-resize-handle {
          opacity: 1;
        }
      }

      .column-resize-handle {
        position: absolute;
        top: 0;
        right: -4px;
        bottom: 0;
        width: 8px;
        z-index: 1;
        cursor: col-resize;
        opacity: 0;

        &:hover {
          background: rgba(51, 103, 144, 0.25);
        }

        &:focus-visible {
          opacity: 1;
          outline: 2px solid $primary;
          outline-offset: -1px;
        }
      }

      // The class column stays while the others scroll under it, in the row's own tint.
      .mat-mdc-cell.mat-column-class {
        background: inherit;
      }

      .mat-column-class {
        border-right: 1px solid $cool_gray_200;
      }

      .scrolled .mat-column-class {
        box-shadow: 4px 0 6px -4px rgba(0, 0, 0, 0.18);
      }

      .mat-mdc-header-row {
        height: 48px;
      }

      .mat-mdc-header-cell {
        padding: 4px 6px 4px 10px;
        background: #f9fafb;

        &.filtered {
          background: #e6edf3;

          .header-label {
            color: #234a69;
          }
        }
      }

      .header {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .header-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        font: 500 12px/16px var(--font-sans, Roboto, sans-serif);
        letter-spacing: 0.06em;
        color: rgba(0, 0, 0, 0.6);
      }

      // Each column's filter shows while its header is hovered or focused, or while it filters.
      .filter {
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 0;
        border: 0;
        border-radius: 3px;
        background: transparent;
        color: rgba(0, 0, 0, 0.45);
        cursor: pointer;
        visibility: hidden;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }

        &:hover {
          background: rgba(0, 0, 0, 0.06);
        }

        &.on {
          visibility: visible;
          background: #d6e0e8;
          color: $primary;
        }
      }

      .mat-mdc-header-cell:hover .filter,
      .mat-mdc-header-cell:focus-within .filter,
      .filter[aria-expanded='true'] {
        visibility: visible;
      }

      .filter-menu {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 200px;
        padding: 4px 12px;

        mat-radio-group {
          display: flex;
          flex-direction: column;
        }
      }

      .filter-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .filter-all {
        height: 28px;
        padding: 0 8px;
        font-size: 13px;
      }

      .filter-heading {
        padding: 4px 0;
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: $cool_gray_500;
      }

      .contains {
        width: 240px;
        font-size: 13px;
      }

      .clear {
        align-self: flex-end;
        margin-top: 4px;
        padding: 6px 8px;
        border: 0;
        background: none;
        font: 500 13px var(--font-sans, Roboto, sans-serif);
        color: $primary;
        cursor: pointer;
      }

      .mat-mdc-cell {
        padding: 4px 10px;
      }

      .mat-mdc-header-cell,
      .mat-mdc-cell {
        border-right: 1px solid #e5e7eb;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &:last-child {
          border-right: 0;
        }
      }

      .mat-mdc-row {
        height: 44px;
      }

      .labelled {
        min-width: 0;
      }

      .texts {
        min-width: 0;
      }

      .label {
        overflow: hidden;
        text-overflow: ellipsis;
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

      // One line per language; a pencil shows on hover to edit that language.
      .lang-line {
        display: grid;
        grid-template-columns: 22px minmax(0, 1fr) 24px;

        &.single {
          grid-template-columns: minmax(0, 1fr) 24px;
        }
        align-items: center;
        gap: 4px;
        margin: 0 -4px;
        padding: 0 0 0 4px;
        border-radius: 4px;

        &:hover,
        &:focus-within,
        &.active {
          background: rgba(0, 0, 0, 0.05);

          .lang-edit {
            opacity: 1;
          }
        }

        &.active {
          box-shadow: inset 0 0 0 1px $primary;
        }
      }

      .lang {
        font-size: 10.5px;
        font-weight: 500;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: $cool_gray_500;
      }

      .lang-text {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .lang-edit.mat-mdc-icon-button {
        --mat-icon-button-state-layer-size: 24px;
        width: 24px;
        height: 24px;
        padding: 0;
        opacity: 0;
        color: $primary;

        mat-icon {
          font-size: 15px;
          width: 15px;
          height: 15px;
        }

        @media (hover: none) {
          opacity: 0.6;
        }
      }

      // The languages without a description, to add one.
      .lang-missing {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 2px 0 0 22px;

        &.single {
          padding-left: 0;
        }
      }

      .lang-add {
        border: 1px dashed $cool_gray_300;
        border-radius: 10px;
        background: none;
        padding: 0 7px;
        font: inherit;
        font-size: 10.5px;
        line-height: 16px;
        text-transform: uppercase;
        color: $cool_gray_500;
        cursor: pointer;

        &:hover,
        &:focus-visible,
        &.active {
          border-color: $primary;
          color: $primary;
        }
      }

      table.expanded .lang-text {
        white-space: normal;
      }

      table.expanded .lang-line {
        align-items: start;
      }

      // A line of chips, cut at the cell's edge with a fade; the "+N" after them always shows.
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
        mask-image: linear-gradient(to left, transparent, black 16px);
      }

      .property {
        flex: none;
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 0 7px 0 5px;

        mat-icon {
          width: 14px;
          height: 14px;
          font-size: 14px;
        }

        border: 0;
        border-radius: 11px;
        background: $cool_gray_100;
        font: inherit;
        font-size: 12px;
        line-height: 22px;
        color: $cool_gray_700;
        cursor: pointer;

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

      .chip {
        flex: none;
      }

      .more {
        flex: none;
        padding: 0 4px;
        font-size: 12px;
        font-weight: 500;
        color: $primary;
      }

      // Expanded, a row grows to show everything: the whole description, every property and link.
      table.expanded {
        .mat-mdc-cell {
          padding-top: 10px;
          padding-bottom: 10px;
          vertical-align: top;
          white-space: normal;
        }

        .labelled {
          align-items: flex-start;
        }

        .swatch {
          margin-top: 3px;
        }

        .line {
          align-items: flex-start;
        }

        .cut {
          flex-wrap: wrap;
          overflow: visible;
          mask-image: none;
        }
      }
    `,
  ],
})
export class DataModelClassesComponent {
  readonly state = inject(DataModelsRailState);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  readonly editing = injectDataModelEditing();
  private readonly _notification = inject(NotificationService);
  private readonly _translate = inject(TranslateService);
  private readonly _destroyRef = inject(DestroyRef);

  /** The description being edited: its class, the language it opened on, and the line it opened from. */
  readonly editingDescription = signal<{ row: ClassRow; language: string; origin: HTMLElement } | null>(null);
  readonly savingDescription = signal(false);
  readonly canEditDescriptions = computed(() => this.state.canEdit() && this.editing.canSaveInPlace);
  /** Under the line it opened from, else above it. */
  readonly popoverPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];
  private readonly _params = toSignal(this._route.queryParamMap);

  readonly columns = ['class', 'file', 'description', 'properties', 'linksTo'];
  readonly maxProperties = MAX_PROPERTIES;
  readonly maxLinks = MAX_LINKS;
  readonly noFile = NO_FILE;

  /** Condensed rows of one line, or expanded rows showing everything; remembered in this browser. */
  readonly density = signal<Density>(readDensity());
  /** Every language of a description stacked, or only the one the app shows; remembered in this browser. */
  readonly allLanguages = signal(readAllLanguages());
  readonly defaultWidths = DEFAULT_WIDTHS;
  readonly minWidths = MIN_WIDTHS;
  /** The widths the viewer dragged the columns to, remembered in this browser. */
  readonly widths = signal(readWidths());
  /** Whether the table is scrolled sideways, which shadows the frozen class column. */
  readonly scrolled = signal(false);

  readonly query = signal('');
  /** The column filters; an empty set or text filters nothing. */
  readonly level = signal<Level>('all');
  readonly files = signal(new Set<string>());
  readonly describedAs = signal('');
  readonly types = signal(new Set<string>());
  readonly targets = signal(new Set<string>());

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
  readonly targetOptions = computed(() =>
    [...new Set(this.state.classRows().flatMap(row => row.linksTo))].sort((a, b) =>
      this.state.labelOf(a).localeCompare(this.state.labelOf(b))
    )
  );

  readonly rows = computed(() => {
    const query = this.query().trim().toLowerCase();
    const level = this.level();
    const files = this.files();
    const describedAs = this.describedAs().trim().toLowerCase();
    const types = this.types();
    const targets = this.targets();
    return this.state
      .classRows()
      .filter(row => !query || row.label.toLowerCase().includes(query) || row.name.toLowerCase().includes(query))
      .filter(row => level === 'all' || (level === 'sub') === !!row.superclass)
      .filter(row => !files.size || files.has(row.representation ?? NO_FILE))
      .filter(
        row =>
          !describedAs ||
          row.description.toLowerCase().includes(describedAs) ||
          row.descriptions.some(text => text.value.toLowerCase().includes(describedAs))
      )
      .filter(row => !types.size || row.propertyList.some(property => types.has(property.type)))
      .filter(row => !targets.size || row.linksTo.some(target => targets.has(target)));
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

  readonly tableWidth = computed(() =>
    (Object.keys(DEFAULT_WIDTHS) as Column[]).reduce(
      (sum, column) => sum + (this.widths()[column] ?? DEFAULT_WIDTHS[column]),
      0
    )
  );

  widthOf(column: Column): number {
    return this.widths()[column] ?? DEFAULT_WIDTHS[column];
  }

  /** Stores a column's dragged width, or forgets it to go back to the default. */
  resize(column: Column, width: number | undefined): void {
    this.widths.update(widths => {
      const next = { ...widths, [column]: width };
      if (width === undefined) delete next[column];
      return next;
    });
    try {
      localStorage.setItem(WIDTHS_KEY, JSON.stringify(this.widths()));
    } catch {
      // Not remembered, as in a private window; the width still holds on this page.
    }
  }

  onScroll(event: Event): void {
    this.scrolled.set((event.target as HTMLElement).scrollLeft > 0);
  }

  setAllLanguages(on: boolean): void {
    this.allLanguages.set(on);
    try {
      localStorage.setItem(ALL_LANGUAGES_KEY, String(on));
    } catch {
      // Not remembered, as in a private window; the choice still holds on this page.
    }
  }

  setDensity(density: Density): void {
    this.density.set(density);
    try {
      localStorage.setItem(DENSITY_KEY, density);
    } catch {
      // Not remembered, as in a private window; the choice still holds on this page.
    }
  }

  /** The properties a row shows: the first few condensed, all of them expanded. */
  shownProperties(row: ClassRow): ClassRow['propertyList'] {
    return this.density() === 'expanded' ? row.propertyList : row.propertyList.slice(0, MAX_PROPERTIES);
  }

  /** The classes a row shows it links to: the first few condensed, all of them expanded. */
  shownLinks(row: ClassRow): string[] {
    return this.density() === 'expanded' ? row.linksTo : row.linksTo.slice(0, MAX_LINKS);
  }

  /** Whether every option of a filter is ticked. */
  allOn(selected: Set<string>, options: string[]): boolean {
    return options.length > 0 && options.every(option => selected.has(option));
  }

  /** Ticks every option of a filter, or none when they all are. */
  toggleAll(filter: WritableSignal<Set<string>>, options: string[]): void {
    filter.set(this.allOn(filter(), options) ? this.empty() : new Set(options));
  }

  /** Adds the option to a filter, or takes it out. */
  toggle(filter: WritableSignal<Set<string>>, option: string): void {
    filter.update(chosen => {
      const next = new Set(chosen);
      if (!next.delete(option)) next.add(option);
      return next;
    });
  }

  empty(): Set<string> {
    return new Set();
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

  /** Opens the class's panel, or closes it; a step in the browser history. */
  openPanel(classIri: string | undefined): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParamsHandling: 'merge',
      queryParams: {
        ...this.state.modelParam(),
        [ONTOLOGY_MAP_PARAM.panel]: classIri ? localNameOf(classIri) : null,
        [ONTOLOGY_MAP_PARAM.propertyPanel]: null,
      },
    });
  }

  /** Opens the property's panel in place of the class's, or closes it; a step in the browser history. */
  openProperty(propertyIri: string | undefined): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParamsHandling: 'merge',
      queryParams: {
        ...this.state.modelParam(),
        [ONTOLOGY_MAP_PARAM.panel]: null,
        [ONTOLOGY_MAP_PARAM.propertyPanel]: propertyIri ? localNameOf(propertyIri) : null,
      },
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

  /** A row's description in each language it has, in the order the app lists languages. */
  textsOf(row: ClassRow): LanguageText[] {
    const order = (language: string) => {
      const index = DESCRIPTION_LANGUAGES.indexOf(language);
      return index < 0 ? DESCRIPTION_LANGUAGES.length : index;
    };
    const texts = [...row.descriptions].sort((a, b) => order(a.language) - order(b.language));
    if (this.allLanguages()) return texts;
    // "All languages" off: only the one the app shows, in the interface language when it has it.
    const shown = texts.find(text => text.value === row.description) ?? texts[0];
    return shown ? [shown] : [];
  }

  /** The languages to offer adding: every missing one, or with "All languages" off the interface one, if none. */
  missingOf(row: ClassRow): string[] {
    if (!this.allLanguages()) return row.descriptions.length ? [] : [this._interfaceLanguage()];
    return DESCRIPTION_LANGUAGES.filter(language => !row.descriptions.some(text => text.language === language));
  }

  private _interfaceLanguage(): string {
    const current = this._translate.currentLang ?? '';
    return DESCRIPTION_LANGUAGES.includes(current) ? current : DESCRIPTION_LANGUAGES[0];
  }

  isEditing(row: ClassRow, language: string): boolean {
    const editing = this.editingDescription();
    return editing?.row.id === row.id && editing.language === language;
  }

  /** Opens the description editor on one language, under the line it was opened from. */
  editDescription(row: ClassRow, language: string, origin: HTMLElement): void {
    this.editingDescription.set({ row, language, origin });
  }

  closeDescription(): void {
    if (!this.savingDescription()) this.editingDescription.set(null);
  }

  saveDescription(row: ClassRow, descriptions: LanguageText[]): void {
    const t = 'pages.dataModels2.descriptionEditor';
    this.savingDescription.set(true);
    this.editing
      .saveClassDescriptions(row.id, descriptions)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.savingDescription.set(false);
          this.editingDescription.set(null);
          this._notification.openSnackBar(this._translate.instant(`${t}.saved`, { class: row.label }));
        },
        error: () => {
          // The editor stays open with the text, to try again.
          this.savingDescription.set(false);
          this._notification.openSnackBar(this._translate.instant(`${t}.notSaved`), 'error');
        },
      });
  }

  /** Edits the class in the data model editor's dialog; see `injectDataModelEditing`. */
  edit(iri: string): void {
    this.editing.editClass(iri);
  }
}
