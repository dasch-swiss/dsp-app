import { Clipboard } from '@angular/cdk/clipboard';
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChildren,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AddPropertyMenuComponent } from '../ontology-map/add-property-menu.component';
import { injectDataModelEditing } from '../ontology-map/data-model-editor';
import { FILE_KINDS } from '../ontology-map/islands';
import { ClassRow } from '../ontology-map/ontology-graph-elements';
import { CanDoChecks } from './can-do-checks';
import { CardProperty, ClassCardPropertyComponent } from './class-card-property.component';
import { DataModelsRailState } from './data-models-rail-state';
import { hasText, HighlightedPipe } from './highlighted';

/** How many of a class's own properties a card shows before "Show more". */
const CARD_PROPERTIES = 8;

/** The icon of a kind of file. */
function fileIconOf(representation: string): string {
  return FILE_KINDS.find(kind => kind.representation === representation)?.icon ?? 'insert_drive_file';
}

/** How long a card opened from a link target stays outlined. */
const FLASH_MS = 1500;

/** A class as its card shows it: its own properties, and those it has from its superclass, apart and together. */
interface Card {
  row: ClassRow;
  own: CardProperty[];
  /** Every property, own and inherited, in the class's form order, as the data model editor lists them. */
  all: CardProperty[];
  /** Which of them are the class's own: those change on this card. */
  ownIds: ReadonlySet<string>;
  /** The icon of the kind of file its resources carry, if any. */
  fileIcon?: string;
}

/** How a subclass's card shows the properties it has from its superclass. */
/** A class's own properties in a new form order, to save. */
export interface PropertyOrder {
  classIri: string;
  propertyIris: string[];
}

/**
 * Data models 2 › Resource classes as cards, the way the Data models tab shows a data model: one box per class, with the kind of
 * file its resources carry, then its properties in their form order, one line each. A subclass
 * lists its own properties; those from its superclass fold into one row. Past {@link CARD_PROPERTIES}, "Show more" opens
 * the rest. A link's target opens its card. The text searched for is marked, and the rows it is in are opened. Editors
 * drag a class's own properties to another place. A card folds to its title. Its menu edits the class, or shows
 * its details in the side panel.
 */
