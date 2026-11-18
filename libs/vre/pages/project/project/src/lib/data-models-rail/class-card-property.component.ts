import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Cardinality, Constants } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { CardinalityCheckboxesComponent } from '../ontology-map/cardinality-checkboxes.component';
import { CardinalityChipComponent } from '../ontology-map/cardinality-chip.component';
import { DATA_MODEL_EDITOR, injectDataModelEditing } from '../ontology-map/data-model-editor';
import { ClassRow } from '../ontology-map/ontology-graph-elements';
import { typeIconOf, typeNameOf } from '../ontology-map/property-types';
import { highlighted } from './highlighted';

export type CardProperty = ClassRow['propertyList'][number];

/**
 * How a card shows a property's cardinality: "Multiple values" and "Required" as two columns named once, or with their
 * words on each row, as in the Data models tab; or as before, 0-1, 0-n, 1 or 1-n.
 */
export type CardinalityLayout = 'columns' | 'ticked' | 'rows' | 'chip' | 'differs' | 'bar' | 'symbols' | 'words';

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
@Component({
  selector: 'li[appClassCardProperty]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardinalityCheckboxesComponent,
    CardinalityChipComponent,
    CdkDragHandle,
    MatIcon,
    MatTooltip,
    TranslatePipe,
  ],
  host: {
    class: 'prop',
    '[class.chip-layout]':
      "cardinalityLayout() === 'chip' || cardinalityLayout() === 'differs' || (cardinalityLayout() === 'bar' && chipColumn())",
    '[class.no-chip-column]':
      "(cardinalityLayout() === 'bar' || cardinalityLayout() === 'symbols' || cardinalityLayout() === 'words') && !chipColumn()",
    '[class.stack-layout]': "cardinalityLayout() === 'symbols' && chipColumn()",
    '[class.words-layout]': "cardinalityLayout() === 'words' && chipColumn()",
    'data-cy': 'data-model-class-card-property',
  },
  template: `
    @let r = 'pages.dataModels2';
    @let property = this.property();
    <mat-icon class="type" [attr.aria-label]="typeName()">{{ typeIcon() }}</mat-icon>
    <span class="name" [matTooltip]="tip()" matTooltipShowDelay="600">
      @for (part of label(); track $index) {
        <span [class.hit]="part.match">{{ part.text }}</span>
      }
      <!-- A required property, as forms mark one: a red star after its label. -->
      @if (cardinalityLayout() === 'symbols' && property.required) {
        <span
          class="star"
          [attr.aria-label]="'pages.ontology.cardinality.required' | translate"
          [matTooltip]="'pages.ontology.cardinality.required' | translate"
          >*</span
        >
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
    </span>
    @if (cardinalityLayout() === 'chip' || cardinalityLayout() === 'differs') {
      <app-cardinality-chip
        class="cardinality"
        data-cy="data-model-class-card-cardinality"
        [cardinality]="currentCardinality()"
        [type]="property.type"
        [propertyIri]="property.id"
        [propertyLabel]="property.label"
        [classIri]="classIri()"
        [changeable]="changeable()"
        [quietDefault]="cardinalityLayout() === 'differs'" />
    } @else if (cardinalityLayout() === 'symbols') {
      <!-- Several values allowed: a stack, in a narrow column the card keeps only when one of its properties has it. -->
      @if (chipColumn()) {
        <span class="stack">
          @if (property.multiple) {
            <mat-icon
              data-cy="data-model-class-card-multiple"
              [attr.aria-label]="'pages.ontology.cardinality.multipleValues' | translate"
              [matTooltip]="'pages.ontology.cardinality.multipleValues' | translate"
              >layers</mat-icon
            >
          }
        </span>
      }
    } @else if (cardinalityLayout() === 'words') {
      <!-- In words, only what differs from 0-1: "Required" in red, "Multiple", or both; a card where nothing does
           keeps no column. -->
      @if (chipColumn()) {
        <span class="words" data-cy="data-model-class-card-cardinality">
          @if (property.required) {
            <span class="required-word">{{ r + '.cardinalityRequired' | translate }}</span>
          }
          @if (property.required && property.multiple) {
            ·
          }
          @if (property.multiple) {
            {{ r + '.cardinalityMultiple' | translate }}
          }
        </span>
      }
    } @else if (cardinalityLayout() === 'bar') {
      <!-- Only what differs from 0-1; a 0-1 one changes from the hover tools, below. -->
      @if (!isDefault()) {
        <app-cardinality-chip
          class="cardinality"
          data-cy="data-model-class-card-cardinality"
          [cardinality]="currentCardinality()"
          [type]="property.type"
          [propertyIri]="property.id"
          [propertyLabel]="property.label"
          [classIri]="classIri()"
          [changeable]="changeable()"
          [quietDefault]="true" />
      } @else if (chipColumn()) {
        <span></span>
      }
    } @else {
      <app-cardinality-checkboxes
        class="cardinality"
        data-cy="data-model-class-card-cardinality"
        [cardinality]="currentCardinality()"
        [type]="property.type"
        [propertyIri]="property.id"
        [classIri]="classIri()"
        [changeable]="changeable()"
        [labelled]="cardinalityLayout() === 'rows'"
        [tickedOnly]="cardinalityLayout() === 'ticked'" />
    }
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
        <!-- With the star and the stack: both switch here, last of the row's tools. -->
        @if (changeable() && cardinalityLayout() === 'symbols') {
          <app-cardinality-checkboxes
            class="bar-toggles"
            data-cy="data-model-class-card-cardinality"
            appearance="icons"
            [cardinality]="currentCardinality()"
            [type]="property.type"
            [propertyIri]="property.id"
            [classIri]="classIri()"
            [changeable]="true" />
        }
        <!-- A cardinality not shown at rest (a 0-1, or in words) changes from here, last of the row's tools. -->
        @if (changeable() && ((cardinalityLayout() === 'bar' && isDefault()) || cardinalityLayout() === 'words')) {
          <app-cardinality-chip
            class="bar-chip"
            data-cy="data-model-class-card-cardinality"
            [cardinality]="currentCardinality()"
            [type]="property.type"
            [propertyIri]="property.id"
            [propertyLabel]="property.label"
            [classIri]="classIri()"
            [changeable]="true"
            [quietDefault]="true" />
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
        grid-template-columns: 16px minmax(0, 1fr) auto 128px;
        --actions-right: 142px;
        gap: 6px;
        align-items: center;
        min-height: 26px;
        padding: 1px 8px 1px 16px;
        font-size: 12.5px;
        background: white;

        &:hover {
          background: $cool_gray_50;
        }
      }

      // As before: the chip in a narrow last column.
      :host(.chip-layout) {
        grid-template-columns: 16px minmax(0, 1fr) auto 32px;
        --actions-right: 46px;
      }

      // A card whose properties are all 0-1: no chip column, the local name to the edge, the tools over its end.
      :host(.no-chip-column) {
        grid-template-columns: 16px minmax(0, 1fr) auto;
        --actions-right: 8px;
      }

      // A red star and a stack icon: the stack's narrow column, the tools left of it.
      :host(.stack-layout) {
        grid-template-columns: 16px minmax(0, 1fr) auto 18px;
        --actions-right: 30px;
      }

      .star {
        margin-left: 2px;
        font-weight: 500;
        color: #b3261e;
      }

      .stack {
        display: flex;
        justify-content: center;

        mat-icon {
          font-size: 15px;
          width: 15px;
          height: 15px;
          color: $cool_gray_500;
        }
      }

      // In words, in a column wide enough for "Optional · many".
      :host(.words-layout) {
        grid-template-columns: 16px minmax(0, 1fr) auto 96px;
        --actions-right: 110px;
      }

      .words {
        font-size: 11px;
        text-align: right;
        white-space: nowrap;
        color: $cool_gray_500;
      }

      .required-word {
        font-weight: 500;
        color: #b3261e;
      }

      .bar-toggles {
        margin: 0 2px 0 2px;
      }

      .bar-chip {
        margin: 0 2px 0 4px;
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

      .name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: $cool_gray_900;
      }

      .hit {
        background: #fde68a;
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

      .local {
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: 'Roboto Mono', monospace;
        font-size: 10.5px;
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
        visibility: hidden;
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
          color: #b3261e;
          background: #fdecea;
        }
      }

      :host(:hover) .actions,
      .actions:focus-within,
      .actions:has([aria-expanded='true']) {
        visibility: visible;
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
  /** That class's label, for the remove button. */
  readonly className = input('');
  /** Whether the checkboxes carry their words on each row, or the card names their columns once. */
  readonly cardinalityLayout = input<CardinalityLayout>('columns');
  /** Whether the card keeps a column for the chips: some property on it differs from 0-1. */
  readonly chipColumn = input(true);

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
  readonly isDefault = computed(() => this.currentCardinality() === Cardinality._0_1);

  readonly localName = computed(() => {
    const iri = this.property().id;
    return iri.substring(iri.lastIndexOf('#') + 1);
  });
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
