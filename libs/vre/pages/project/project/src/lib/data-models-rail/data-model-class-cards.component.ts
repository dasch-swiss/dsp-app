import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Constants } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { AddPropertyMenuComponent } from '../ontology-map/add-property-menu.component';
import { ClassRow } from '../ontology-map/ontology-graph-elements';
import { typeIconOf, typeNameOf } from '../ontology-map/property-types';
import { TabShadePipe } from '../ontology-map/tab-shade.pipe';

type CardProperty = ClassRow['propertyList'][number];

/** How many of a class's own properties a card shows before "Show more". */
export const CARD_PROPERTIES = 8;

/** A class as its card shows it: its own properties, and those it has from its superclass, apart. */
interface Card {
  row: ClassRow;
  own: CardProperty[];
  inherited: CardProperty[];
  /** The label of the superclass the inherited ones come from, when it is a class of the data model. */
  parent?: string;
}

/**
 * Data models 2 › Classes as cards, the way the Data models tab shows a data model: one box per class with its
 * properties in their form order, one line each: value type, label, the class a link points at, local name and
 * cardinality. A subclass lists its own properties; those from its superclass fold into one row. Past
 * {@link CARD_PROPERTIES}, "Show more" opens the rest. A card folds to its title. A clicked class opens its panel.
 */
