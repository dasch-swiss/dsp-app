import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Constants } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { AddPropertyMenuComponent } from '../ontology-map/add-property-menu.component';
import { ClassRow } from '../ontology-map/ontology-graph-elements';
import { typeIconOf, typeNameOf } from '../ontology-map/property-types';
import { TabShadePipe } from '../ontology-map/tab-shade.pipe';

/**
 * Data models 2 › Classes as cards, the way the Data models tab shows a data model: one box per class with its
 * properties in their form order, each with its value type, the class a link points at, and whether a resource may
 * have several values of it and must have one. A card folds to its title. A clicked class
 * opens its panel.
 */
@Component({
  selector: 'app-data-model-class-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AddPropertyMenuComponent, MatIcon, MatTooltip, TabShadePipe, TranslatePipe],
  template: `
    @let r = 'pages.dataModels2';
    <div class="cards" data-cy="data-model-class-cards">
      @for (row of rows(); track row.id) {
        @let open = !folded().has(row.id);
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
              <b>{{ row.label }}</b>
              <small>
                {{ row.name }}
                @if (row.superclass) {
                  · {{ r + '.subclassOf' | translate: { class: labelOf()(row.superclass) } }}
                }
              </small>
            </span>
            <button
              type="button"
              class="fold"
              data-cy="data-model-class-card-toggle"
              [attr.aria-expanded]="open"
              [attr.aria-label]="(open ? r + '.collapseRow' : r + '.expandRow') | translate"
              (click)="$event.stopPropagation(); toggle(row.id)">
              <mat-icon>{{ open ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
          </header>
          @if (open) {
            @if (row.propertyList.length) {
              <ul class="props">
                @for (property of row.propertyList; track property.id) {
                  <li class="prop" data-cy="data-model-class-card-property">
                    <mat-icon class="type" [matTooltip]="typeName(property.type)">{{
                      typeIcon(property.type)
                    }}</mat-icon>
                    <span class="name">
                      {{ property.label }}
                      @if (property.linkTarget) {
                        <span class="target">→ {{ labelOf()(property.linkTarget) }}</span>
                      }
                      <small>{{ localName(property.id) }}</small>
                    </span>
                    <span class="flags">
                      @if (property.multiple) {
                        <span class="flag">{{ r + '.multiple' | translate }}</span>
                      }
                      @if (property.required) {
                        <span class="flag required">{{ r + '.required' | translate }}</span>
                      }
                    </span>
                    <!-- For editors, on hover: the property's dialog; built-in properties are not edited here. -->
                    @if (canEdit() && editable(property.id)) {
                      <button
                        type="button"
                        class="edit"
                        data-cy="data-model-class-card-edit-property"
                        [attr.aria-label]="
                          'pages.ontologyMap.classPanel.editProperty' | translate: { property: property.label }
                        "
                        [matTooltip]="
                          'pages.ontologyMap.classPanel.editProperty' | translate: { property: property.label }
                        "
                        (click)="editProperty.emit(property.id)">
                        <mat-icon>edit</mat-icon>
                      </button>
                    }
                  </li>
                }
              </ul>
            } @else {
              <p class="none">{{ r + '.noProperties' | translate }}</p>
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
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
        align-items: flex-start;
        gap: 4px;
        padding: 8px 4px 8px 16px;
        cursor: pointer;

        &:hover {
          background: $cool_gray_50;
        }

        .texts {
          flex: 1;
          min-width: 0;
        }

        b {
          display: block;
          font-weight: 500;
          font-size: 15px;
          color: $cool_gray_900;
        }

        small {
          font-size: 12px;
          color: $cool_gray_500;
        }
      }

      .fold {
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

      .prop {
        display: grid;
        grid-template-columns: 20px minmax(0, 1fr) auto 26px;
        gap: 8px;
        align-items: start;
        padding: 6px 6px 6px 16px;
        font-size: 13px;

        & + .prop {
          border-top: 1px solid $cool_gray_100;
        }

        &:hover {
          background: $cool_gray_50;
        }
      }

      // The pencil, as in the class's panel: shown on hover, or while it has the focus.
      .edit {
        grid-column: 4;
        display: flex;
        padding: 3px;
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
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .prop:hover .edit,
      .edit:focus-visible {
        visibility: visible;
      }

      .type {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: $cool_gray_500;
      }

      .name {
        min-width: 0;
        color: $cool_gray_900;

        small {
          display: block;
          font-family: 'Roboto Mono', monospace;
          font-size: 11px;
          color: $primary;
        }
      }

      .target {
        color: $cool_gray_500;
      }

      .flags {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .flag {
        font-size: 11px;
        border: 1px solid $cool_gray_300;
        border-radius: 99px;
        padding: 0 7px;
        color: $cool_gray_600;
        white-space: nowrap;

        &.required {
          border-color: $primary;
          color: $primary;
        }
      }

      // "Add property" under an opened card's properties, as in the Data models tab.
      .add-property {
        padding: 2px 8px 6px;
        border-top: 1px solid $cool_gray_100;
      }

      .none {
        margin: 0;
        padding: 8px 16px 10px;
        border-top: 1px solid $cool_gray_100;
        font-size: 13px;
        color: $cool_gray_500;
      }

      [tabindex='0']:focus-visible {
        outline: 2px solid $primary;
        outline-offset: -2px;
      }
    `,
  ],
})
export class DataModelClassCardsComponent {
  readonly rows = input.required<ClassRow[]>();
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

  toggle(iri: string): void {
    const folded = new Set(this.folded());
    if (!folded.delete(iri)) folded.add(iri);
    this.folded.set(folded);
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
