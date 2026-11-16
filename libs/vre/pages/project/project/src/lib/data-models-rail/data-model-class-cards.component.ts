import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { AddPropertyMenuComponent } from '../ontology-map/add-property-menu.component';
import { FILE_KINDS } from '../ontology-map/islands';
import { ClassRow } from '../ontology-map/ontology-graph-elements';
import { TabShadePipe } from '../ontology-map/tab-shade.pipe';
import { CardProperty, ClassCardPropertyComponent } from './class-card-property.component';
import { hasText, highlighted } from './highlighted';

/** How many of a class's own properties a card shows before "Show more". */
export const CARD_PROPERTIES = 8;

/** How long a card opened from a link target stays outlined. */
const FLASH_MS = 1500;

/** A class as its card shows it: its own properties, and those it has from its superclass, apart. */
interface Card {
  row: ClassRow;
  own: CardProperty[];
  /** The own properties that hold values, and those that link to a resource, each in form order. */
  values: CardProperty[];
  links: CardProperty[];
  inherited: CardProperty[];
  /** The label of the superclass the inherited ones come from, when it is a class of the data model. */
  parent?: string;
}

/** A class's own properties in a new form order, to save. */
export interface PropertyOrder {
  classIri: string;
  propertyIris: string[];
}

/**
 * Data models 2 › Classes as cards, the way the Data models tab shows a data model: one box per class, with the kind of
 * file its resources carry, then its properties in their form order, one line each. A subclass
 * lists its own properties; those from its superclass fold into one row. Past {@link CARD_PROPERTIES}, "Show more" opens
 * the rest. A link's target opens its card. The text searched for is marked, and the rows it is in are opened. Editors
 * drag a class's own properties to another place. As view options, the values and the links can show apart, and a
 * link's target as a chip in its family's colour. A card folds to its title. A clicked class opens its panel.
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
    MatIcon,
    MatTooltip,
    NgTemplateOutlet,
    TabShadePipe,
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
          <li
            appClassCardProperty
            cdkDrag
            cdkDragLockAxis="y"
            cdkDragBoundary=".props"
            [cdkDragDisabled]="!drag"
            [property]="property"
            [labelOf]="labelOf()"
            [colors]="colors()"
            [linkChips]="linkChips()"
            [reachable]="!!property.linkTarget && shown().has(property.linkTarget)"
            [query]="query()"
            [canEdit]="canEdit()"
            [draggable]="drag"
            (edit)="editProperty.emit($event)"
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
          class="card"
          data-cy="data-model-class-card"
          [attr.data-iri]="row.id"
          [class.selected]="row.id === selected()"
          [class.flash]="row.id === flashed()"
          [style.--tab]="colors().get(row.id) | tabShade: '#FFFFFF'">
          <header
            class="card-head"
            tabindex="0"
            role="button"
            (click)="classSelected.emit(row.id)"
            (keydown.enter)="classSelected.emit(row.id)">
            <span class="texts">
              @if (row.superclass) {
                <span
                  class="parent"
                  data-cy="data-model-class-card-parent"
                  [matTooltip]="r + '.subclassOf' | translate: { class: labelOf()(row.superclass) }">
                  <mat-icon>subdirectory_arrow_right</mat-icon>{{ labelOf()(row.superclass) }}
                </span>
              }
              <span class="title">
                <b>
                  @for (part of mark(row.label); track $index) {
                    <span [class.hit]="part.match">{{ part.text }}</span>
                  }
                </b>
                <small>
                  @for (part of mark(row.name); track $index) {
                    <span [class.hit]="part.match">{{ part.text }}</span>
                  }
                </small>
                <!-- The kind of file the class's resources carry. -->
                @if (row.representation; as representation) {
                  <span class="file" data-cy="data-model-class-card-file">
                    <mat-icon>{{ fileIcon(representation) }}</mat-icon>
                    {{ 'pages.ontologyMap.islands.fileKinds.' + representation | translate }}
                  </span>
                }
              </span>
            </span>
            <button
              type="button"
              class="fold"
              data-cy="data-model-class-card-toggle"
              [attr.aria-expanded]="open"
              [attr.aria-label]="(open ? r + '.collapseRow' : r + '.expandRow') | translate"
              (click)="$event.stopPropagation(); toggle(folded, row.id)">
              <mat-icon>{{ open ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
          </header>
          @if (open) {
            <!-- Values, then the links under their own heading, each in form order, when asked apart. -->
            @if (groupLinks() && card.values.length && card.links.length) {
              <ng-container
                *ngTemplateOutlet="capped; context: { $implicit: card.values, key: row.id + ' values', card }" />
              <div class="group" data-cy="data-model-class-card-links">
                <mat-icon>link</mat-icon>
                {{ r + '.links' | translate }} <span class="n">{{ card.links.length }}</span>
              </div>
              <ng-container
                *ngTemplateOutlet="capped; context: { $implicit: card.links, key: row.id + ' links', card }" />
            } @else if (card.own.length) {
              <ng-container *ngTemplateOutlet="capped; context: { $implicit: card.own, key: row.id, card }" />
            } @else if (!card.inherited.length) {
              <p class="none">{{ r + '.noProperties' | translate }}</p>
            }
            @if (card.inherited.length) {
              @let inheritedOpen = inheritedShown().has(row.id) || autoOpened().has(row.id + ' inherited');
              <div class="inherited">
                <button
                  type="button"
                  class="more"
                  data-cy="data-model-class-card-inherited"
                  [attr.aria-expanded]="inheritedOpen"
                  (click)="toggle(inheritedShown, row.id)">
                  <mat-icon>{{ inheritedOpen ? 'expand_less' : 'chevron_right' }}</mat-icon>
                  {{ r + '.inheritedFrom' | translate: { count: card.inherited.length, class: card.parent } }}
                </button>
                @if (inheritedOpen) {
                  <ul class="props">
                    @for (property of card.inherited; track property.id) {
                      <li
                        appClassCardProperty
                        [property]="property"
                        [labelOf]="labelOf()"
                        [colors]="colors()"
                        [linkChips]="linkChips()"
                        [reachable]="!!property.linkTarget && shown().has(property.linkTarget)"
                        [query]="query()"
                        [canEdit]="canEdit()"
                        (edit)="editProperty.emit($event)"
                        (goTo)="goTo($event)"></li>
                    }
                  </ul>
                }
              </div>
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
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      // Fills the section under its head and scrolls on its own, as the table does.
      :host {
        display: block;
        flex: 1;
        min-height: 0;
        overflow: auto;
      }

      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 12px;
        align-items: start;
      }

      .card {
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        overflow: hidden;
        position: relative;
        scroll-margin: 16px;
        transition: box-shadow 0.2s;

        // The family's colour as a tab, as the class chips and the graph show it.
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: var(--tab);
          z-index: 1;
        }

        &.selected,
        &.flash {
          border-color: $primary;
          box-shadow: 0 0 0 1px $primary;
        }

        &.flash {
          box-shadow: 0 0 0 3px rgba(51, 103, 144, 0.35);
        }
      }

      .card-head {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        padding: 6px 4px 6px 16px;
        cursor: pointer;

        &:hover {
          background: $cool_gray_50;
        }

        .texts {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .title {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          column-gap: 6px;
          min-width: 0;
          max-width: 100%;
        }

        b {
          font-weight: 500;
          font-size: 14px;
          color: $cool_gray_900;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        small {
          font-family: 'Roboto Mono', monospace;
          font-size: 11px;
          color: $cool_gray_500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .hit {
        background: #fde68a;
        color: inherit;
        border-radius: 2px;
      }

      // The superclass, in the family's colour, above the name.
      .parent {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        max-width: 100%;
        margin-bottom: 2px;
        padding: 0 8px 0 4px;
        border-radius: 99px;
        background: color-mix(in srgb, var(--tab) 25%, white);
        font-size: 11px;
        font-weight: 500;
        color: $cool_gray_900;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
          flex: none;
        }
      }

      // The kind of file, after the names.
      .file {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        align-self: center;
        padding: 0 7px 0 4px;
        border: 1px solid $cool_gray_300;
        border-radius: 99px;
        font-size: 11px;
        line-height: 16px;
        color: $cool_gray_600;
        white-space: nowrap;

        mat-icon {
          font-size: 13px;
          width: 13px;
          height: 13px;
        }
      }

      .fold {
        flex: none;
        border: 0;
        background: none;
        color: $cool_gray_500;
        cursor: pointer;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: grid;
        place-items: center;

        &:hover {
          background: $cool_gray_100;
        }
      }

      .props {
        list-style: none;
        margin: 0;
        padding: 0;
        border-top: 1px solid $cool_gray_100;
      }

      // Where a dragged property lands.
      .drop-line {
        height: 2px;
        background: $primary;
      }

      .cdk-drag-animating,
      .props.cdk-drop-list-dragging .prop:not(.cdk-drag-placeholder) {
        transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
      }

      // "Links" over their group.
      .group {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 16px 2px;
        border-top: 1px solid $cool_gray_100;
        background: $cool_gray_50;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: $cool_gray_500;

        .n {
          font-weight: 400;
          letter-spacing: 0;
        }

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }

      // "Show n more" and the inherited row.
      .more {
        display: flex;
        align-items: center;
        gap: 4px;
        width: 100%;
        padding: 3px 16px;
        border: 0;
        border-top: 1px solid $cool_gray_100;
        background: none;
        font: inherit;
        font-size: 12px;
        font-weight: 500;
        color: $primary;
        text-align: left;
        cursor: pointer;

        &:hover {
          background: $cool_gray_100;
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .inherited {
        background: $cool_gray_50;

        .more {
          font-weight: 400;
          color: $cool_gray_600;
        }
      }

      // "Add property" under an opened card's properties, as in the Data models tab.
      .add-property {
        display: block;
        border-top: 1px solid $cool_gray_100;
      }

      .none {
        margin: 0;
        padding: 6px 16px 8px;
        border-top: 1px solid $cool_gray_100;
        font-size: 12.5px;
        color: $cool_gray_500;
      }

      [tabindex='0']:focus-visible,
      button:focus-visible {
        outline: 2px solid $primary;
        outline-offset: -2px;
      }
    `,
  ],
})
export class DataModelClassCardsComponent {
  private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly CARD_PROPERTIES = CARD_PROPERTIES;

  readonly rows = input.required<ClassRow[]>();
  /** Every class of the data model, the search aside: where a subclass finds its superclass's properties. */
  readonly classes = input<ClassRow[]>();
  /** Colour per class, its family's. */
  readonly colors = input.required<Map<string, string>>();
  /** A class's label from its IRI, for superclasses and link targets. */
  readonly labelOf = input.required<(iri: string) => string>();
  /** The class whose panel is open. */
  readonly selected = input<string | undefined>(undefined);
  /** Whether an opened card offers "Add property": for those who may edit the data model. */
  readonly canEdit = input(false);
  /** Whether editors may drag a class's own properties to another place, where the editor can save it. */
  readonly canReorder = input(false);
  /** Whether a class's own properties show as values, then links, rather than all in form order. */
  readonly groupLinks = input(false);
  /** Whether a link's target shows as a chip in its family's colour, rather than as "→ class". */
  readonly linkChips = input(false);
  /** The text searched for: marked where it shows, and the rows it is in opened. */
  readonly query = input('');

  readonly classSelected = output<string>();
  /** A property's pencil was clicked: its dialog is to open. */
  readonly editProperty = output<string>();
  /** A property was dragged to another place: the class's own properties in their new order, to save. */
  readonly reorder = output<PropertyOrder>();

  /** The cards folded to their title; the others show their properties. */
  readonly folded = model(new Set<string>());
  /** The cards showing all their own properties, past the first {@link CARD_PROPERTIES}. */
  readonly showAll = signal(new Set<string>());
  /** The cards showing the properties their class has from its superclass. */
  readonly inheritedShown = signal(new Set<string>());
  /** The card a link target just opened, outlined a moment. */
  readonly flashed = signal<string | undefined>(undefined);
  private _flashTimer?: ReturnType<typeof setTimeout>;

  /** The orders dragged but not read back yet, by class: shown at once, until the data model is read again. */
  private readonly _dragged = signal(new Map<string, string[]>());

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
      return {
        row,
        own,
        values: own.filter(property => !property.linkTarget),
        links: own.filter(property => property.linkTarget),
        inherited: row.propertyList.filter(property => fromParent.has(property.id)),
        parent: parent?.label,
      };
    });
  });

  /** The lists opened for the search: past "Show more", or the inherited row, where a property has the text. */
  readonly autoOpened = computed(() => {
    const query = this.query();
    const opened = new Set<string>();
    if (!query.trim()) return opened;
    const has = (property: CardProperty) =>
      hasText(property.label, query) || hasText(property.id.substring(property.id.lastIndexOf('#') + 1), query);
    const grouped = this.groupLinks();
    for (const card of this.cards()) {
      const id = card.row.id;
      const lists: [string, CardProperty[]][] =
        grouped && card.values.length && card.links.length
          ? [
              [`${id} values`, card.values],
              [`${id} links`, card.links],
            ]
          : [[id, card.own]];
      for (const [key, list] of lists) if (list.slice(CARD_PROPERTIES).some(has)) opened.add(key);
      if (card.inherited.some(has)) opened.add(`${id} inherited`);
    }
    return opened;
  });

  constructor() {
    // The data model read again has the dragged orders, or not if saving failed: either way it is what shows.
    effect(() => {
      this.classes();
      untracked(() => this._dragged.set(new Map()));
    });
  }

  toggle(set: WritableSignal<Set<string>>, iri: string): void {
    const next = new Set(set());
    if (!next.delete(iri)) next.add(iri);
    set.set(next);
  }

  /** The text cut where it has the searched text, to mark it. */
  mark(text: string) {
    return highlighted(text, this.query());
  }

  fileIcon(representation: string): string {
    return FILE_KINDS.find(kind => kind.representation === representation)?.icon ?? 'insert_drive_file';
  }

  /** Brings the class's card into view and outlines it a moment. */
  goTo(iri: string): void {
    const card = Array.from(this._host.nativeElement.querySelectorAll<HTMLElement>('[data-iri]')).find(
      element => element.dataset['iri'] === iri
    );
    if (!card) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    card.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    this.flashed.set(iri);
    clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(() => this.flashed.set(undefined), FLASH_MS);
  }

  /**
   * A property of `list`, the class's own ones or one group of them, was dropped elsewhere in it: the class's own
   * properties take the new order, the other group's keeping their places, and it is shown at once, then saved.
   */
  dropped(card: Card, list: CardProperty[], event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return;
    const moved = [...list];
    moveItemInArray(moved, event.previousIndex, event.currentIndex);
    const inList = new Set(list.map(property => property.id));
    const next = [...moved];
    const order = card.own.map(property => (inList.has(property.id) ? next.shift()!.id : property.id));
    this._dragged.update(dragged => new Map(dragged).set(card.row.id, order));
    this.reorder.emit({ classIri: card.row.id, propertyIris: order });
  }
}
