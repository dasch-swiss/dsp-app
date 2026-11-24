import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Cardinality, Constants } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { CardinalityCheckboxesComponent } from '../ontology-map/cardinality-checkboxes.component';
import { DATA_MODEL_EDITOR, injectDataModelEditing } from '../ontology-map/data-model-editor';
import { ClassRow, propertyNameOf } from '../ontology-map/ontology-graph-elements';
import { typeIconOf, typeNameOf } from '../ontology-map/property-types';
import { highlighted } from './highlighted';

export type CardProperty = ClassRow['propertyList'][number];

/** A property's cardinality from whether it is required and may hold several values. */
function cardinalityOf({ required, multiple }: CardProperty): Cardinality {
  if (required) return multiple ? Cardinality._1_n : Cardinality._1;
  return multiple ? Cardinality._0_n : Cardinality._0_1;
}

/**
 * One property of a class card, on one line: value type, label, the class a link points at, local name, and its
 * cardinality as the Data models tab shows it, "Multiple values" and "Required" checkboxes.
 * The link target opens that class's card when it shows. For editors, on hover, a pencil edits the property, and a
 * handle left of it, where the card lets it, drags the property to another place in the form order.
 */
/**
 * The comfortable sizes of a card's property rows and their checkboxes, as custom properties for a rule over the rows;
 * without them, the rows are compact.
 */
export const COMFORTABLE_CARD_SIZES = `
  --density-row: 32px;
  --density-pad: 4px;
  --density-label: 13.5px;
  --density-name: 12px;
  --density-texts-gap: 1px;
  --density-check-col: 112px;
  --density-check-layer: 22px;
  --density-check-label: 11.5px;
  // Small boxes, 13px, beside words at their full size.
  --density-check-scale: 0.72;
`;

