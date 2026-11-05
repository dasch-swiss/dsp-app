import { ChangeDetectionStrategy, Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
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
import { TranslatePipe } from '@ngx-translate/core';
import { injectDataModelEditing } from '../ontology-map/data-model-editor';
import { classFamilies, familyHue, familyTint, FILE_KINDS } from '../ontology-map/islands';
import { ClassRow, localNameOf } from '../ontology-map/ontology-graph-elements';
import { ONTOLOGY_MAP_PARAM } from '../ontology-map/ontology-map-page.component';
import { typeNameOf } from '../ontology-map/property-types';
import { ResourceClassPanelComponent } from '../ontology-map/resource-class-panel.component';
import { DataModelsRailState } from './data-models-rail-state';
import { RAIL_SECTION_STYLES } from './rail-section-styles';

/** How many properties and linked classes a condensed row shows; the others are counted. */
const MAX_PROPERTIES = 3;
const MAX_LINKS = 2;
/** How strongly a subclass row is tinted with its family's hue. */
const SUBCLASS_TINT = 0.2;
const DENSITY_KEY = 'dsp-data-models-classes-density';
/** The File filter's value for classes without file. */
const NO_FILE = 'none';

type Density = 'condensed' | 'expanded';
type Level = 'all' | 'top' | 'sub';

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
    MatRow,
    MatRowDef,
    MatTable,
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

      <div class="table-box">
        <table mat-table [dataSource]="rows()" data-cy="data-model-classes" [class.expanded]="expanded">
          <ng-container matColumnDef="class">
            <th mat-header-cell *matHeaderCellDef [class.filtered]="level() !== 'all'">
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
            <th mat-header-cell *matHeaderCellDef [class.filtered]="files().size">
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
                  @for (option of fileOptions(); track option) {
                    <mat-checkbox [checked]="files().has(option)" (change)="toggle(files, option)">{{
                      option === noFile
                        ? (r + '.noFile' | translate)
                        : ('pages.ontologyMap.islands.fileKinds.' + option | translate)
                    }}</mat-checkbox>
                  }
                  <button type="button" class="clear" (click)="files.set(empty())">
                    {{ r + '.clearFilter' | translate }}
                  </button>
                </div>
              </mat-menu>
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
            <th mat-header-cell *matHeaderCellDef [class.filtered]="describedAs().trim()">
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
            </th>
            <td mat-cell *matCellDef="let row" class="description" [title]="expanded ? '' : row.description">
              {{ row.description }}
            </td>
          </ng-container>
          <ng-container matColumnDef="properties">
            <th mat-header-cell *matHeaderCellDef [class.filtered]="types().size">
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
                  <span class="filter-heading">{{ r + '.hasPropertyOf' | translate }}</span>
                  @for (option of typeOptions(); track option) {
                    <mat-checkbox [checked]="types().has(option)" (change)="toggle(types, option)">{{
                      typeName(option)
                    }}</mat-checkbox>
                  }
                  <button type="button" class="clear" (click)="types.set(empty())">
                    {{ r + '.clearFilter' | translate }}
                  </button>
                </div>
              </mat-menu>
            </th>
            <td mat-cell *matCellDef="let row">
              <span class="line">
                <span class="count">{{ row.properties }}</span>
                <!-- Condensed, the chips give way to the cell's width; the count of the others stays in view. -->
                <span class="cut">
                  @for (property of shownProperties(row); track property.id) {
                    @if (property.linkTarget; as target) {
                      <span class="property link">{{ property.label }} → {{ state.labelOf(target) }}</span>
                    } @else {
                      <span class="property">{{ property.label }} · {{ typeName(property.type) }}</span>
                    }
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
            <th mat-header-cell *matHeaderCellDef [class.filtered]="targets().size">
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
                  @for (option of targetOptions(); track option) {
                    <mat-checkbox [checked]="targets().has(option)" (change)="toggle(targets, option)">{{
                      state.labelOf(option)
                    }}</mat-checkbox>
                  }
                  <button type="button" class="clear" (click)="targets.set(empty())">
                    {{ r + '.clearFilter' | translate }}
                  </button>
                </div>
              </mat-menu>
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
        }
      }
    </div>
  `,
  styles: [
    RAIL_SECTION_STYLES,
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

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

      .mat-column-class {
        width: 220px;
      }

      .mat-column-file {
        width: 112px;
      }

      .mat-column-description {
        width: 22%;
      }

      .mat-column-linksTo {
        width: 220px;
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

      .count {
        flex: none;
        margin-right: 4px;
        font-size: 12px;
        font-weight: 500;
        color: $cool_gray_600;
      }

      .property {
        flex: none;
        padding: 0 7px;
        border-radius: 11px;
        background: $cool_gray_100;
        font-size: 12px;
        line-height: 22px;
        color: $cool_gray_700;

        &.link {
          background: #eaeff3;
          color: #264c6a;
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

        .count {
          line-height: 22px;
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
  private readonly _params = toSignal(this._route.queryParamMap);

  readonly columns = ['class', 'file', 'description', 'properties', 'linksTo'];
  readonly maxProperties = MAX_PROPERTIES;
  readonly maxLinks = MAX_LINKS;
  readonly noFile = NO_FILE;

  /** Condensed rows of one line, or expanded rows showing everything; remembered in this browser. */
  readonly density = signal<Density>(readDensity());

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
      .filter(row => !describedAs || row.description.toLowerCase().includes(describedAs))
      .filter(row => !types.size || row.propertyList.some(property => types.has(property.type)))
      .filter(row => !targets.size || row.linksTo.some(target => targets.has(target)));
  });

  /** A subclass's row in its family's tone, lighter than the family's colour. */
  readonly tints = computed(() => {
    const graph = this.state.graph();
    const tints = new Map<string, string>();
    if (!graph) return tints;
    for (const [iri, family] of classFamilies(graph)) {
      if (family.sub) tints.set(iri, familyTint(familyHue(family.index).base, SUBCLASS_TINT));
    }
    return tints;
  });

  /** The class whose panel is open, named in the URL like in the graph. */
  readonly panelIri = computed(() => {
    const name = this._params()?.get(ONTOLOGY_MAP_PARAM.panel);
    return name ? this.state.classRows().find(row => row.name === name)?.id : undefined;
  });

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

  /** Edits the class in the data model editor's dialog; see `injectDataModelEditing`. */
  edit(iri: string): void {
    this.editing.editClass(iri);
  }
}
