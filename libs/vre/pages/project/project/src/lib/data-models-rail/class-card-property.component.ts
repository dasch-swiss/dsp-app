import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Cardinality, Constants } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { CardinalityChipComponent } from '../ontology-map/cardinality-chip.component';
import { DATA_MODEL_EDITOR, injectDataModelEditing } from '../ontology-map/data-model-editor';
import { ClassRow } from '../ontology-map/ontology-graph-elements';
import { typeIconOf, typeNameOf } from '../ontology-map/property-types';
import { highlighted } from './highlighted';

export type CardProperty = ClassRow['propertyList'][number];

/** A property's cardinality from whether it is required and may hold several values. */
function cardinalityOf({ required, multiple }: CardProperty): Cardinality {
  if (required) return multiple ? Cardinality._1_n : Cardinality._1;
  return multiple ? Cardinality._0_n : Cardinality._0_1;
}

/**
 * One property of a class card, on one line: value type, label, the class a link points at, local name and cardinality.
 * The link target opens that class's card when it shows. For editors, a pencil on hover edits the property, and a
 * handle, where the card lets it, drags the property to another place in the form order.
 */
@Component({
  selector: 'li[appClassCardProperty]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardinalityChipComponent, CdkDragHandle, MatIcon, MatTooltip, TranslatePipe],
  host: {
    class: 'prop',
    'data-cy': 'data-model-class-card-property',
    '[class.link]': 'linkChips() && !!property().linkTarget',
  },
  template: `
    @let r = 'pages.dataModels2';
    @let property = this.property();
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
    <mat-icon class="type" [attr.aria-label]="typeName()">{{ typeIcon() }}</mat-icon>
    <span class="name" [matTooltip]="tip()" matTooltipShowDelay="600">
      @for (part of label(); track $index) {
        <span [class.hit]="part.match">{{ part.text }}</span>
      }
      @if (property.linkTarget; as target) {
        <!-- Opens the target's card when it shows; plain text when the search hides it, or it is in another model. -->
        @if (linkChips()) {
          <button
            type="button"
            class="target-chip"
            data-cy="data-model-class-card-target"
            [class.off]="!reachable()"
            [disabled]="!reachable()"
            [style.--c]="targetColor() ?? '#9ca3af'"
            (click)="goTo.emit(target)">
            {{ targetLabel() }}
          </button>
        } @else {
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
      }
    </span>
    <span class="local">
      @for (part of local(); track $index) {
        <span [class.hit]="part.match">{{ part.text }}</span>
      }
    </span>
    <app-cardinality-chip
      class="cardinality"
      data-cy="data-model-class-card-cardinality"
      [cardinality]="currentCardinality()"
      [type]="property.type"
      [propertyIri]="property.id"
      [propertyLabel]="property.label"
      [classIri]="classIri()"
      [changeable]="changeable()" />
    <!-- For editors, on hover: the property's dialog, and for the class's own ones, removing it from the class. -->
    @if (canEdit() && editable()) {
      <span class="actions">
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

      // One line: type, label and target, local name, cardinality; the pencil and the handle float over it on hover.
      :host {
        position: relative;
        display: grid;
        grid-template-columns: 16px minmax(0, 1fr) auto 32px;
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

      :host + :host {
        border-top: 1px solid $cool_gray_100;
      }

      .type {
        font-size: 15px;
        width: 15px;
        height: 15px;
        color: $cool_gray_500;
      }

      :host(.link) .type {
        color: $primary;
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

      .target,
      .target-chip {
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

      // A link's target in its family's colour.
      .target-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: 4px;
        padding: 0 7px 0 5px;
        border-radius: 99px;
        background: color-mix(in srgb, var(--c) 22%, white);
        font-size: 11px;
        line-height: 16px;
        color: $cool_gray_900;
        vertical-align: 1px;

        &::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 2px;
          background: var(--c);
        }

        &:not(.off):hover {
          box-shadow: 0 0 0 1px var(--c);
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

      // The handle, in the left margin, on hover.
      .grip {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: $cool_gray_500;
        cursor: grab;
        visibility: hidden;
      }

      // A cardinality that can change is a button: a ring on hover says so.
      button.cardinality {
        padding: 0;
        background: white;
        cursor: pointer;

        &.required {
          background: $primary;
        }

        &:hover {
          box-shadow: 0 0 0 2px $primary_50;
        }
      }

      // The cardinalities in the menu: the notation, then what it means and why one is out of reach.
      .choice {
        code {
          display: inline-block;
          min-width: 30px;
          margin-right: 10px;
          padding: 0 4px;
          border: 1px solid $cool_gray_300;
          border-radius: 4px;
          font:
            500 11.5px 'Roboto Mono',
            monospace;
          text-align: center;
        }

        &.current code {
          background: $primary;
          border-color: $primary;
          color: white;
        }

        small {
          display: block;
          font-size: 11.5px;
          line-height: 1.3;
          color: $cool_gray_500;
        }
      }

      .choice-text {
        display: inline-block;
        vertical-align: middle;
        line-height: 1.3;
      }

      // The pencil and the remove button cover the end of the local name, next to the cardinality, on hover.
      .actions {
        position: absolute;
        top: 50%;
        right: 46px;
        transform: translateY(-50%);
        display: flex;
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
      :host(:hover) .grip,
      .actions:focus-within {
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
  /** Colour per class, its family's, for the target chip. */
  readonly colors = input.required<Map<string, string>>();
  /** Whether the link's target shows as a chip in its family's colour, rather than as "→ class". */
  readonly linkChips = input(false);
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
  readonly targetColor = computed(() => {
    const target = this.property().linkTarget;
    return target ? this.colors().get(target) : undefined;
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