@Component({
  selector: 'app-data-model-class-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AddPropertyMenuComponent,
    CdkDrag,
    CdkDragPlaceholder,
    CdkDropList,
    ClassCardPropertyComponent,
    HighlightedPipe,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatTooltip,
    NgTemplateOutlet,
    TranslatePipe,
  ],
  template: `
    @let r = 'pages.dataModels2';
    <!-- A class's own properties, or one group of them, up to the cap, then "Show n more"; editors drag them. -->
    <ng-template #capped let-properties let-key="key" let-card="card">
      @let all = showAll().has(key) || autoOpened().has(key);
      @let hidden = properties.length - CARD_PROPERTIES;
      @let drag = reorderable();
      <ul
        class="props"
        cdkDropList
        [cdkDropListDisabled]="!drag"
        (cdkDropListDropped)="dropped(card, properties, $event)">
        @for (property of all ? properties : properties.slice(0, CARD_PROPERTIES); track property.id) {
          @let own = card.ownIds.has(property.id);
          <li
            appClassCardProperty
            cdkDrag
            cdkDragLockAxis="y"
            cdkDragBoundary=".props"
            [cdkDragDisabled]="!drag || !own"
            [homeIri]="card.row.id"
            [property]="property"
            [labelOf]="labelOf()"
            [reachable]="!!property.linkTarget && shown().has(property.linkTarget)"
            [query]="query()"
            [canEdit]="canEdit()"
            [draggable]="drag && own"
            [classIri]="own ? card.row.id : undefined"
            [className]="card.row.label"
            (edit)="editProperty.emit($event)"
            (remove)="removeProperty(card.row, property)"
            (goTo)="goTo($event)">
            <div class="drop-line" *cdkDragPlaceholder></div>
          </li>
        }
      </ul>
      @if (hidden > 0) {
        <button
          type="button"
          class="more"
          data-cy="data-model-class-card-more"
          [attr.aria-expanded]="all"
          (click)="toggle(showAll, key)">
          <mat-icon>{{ all ? 'expand_less' : 'expand_more' }}</mat-icon>
          {{ all ? (r + '.showLess' | translate) : (r + '.showMore' | translate: { count: hidden }) }}
        </button>
      }
    </ng-template>

    <div class="cards" data-cy="data-model-class-cards">
      @for (card of cards(); track card.row.id) {
        @let row = card.row;
        @let open = !folded().has(row.id);
        <article
          #cardElement
          class="card"
          data-cy="data-model-class-card"
          [attr.data-iri]="row.id"
          [class.selected]="row.id === selected()"
          [class.flash]="row.id === flashed()">
          <header class="card-head" (mouseenter)="checkDelete(row.id, true)" (mouseleave)="cancelCheck()">
            <span class="texts">
              <ng-template #className>
                <small>
                  @for (part of row.name | highlighted: query(); track $index) {
                    <span [class.hit]="part.match">{{ part.text }}</span>
                  }
                </small>
              </ng-template>
              <span class="title">
                <b>
                  @for (part of row.label | highlighted: query(); track $index) {
                    <span [class.hit]="part.match">{{ part.text }}</span>
                  }
                </b>
              </span>
              <!-- Under the label: the class's name, then the kind of file its resources carry, or none. -->
              <span class="kind-line" data-cy="data-model-class-card-file">
                <ng-container [ngTemplateOutlet]="className" />
                <span aria-hidden="true">·</span>
                @if (row.representation; as representation) {
                  <mat-icon>{{ card.fileIcon }}</mat-icon>
                  {{ 'pages.ontologyMap.islands.fileKinds.' + representation | translate }}
                } @else {
                  <mat-icon>person_outline</mat-icon>
                  {{ 'pages.dataModels2.objectWithoutRepresentation' | translate }}
                }
              </span>
            </span>
            <!-- The class's actions, as in the Data models tab: edit, open its resources, copy its ID, delete. -->
            @let c = 'pages.ontology.resourceClassInfo';
            @let check = deleteChecks().get(row.id);
            <button
              type="button"
              class="icon-button menu-button"
              data-cy="data-model-class-card-menu"
              [attr.aria-label]="r + '.classActions' | translate: { class: row.label }"
              [matTooltip]="r + '.classActions' | translate: { class: row.label }"
              matTooltipShowDelay="600"
              [matMenuTriggerFor]="classMenu"
              (menuOpened)="checkDelete(row.id)">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #classMenu="matMenu" xPosition="before">
              @if (canEdit()) {
                <button
                  mat-menu-item
                  type="button"
                  data-cy="data-model-class-card-edit"
                  (click)="editClass.emit(row.id)">
                  <mat-icon>edit</mat-icon>
                  {{ c + '.edit' | translate }}
                </button>
              }
              <!-- A class nothing uses has no resources to open. -->
              <button
                mat-menu-item
                type="button"
                data-cy="data-model-class-card-open-instances"
                [disabled]="check?.canDo === true"
                (click)="openInstances(row)">
                <mat-icon>open_in_new</mat-icon>
                {{ c + '.openInstances' | translate }}
              </button>
              <button mat-menu-item type="button" data-cy="data-model-class-card-copy-id" (click)="copyId(row)">
                <mat-icon>content_copy</mat-icon>
                {{ c + '.copyId' | translate }}
              </button>
              <!-- Deletes once the API says nothing uses the class; why not, under it, when something does. -->
              @if (canEdit() && editing.canDelete) {
                <button
                  mat-menu-item
                  type="button"
                  class="delete"
                  data-cy="data-model-class-card-delete"
                  [disabled]="!check?.canDo"
                  (click)="deleteClass(row)">
                  <mat-icon>delete</mat-icon>
                  <span class="menu-text">
                    {{ c + '.delete' | translate }}
                    @if (!check) {
                      <small>{{ r + '.checkingDelete' | translate }}</small>
                    } @else if (!check.canDo) {
                      <small>{{ r + '.cannotDeleteClass' | translate }}</small>
                    }
                  </span>
                </button>
              }
            </mat-menu>
            <button
              type="button"
              class="icon-button"
              data-cy="data-model-class-card-toggle"
              [attr.aria-expanded]="open"
              [attr.aria-label]="(open ? r + '.collapseRow' : r + '.expandRow') | translate"
              (click)="$event.stopPropagation(); toggle(folded, row.id)">
              <mat-icon>{{ open ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
          </header>
          @if (open) {
            <!-- Own and inherited properties together, in the class's form order, as the data model editor lists
                 them; only the class's own change here. -->
            @if (card.all.length) {
              <ng-container *ngTemplateOutlet="capped; context: { $implicit: card.all, key: row.id, card }" />
            } @else {
              <p class="none">{{ r + '.noProperties' | translate }}</p>
            }
            <!-- For editors: a new property of a type, or one the project has, as in the class's panel. -->
            @if (canEdit()) {
              <div class="add-property">
                <app-add-property-menu [classIri]="row.id" [row]="true" />
              </div>
            }
          }
        </article>
      }
    </div>
  `,
  styleUrl: './data-model-class-cards.component.css',
})
export class DataModelClassCardsComponent {
  private readonly _destroyRef = inject(DestroyRef);
  readonly editing = injectDataModelEditing();
  private readonly _state = inject(DataModelsRailState);
  private readonly _router = inject(Router);
  private readonly _clipboard = inject(Clipboard);
  private readonly _notification = inject(NotificationService);
  private readonly _translate = inject(TranslateService);

