import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { DefaultClass, DefaultResourceClasses, OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { injectDataModelEditing } from '../ontology-map/data-model-editor';
import { ClassRow, localNameOf } from '../ontology-map/ontology-graph-elements';
import { ONTOLOGY_MAP_PARAM } from '../ontology-map/ontology-map-page.component';
import { ResourceClassPanelComponent } from '../ontology-map/resource-class-panel.component';
import { DataModelClassCardsComponent, PropertyOrder } from './data-model-class-cards.component';
import { DataModelsRailState } from './data-models-rail-state';
import { debounced } from './debounced';
import { escapeClosesPanel } from './escape-closes';

/**
 * Data models › Resource classes: the data model's classes as cards, one per class with its properties, by label. A
 * search finds a class by its name, its file or its properties.
 */
@Component({
  selector: 'app-data-model-classes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeOnEscape($event)' },
  imports: [
    DataModelClassCardsComponent,
    MatButton,
    MatFormField,
    MatIcon,
    MatInput,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatPrefix,
    ResourceClassPanelComponent,
    TranslatePipe,
  ],
  template: `
    @let r = 'pages.dataModels';
    @let t = 'pages.dataBrowser.dataModelMap';
    <div class="section">
      <!-- On one line: the title, the search and the create button; the tools, small, on a line under it. -->
      <div class="head one-line">
        <h2>{{ r + '.classes' | translate }}</h2>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
          <mat-icon matPrefix>search</mat-icon>
          <input
            #search
            matInput
            data-cy="data-model-classes-search"
            [placeholder]="r + '.findInCards' | translate"
            [attr.aria-label]="r + '.findInCards' | translate"
            (input)="typed.set(search.value)" />
        </mat-form-field>
        <!-- For editors: a class of the kind picked, made in the data model editor's dialog. -->
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
        <div class="tools">
          @if (rows().length) {
            <button mat-button type="button" data-cy="data-model-class-cards-fold" (click)="toggleAllCards()">
              <mat-icon>{{ allCardsOpen() ? 'unfold_less' : 'unfold_more' }}</mat-icon>
              {{ (allCardsOpen() ? r + '.collapseAll' : r + '.expandAll') | translate }}
            </button>
          }
        </div>
      </div>

      <app-data-model-class-cards
        class="cards-box"
        [rows]="rows()"
        [classes]="state.classRows()"
        [labelOf]="labelOf"
        [selected]="panelIri()"
        [canEdit]="state.canEdit()"
        [canReorder]="editing.canReorder"
        [query]="query()"
        [style.--card-width.px]="cardWidth()"
        data-density="comfortable"
        [(folded)]="foldedCards"
        (reorder)="reorderProperties($event)"
        (editClass)="edit($event)"
        (editProperty)="editing.editProperty($event)" />
      @if (rows().length === 0) {
        <p class="empty">{{ r + '.noMatch' | translate }}</p>
      }

      @if (state.graph(); as graph) {
        @if (panelIri(); as iri) {
          <app-resource-class-panel
            class="panel"
            [graph]="graph"
            [classIri]="iri"
            [anyResourceLabel]="t + '.anyResource' | translate"
            [canEdit]="state.canEdit()"
            [colors]="state.colors()"
            (classSelected)="openPanel($event)"
            (closed)="openPanel(undefined)"
            (browse)="browse($event)"
            (edit)="edit($event)"
            (editProperty)="editing.editProperty($event)" />
        }
      }
    </div>
  `,
  styleUrl: './data-model-classes.component.css',
})
export class DataModelClassesComponent {
  readonly state = inject(DataModelsRailState);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _dialog = inject(MatDialog);
  private readonly _params = toSignal(this._route.queryParamMap);
  private readonly _translate = inject(TranslateService);
  readonly editing = injectDataModelEditing();
  private readonly _destroyRef = inject(DestroyRef);

  /** The cards folded to their title: none at first, so every class shows its properties, as in the Data models tab. */
  readonly foldedCards = signal(new Set<string>());
  readonly allCardsOpen = computed(() => {
    const rows = this.rows();
    return rows.length > 0 && rows.every(row => !this.foldedCards().has(row.id));
  });