@Component({
  selector: 'li[appClassCardProperty]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardinalityCheckboxesComponent, CdkDragHandle, MatIcon, MatTooltip, TranslatePipe],
  host: {
    class: 'prop',
    'data-cy': 'data-model-class-card-property',
  },
  template: `
    @let r = 'pages.dataModels2';
    @let property = this.property();
    <mat-icon class="type" [attr.aria-label]="typeName()">{{ typeIcon() }}</mat-icon>
    <!-- The label, its link target after it, and the name under it. -->
    <span class="texts">
      <span class="name" [matTooltip]="tip()" matTooltipShowDelay="600">
        @for (part of label(); track $index) {
          <span [class.hit]="part.match">{{ part.text }}</span>
        }
        @if (property.linkTarget; as target) {
          <!-- Opens the target's card when it shows; plain text when the search hides it, or it is in another model. -->
          <button
            type="button"
            class="target"
            data-cy="data-model-class-card-target"
            [class.off]="!reachable()"
            [disabled]="!reachable()"
            (click)="goTo.emit(target)">
            → {{ targetLabel() }}
          </button>
        }
      </span>
      <span class="local">
        @for (part of local(); track $index) {
          <span [class.hit]="part.match">{{ part.text }}</span>
        }
        <!-- Its description, as the Data models tab gives it: an "i" after the name, while the row is pointed at. -->
        @if (property.description) {
          <mat-icon
            class="info"
            tabindex="0"
            data-cy="data-model-class-card-property-info"
            [attr.aria-label]="property.description"
            [matTooltip]="property.description"
            matTooltipPosition="above"
            >info</mat-icon
          >
        }
      </span>
    </span>
    <app-cardinality-checkboxes
      class="cardinality"
      data-cy="data-model-class-card-cardinality"
      [cardinality]="currentCardinality()"
      [type]="property.type"
      [propertyIri]="property.id"
      [classIri]="classIri()"
      [changeable]="changeable()"
      [labelled]="true" />
    <!-- For editors, on hover: the handle to drag it, the property's dialog, and for the class's own ones, removing it
         from the class. -->
    @if ((canEdit() && editable()) || draggable()) {
      <span class="actions">
        @if (draggable()) {
          <mat-icon
            cdkDragHandle
            class="grip"
            data-cy="data-model-class-card-drag"
            [matTooltip]="r + '.dragToReorder' | translate"
            matTooltipShowDelay="600"
            >drag_indicator</mat-icon
          >
        }
        @if (canEdit() && editable()) {
          <button
            type="button"
            class="edit"
            data-cy="data-model-class-card-edit-property"
            [attr.aria-label]="'pages.ontologyMap.classPanel.editProperty' | translate: { property: property.label }"
            [matTooltip]="'pages.ontologyMap.classPanel.editProperty' | translate: { property: property.label }"
            matTooltipShowDelay="600"
            (click)="edit.emit(property.id)">
            <mat-icon>edit</mat-icon>
          </button>
        }
        @if (changeable()) {
          <button
            type="button"
            class="remove"
            data-cy="data-model-class-card-remove-property"
            [attr.aria-label]="r + '.removeFromClass' | translate: { class: className() }"
            [matTooltip]="r + '.removeFromClass' | translate: { class: className() }"
            matTooltipShowDelay="600"
            (click)="remove.emit(property.id)">
            <mat-icon>remove_circle_outline</mat-icon>
          </button>
        }
      </span>
    }
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      // One line: type, label and target, local name, the two checkboxes; the pencil and the handle float over it on hover.
      :host {
        position: relative;
        display: grid;
        // Sizes from the cards' density (see DataModelClassesComponent), as compact as can be when none is set.
        grid-template-columns: 16px minmax(0, 1fr) calc(var(--density-check-col, 100px) + 4px);
        --actions-right: calc(var(--density-check-col, 100px) + 18px);
        gap: 6px;
        align-items: center;
        min-height: var(--density-row, 26px);
        padding: var(--density-pad, 1px) 8px var(--density-pad, 1px) 16px;
        font-size: var(--density-label, 12.5px);
        background: white;

        &:hover {
          background: $cool_gray_50;
        }
      }

      :host + :host {
        border-top: 1px solid $cool_gray_100;
      }

      .type {
        font-size: 15px;
        width: 15px;
        height: 15px;
        color: $cool_gray_500;
      }

      .texts {
        display: flex;
        flex-direction: column;
        gap: var(--density-texts-gap, 0px);
        min-width: 0;
        padding: 2px 0;
      }

      .name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: $cool_gray_900;
      }

      .hit {
        background: $yellow_200;
        color: inherit;
        border-radius: 2px;
      }

      .target {
        border: 0;
        font: inherit;
        cursor: pointer;

        &.off {
          cursor: inherit;
        }
      }

      .target {
        padding: 0;
        background: none;
        color: $cool_gray_500;

        &:not(.off):hover {
          color: $primary;
          text-decoration: underline;
        }
      }

      // The description's "i" after the name, shown while the row is pointed at, as in the Data models tab.
      .info {
        margin-left: 4px;
        font-size: 14px;
        width: 14px;
        height: 14px;
        vertical-align: -2px;
        color: $primary;
        cursor: help;
        // Transparent, not hidden, so the keyboard still reaches it.
        opacity: 0;
        border-radius: 50%;

        &:focus-visible {
          opacity: 1;
          outline: 2px solid $primary;
          outline-offset: 1px;
        }
      }

      :host(:hover) .info {
        opacity: 1;
      }

      .local {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: 'Roboto Mono', monospace;
        font-size: var(--density-name, 11px);
        line-height: 1.3;
        color: $primary;
      }

      // The handle, left of the pencil, on hover.
      .grip {
        padding: 2px;
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: $cool_gray_500;
        cursor: grab;
      }

      // The handle, the pencil and the remove button cover the end of the local name, next to the checkboxes, on hover.
      .actions {
        position: absolute;
        top: 50%;
        right: var(--actions-right);
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        border-radius: 99px;
        background: $cool_gray_50;
        box-shadow: -10px 0 8px -2px $cool_gray_50;
        // Transparent, not hidden, so Tab still reaches its buttons; it lets clicks through to the name it covers.
        opacity: 0;
        pointer-events: none;
      }

      .edit,
      .remove {
        display: flex;
        padding: 2px;
        border: 0;
        border-radius: 50%;
        background: none;
        cursor: pointer;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      .edit {
        color: $primary;

        &:hover {
          background: $primary_50;
        }
      }

      .remove {
        color: $cool_gray_500;

        &:hover {
          color: $red_800;
          background: $red_50;
        }
      }

      :host(:hover) .actions,
      .actions:focus-within,
      .actions:has([aria-expanded='true']) {
        opacity: 1;
        pointer-events: auto;
      }

      button:focus-visible {
        outline: 2px solid $primary;
        outline-offset: 1px;
      }
    `,
  ],
})
export class ClassCardPropertyComponent {
  readonly property = input.required<CardProperty>();
  /** A class's label from its IRI, for the link target. */
  readonly labelOf = input.required<(iri: string) => string>();
  /** Whether the target's card shows, so the target can open it. */
  readonly reachable = input(false);
  /** The text searched for, marked where it shows. */
  readonly query = input('');
  readonly canEdit = input(false);
  /** Whether the property can be dragged to another place: the class's own ones, for editors. */
  readonly draggable = input(false);
  /** The class the row is on, when it is the class's own property: its cardinality and removal can change then. */
  readonly classIri = input<string | undefined>(undefined);
  /** The class whose card or panel the row is on, own property or inherited, to tell another data model's by. */
  readonly homeIri = input<string | undefined>(undefined);
  /** That class's label, for the remove button. */
  readonly className = input('');

  readonly edit = output<string>();
  /** The link target was clicked: its card is to show. */
  readonly goTo = output<string>();
  /** The remove button was clicked: the property is to come off the class, once checked and confirmed. */
  readonly remove = output<string>();

  // Only where the app provides the data model editor: without it, nothing here edits.
  private readonly _editing = inject(DATA_MODEL_EDITOR, { optional: true }) ? injectDataModelEditing() : undefined;
  /** Whether the cardinality and the class's hold on the property can change here: for editors, on its own properties. */
  readonly changeable = computed(
    () => this.canEdit() && this.editable() && !!this.classIri() && !!this._editing?.canDelete
  );
  readonly currentCardinality = computed(() => cardinalityOf(this.property()));

  /** Its name, prefixed by its data model's when that is not the card's class's, as `biblio:hasTitle`. */
  readonly localName = computed(() => propertyNameOf(this.property().id, this.homeIri()));
  readonly label = computed(() => highlighted(this.property().label, this.query()));
  readonly local = computed(() => highlighted(this.localName(), this.query()));
  readonly targetLabel = computed(() => {
    const target = this.property().linkTarget;
    return target ? this.labelOf()(target) : '';
  });
  /** The whole line, for when the card is too narrow for it. */
  readonly tip = computed(() => {
    const target = this.targetLabel();
    return `${this.property().label}${target ? ` → ${target}` : ''} (${this.localName()})`;
  });
  readonly typeIcon = computed(() => typeIconOf(this.property().type));
  readonly typeName = computed(() => typeNameOf(this.property().type));
  /** Whether the property is the data model's own, rather than built in, so it can be edited here. */
  readonly editable = computed(() => !this.property().id.startsWith(Constants.KnoraApiV2));
}