  /** Opens the class's resources in the Data tab, in a new browser tab, as the Data models tab does. */
  openInstances(row: ClassRow): void {
    const [ontologyIri, className] = row.id.split('#');
    const path = this._state.projectPath(
      RouteConstants.data,
      OntologyService.getOntologyNameFromIri(ontologyIri),
      className
    );
    window.open(this._router.serializeUrl(this._router.createUrlTree(path)), '_blank');
  }

  /** Copies the class's IRI, and says so. */
  copyId(row: ClassRow): void {
    this._clipboard.copy(row.id);
    this._notification.openSnackBar(this._translate.instant('pages.ontology.resourceClassInfo.idCopied'));
  }
  /** What the API says of deleting each class, once asked; none while it checks. */
  private readonly _deleteChecks = new CanDoChecks(iri => this.editing.canDeleteClass(iri), inject(DestroyRef));
  readonly deleteChecks = this._deleteChecks.results;

  readonly CARD_PROPERTIES = CARD_PROPERTIES;

  readonly rows = input.required<ClassRow[]>();
  /** Every class of the data model, the search aside: where a subclass finds its superclass's properties. */
  readonly classes = input<ClassRow[]>();
  /** A class's label from its IRI, for superclasses and link targets. */
  readonly labelOf = input.required<(iri: string) => string>();
  /** The class whose panel is open. */
  readonly selected = input<string | undefined>(undefined);
  /** Whether an opened card offers "Add property": for those who may edit the data model. */
  readonly canEdit = input(false);
  /** Whether editors may drag a class's own properties to another place, where the editor can save it. */
  readonly canReorder = input(false);
  /** The text searched for: marked where it shows, and the rows it is in opened. */
  readonly query = input('');
  /** "Edit class" was picked: the class's dialog is to open. */
  readonly editClass = output<string>();
  /** A property's pencil was clicked: its dialog is to open. */
  readonly editProperty = output<string>();
  /** A property was dragged to another place: the class's own properties in their new order, to save. */
  readonly reorder = output<PropertyOrder>();

  /** The cards folded to their title; the others show their properties. */
  readonly folded = model(new Set<string>());
  /** The cards showing all their own properties, past the first {@link CARD_PROPERTIES}. */
  readonly showAll = signal(new Set<string>());
  /** The card a link target just opened, outlined a moment. */
  readonly flashed = signal<string | undefined>(undefined);
  private _flashTimer?: ReturnType<typeof setTimeout>;

  /** The orders dragged but not read back yet, by class: shown at once, until the data model is read again. */
  private readonly _dragged = signal(new Map<string, string[]>());

  /** The cards' elements, in the order of {@link cards}. */
  private readonly _cardElements = viewChildren<ElementRef<HTMLElement>>('cardElement');

  readonly reorderable = computed(() => this.canEdit() && this.canReorder());

  /** The classes whose cards show, for link targets to open. */
  readonly shown = computed(() => new Set(this.rows().map(row => row.id)));