  /** Saves the form order a property was dragged to on a card; the data model is then read again. */
  reorderProperties({ classIri, propertyIris }: PropertyOrder): void {
    this.editing
      .reorderProperties(classIri, propertyIris)
      .pipe(takeUntilDestroyed(this._destroyRef))
      // Not saved, the cards show the saved order again.
      .subscribe(saved => !saved && this._cards()?.forgetOrder(classIri));
  }

  toggleAllCards(): void {
    this.foldedCards.set(this.allCardsOpen() ? new Set(this.rows().map(row => row.id)) : new Set());
  }

  /** The kinds of class to create, as the data model editor offers them. */
  readonly classKinds = DefaultResourceClasses.data;
  /** Whether "Create resource class" shows: for editors, where the editor's dialogs are at hand. */
  readonly canCreate = computed(() => this.state.canEdit() && this.editing.canCreate);

  /** Creates a class of that kind in the data model shown; it then shows among the cards. */
  createClass(kind: DefaultClass): void {
    const ontologyIri = this.state.selected()?.iri;
    if (!ontologyIri) return;
    this.editing.createClass(ontologyIri, kind, () => undefined);
  }

  /** A class's label from its IRI, for the cards. */
  readonly labelOf = (iri: string) => this.state.labelOf(iri);

  /** What is typed in the search; the search runs on it once typing pauses. */
  readonly typed = signal('');
  readonly query = debounced(this.typed);

  /** The cards' least width: room for the checkboxes' words on each row, at the comfortable rows' bigger sizes. */
  readonly cardWidth = signal(440).asReadonly();

  /** The classes whose name, file or properties have the searched text, in any language; by label, as the properties. */
  readonly rows = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.state
      .classRows()
      .filter(row => !query || this._has(row, query))
      .sort((a, b) => a.label.localeCompare(b.label) || a.name.localeCompare(b.name));
  });

  /** The class whose panel is open, named in the URL like in the graph. */
  readonly panelIri = computed(() => {
    const name = this._params()?.get(ONTOLOGY_MAP_PARAM.panel);
    return name ? this.state.classRows().find(row => row.name === name)?.id : undefined;
  });

  private readonly _search = viewChild<ElementRef<HTMLInputElement>>('search');
  private readonly _cards = viewChild(DataModelClassCardsComponent);

  constructor() {
    // Arriving on the page, typing finds what it lists.
    afterNextRender(() => this._search()?.nativeElement.focus());
  }

  /** Esc closes the class's side panel open. */
  closeOnEscape(event: Event): void {
    if (!escapeClosesPanel(event, this._dialog)) return;
    if (this.panelIri()) this.openPanel(undefined);
  }

  /** Opens the class's panel, or closes it; a step in the browser history. */
  openPanel(classIri: string | undefined): void {
    this._navigate({ [ONTOLOGY_MAP_PARAM.panel]: classIri ? localNameOf(classIri) : null });
  }

  /** Opens the class in the Data tab. */
  browse(iri: string): void {
    const [ontologyIri, className] = iri.split('#');
    this._router.navigate(
      this.state.projectPath(RouteConstants.data, OntologyService.getOntologyNameFromIri(ontologyIri), className)
    );
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

  /** Whether what a card shows of a class has the searched text: its names, its file or its properties. */
  private _has(row: ClassRow, query: string): boolean {
    const has = (text: string | undefined) => !!text && text.toLowerCase().includes(query);
    const hasClass = (iri: string | undefined) => !!iri && has(this.state.labelOf(iri));
    return (
      has(row.label) ||
      has(row.name) ||
      row.labels.some(text => has(text.value)) ||
      hasClass(row.superclass) ||
      (!!row.representation &&
        has(this._translate.instant(`pages.ontologyMap.islands.fileKinds.${row.representation}`))) ||
      row.propertyList.some(
        property =>
          has(property.label) ||
          has(property.id.substring(property.id.lastIndexOf('#') + 1)) ||
          hasClass(property.linkTarget)
      )
    );
  }
}