@Component({
  selector: 'app-data-model-class-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AddPropertyMenuComponent, MatIcon, MatTooltip, NgTemplateOutlet, TabShadePipe, TranslatePipe],
  template: `
    @let r = 'pages.dataModels2';
    <ng-template #propertyRow let-property>
      <li
        class="prop"
        data-cy="data-model-class-card-property"
        [matTooltip]="propertyTip(property)"
        matTooltipShowDelay="600">
        <mat-icon class="type" [attr.aria-label]="typeName(property.type)">{{ typeIcon(property.type) }}</mat-icon>
        <span class="name">
          {{ property.label }}
          @if (property.linkTarget) {
            <span class="target">→ {{ labelOf()(property.linkTarget) }}</span>
          }
        </span>
        <span class="local">{{ localName(property.id) }}</span>
        <span
          class="cardinality"
          data-cy="data-model-class-card-cardinality"
          [class.required]="property.required"
          [matTooltip]="r + '.cardinality.' + cardinalityKey(property) | translate">
          {{ cardinality(property) }}
        </span>
        <!-- For editors, on hover: the property's dialog; built-in properties are not edited here. -->
        @if (canEdit() && editable(property.id)) {
          <button
            type="button"
            class="edit"
            data-cy="data-model-class-card-edit-property"
            [attr.aria-label]="'pages.ontologyMap.classPanel.editProperty' | translate: { property: property.label }"
            (click)="editProperty.emit(property.id)">
            <mat-icon>edit</mat-icon>
          </button>
        }
      </li>
    </ng-template>

    <div class="cards" data-cy="data-model-class-cards">
      @for (card of cards(); track card.row.id) {
        @let row = card.row;
        @let open = !folded().has(row.id);
        @let all = showAll().has(row.id);
        @let hidden = card.own.length - CARD_PROPERTIES;
        <article
          class="card"
          data-cy="data-model-class-card"
          [class.selected]="row.id === selected()"
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
                <b>{{ row.label }}</b>
                <small>{{ row.name }}</small>
              </span>
            </span>
            <span class="count" [matTooltip]="r + '.colProperties' | translate">{{ row.propertyList.length }}</span>
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
            @if (card.own.length) {
              <ul class="props">
                @for (property of all ? card.own : card.own.slice(0, CARD_PROPERTIES); track property.id) {
                  <ng-container *ngTemplateOutlet="propertyRow; context: { $implicit: property }" />
                }
              </ul>
            } @else if (!card.inherited.length) {
              <p class="none">{{ r + '.noProperties' | translate }}</p>
            }
            @if (hidden > 0) {
              <button
                type="button"
                class="more"
                data-cy="data-model-class-card-more"
                [attr.aria-expanded]="all"
                (click)="toggle(showAll, row.id)">
                <mat-icon>{{ all ? 'expand_less' : 'expand_more' }}</mat-icon>
                {{ all ? (r + '.showLess' | translate) : (r + '.showMore' | translate: { count: hidden }) }}
              </button>
            }
            @if (card.inherited.length) {
              @let inheritedOpen = inheritedShown().has(row.id);
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
                      <ng-container *ngTemplateOutlet="propertyRow; context: { $implicit: property }" />
                    }
                  </ul>
                }
              </div>
            }
            <!-- For editors: a new property of a type, or one the project has, as in the class's panel. -->
            @if (canEdit()) {
              <div class="add-property">
                <app-add-property-menu [classIri]="row.id" />
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

        // The family's colour as a tab, as the class chips and the graph show it.
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: var(--tab);
        }

        &.selected {
          border-color: $primary;
          box-shadow: 0 0 0 1px $primary;
        }
      }

      .card-head {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 4px 6px 16px;
        cursor: pointer;

        &:hover {
          background: $cool_gray_50;
        }

        .texts {
          flex: 1;
          min-width: 0;
        }

        .title {
          display: flex;
          align-items: baseline;
          gap: 6px;
          min-width: 0;
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

      .count {
        font-size: 11px;
        color: $cool_gray_600;
        border: 1px solid $cool_gray_300;
        border-radius: 99px;
        padding: 0 7px;
        font-variant-numeric: tabular-nums;
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

      // One line per property: type, label and target, local name, cardinality, pencil.
      .prop {
        display: grid;
        grid-template-columns: 16px minmax(0, 1fr) auto 32px 22px;
        gap: 6px;
        align-items: center;
        min-height: 26px;
        padding: 1px 4px 1px 16px;
        font-size: 12.5px;

        & + .prop {
          border-top: 1px solid $cool_gray_100;
        }

        &:hover {
          background: $cool_gray_50;
        }
      }

      .type {
        font-size: 15px;
        width: 15px;
        height: 15px;
        color: $cool_gray_500;
      }

      .name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: $cool_gray_900;
      }

      .target {
        color: $cool_gray_500;
      }

      .local {
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: 'Roboto Mono', monospace;
        font-size: 10.5px;
        color: $primary;
      }

      // 1, 0-1, 1-n or 0-n; filled when a value is required.
      .cardinality {
        font-family: 'Roboto Mono', monospace;
        font-size: 10.5px;
        font-weight: 500;
        line-height: 16px;
        text-align: center;
        border: 1px solid $cool_gray_300;
        border-radius: 4px;
        color: $cool_gray_600;

        &.required {
          background: $primary;
          border-color: $primary;
          color: white;
        }
      }

      // The pencil, as in the class's panel: shown on hover, or while it has the focus.
      .edit {
        grid-column: 5;
        display: flex;
        padding: 2px;
        border: 0;
        border-radius: 50%;
        background: none;
        color: $primary;
        cursor: pointer;
        visibility: hidden;

        &:hover {
          background: $primary_50;
        }

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      .prop:hover .edit,
      .edit:focus-visible {
        visibility: visible;
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

        .name {
          color: $cool_gray_600;
        }
      }

      // "Add property" under an opened card's properties, as in the Data models tab.
      .add-property {
        padding: 0 8px 2px;
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

  readonly classSelected = output<string>();
  /** A property's pencil was clicked: its dialog is to open. */
  readonly editProperty = output<string>();

  /** The cards folded to their title; the others show their properties. */
  readonly folded = model(new Set<string>());
  /** The cards showing all their own properties, past the first {@link CARD_PROPERTIES}. */
  readonly showAll = signal(new Set<string>());
  /** The cards showing the properties their class has from its superclass. */
  readonly inheritedShown = signal(new Set<string>());

  readonly cards = computed<Card[]>(() => {
    const byId = new Map((this.classes() ?? this.rows()).map(row => [row.id, row]));
    return this.rows().map(row => {
      const parent = row.superclass ? byId.get(row.superclass) : undefined;
      if (!parent) return { row, own: row.propertyList, inherited: [] };
      const fromParent = new Set(parent.propertyList.map(property => property.id));
      return {
        row,
        own: row.propertyList.filter(property => !fromParent.has(property.id)),
        inherited: row.propertyList.filter(property => fromParent.has(property.id)),
        parent: parent.label,
      };
    });
  });

  toggle(set: WritableSignal<Set<string>>, iri: string): void {
    const next = new Set(set());
    if (!next.delete(iri)) next.add(iri);
    set.set(next);
  }

  /** The cardinality as the data model writes it: 1, 0-1, 1-n or 0-n. */
  cardinality(property: CardProperty): string {
    return `${property.required ? 1 : 0}${property.multiple ? '-n' : property.required ? '' : '-1'}`;
  }

  /** The translation key, under `pages.dataModels2.cardinality`, that says the cardinality in words. */
  cardinalityKey(property: CardProperty): string {
    return `${property.required ? 'required' : 'optional'}${property.multiple ? 'Multiple' : 'One'}`;
  }

  /** The whole line, for when the card is too narrow for it. */
  propertyTip(property: CardProperty): string {
    const target = property.linkTarget ? ` → ${this.labelOf()(property.linkTarget)}` : '';
    return `${property.label}${target} (${this.localName(property.id)})`;
  }

  /** Whether the property is the data model's own, rather than built in, so it can be edited here. */
  editable(iri: string): boolean {
    return !iri.startsWith(Constants.KnoraApiV2);
  }

  typeIcon(type: string): string {
    return typeIconOf(type);
  }

  typeName(type: string): string {
    return typeNameOf(type);
  }

  localName(iri: string): string {
    return iri.substring(iri.lastIndexOf('#') + 1);
  }
}