  readonly cards = computed<Card[]>(() => {
    const byId = new Map((this.classes() ?? this.rows()).map(row => [row.id, row]));
    const dragged = this._dragged();
    return this.rows().map(row => {
      const parent = row.superclass ? byId.get(row.superclass) : undefined;
      const fromParent = new Set(parent?.propertyList.map(property => property.id));
      let own = row.propertyList.filter(property => !fromParent.has(property.id));
      const order = dragged.get(row.id);
      if (order) own = [...own].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      const ownIds = new Set(own.map(property => property.id));
      const ownInOrder = [...own];
      return {
        row,
        own,
        all: row.propertyList.map(property => (ownIds.has(property.id) ? ownInOrder.shift()! : property)),
        ownIds,
        fileIcon: row.representation ? fileIconOf(row.representation) : undefined,
      };
    });
  });

  /** The lists opened for the search: past "Show more", where a property has the text. */
  readonly autoOpened = computed(() => {
    const query = this.query();
    const opened = new Set<string>();
    if (!query.trim()) return opened;
    const has = (property: CardProperty) =>
      hasText(property.label, query) || hasText(property.id.substring(property.id.lastIndexOf('#') + 1), query);
    for (const card of this.cards()) {
      const id = card.row.id;
      if (card.all.slice(CARD_PROPERTIES).some(has)) opened.add(id);
    }
    return opened;
  });

  constructor() {
    // The data model read again has the dragged orders, or not if saving failed: either way it is what shows.
    effect(() => {
      this.classes();
      untracked(() => {
        this._dragged.set(new Map());
        // Read again after an edit: what could not be deleted may be deletable now, and the other way round.
        this._deleteChecks.clear();
      });
    });
  }

  /** Asks the API whether the class can be deleted, for its menu to say so; `soon` waits for the pointer to rest. */
  checkDelete(classIri: string, soon = false): void {
    if (!this.canEdit() || !this.editing.canDelete) return;
    if (soon) this._deleteChecks.checkSoon(classIri);
    else this._deleteChecks.check(classIri);
  }

  cancelCheck(): void {
    this._deleteChecks.cancel();
  }

  /** Deletes the class once confirmed; the data model is then read again. */
  deleteClass(row: ClassRow): void {
    this.editing.deleteClass(row.id, row.label).pipe(takeUntilDestroyed(this._destroyRef)).subscribe();
  }

  /** Takes the property off the class once checked and confirmed; the data model is then read again. */
  removeProperty(row: ClassRow, property: CardProperty): void {
    this.editing
      .removeProperty(row.id, property.id, { property: property.label, class: row.label })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe();
  }

  toggle(set: WritableSignal<Set<string>>, iri: string): void {
    const next = new Set(set());
    if (!next.delete(iri)) next.add(iri);
    set.set(next);
  }

  /** Brings the class's card into view and outlines it a moment. */
  goTo(iri: string): void {
    const card = this._cardElements()[this.cards().findIndex(c => c.row.id === iri)]?.nativeElement;
    if (!card) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    card.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    this.flashed.set(iri);
    clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(() => this.flashed.set(undefined), FLASH_MS);
  }

  /** Shows the class's properties in their saved order again, after a dragged order failed to save. */
  forgetOrder(classIri: string): void {
    this._dragged.update(dragged => {
      const next = new Map(dragged);
      next.delete(classIri);
      return next;
    });
  }

  /**
   * A property of `list`, the class's own ones, one group of them, or all its properties with the inherited ones, was
   * dropped elsewhere in it: the class's own properties take the new order, the others keeping their places, and it
   * is shown at once, then saved.
   */
  dropped(card: Card, list: CardProperty[], event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return;
    const moved = [...list];
    moveItemInArray(moved, event.previousIndex, event.currentIndex);
    const inList = new Set(list.map(property => property.id));
    // Inherited properties in the list keep their places: only the class's own are ordered.
    const next = moved.filter(property => card.ownIds.has(property.id));
    const order = card.own.map(property => (inList.has(property.id) ? next.shift()!.id : property.id));
    this._dragged.update(dragged => new Map(dragged).set(card.row.id, order));
    this.reorder.emit({ classIri: card.row.id, propertyIris: order });
  }
}
