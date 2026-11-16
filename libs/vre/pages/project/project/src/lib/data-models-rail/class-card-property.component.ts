import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Constants } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { ClassRow } from '../ontology-map/ontology-graph-elements';
import { typeIconOf, typeNameOf } from '../ontology-map/property-types';
import { highlighted } from './highlighted';

export type CardProperty = ClassRow['propertyList'][number];

/**
 * One property of a class card, on one line: value type, label, the class a link points at, local name and cardinality.
 * The link target opens that class's card when it shows. For editors, a pencil on hover edits the property, and a
 * handle, where the card lets it, drags the property to another place in the form order.
 */
@Component({
  selector: 'li[appClassCardProperty]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDragHandle, MatIcon, MatTooltip, TranslatePipe],
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
    <span
      class="cardinality"
      data-cy="data-model-class-card-cardinality"
      [class.required]="property.required"
      [matTooltip]="r + '.cardinality.' + cardinalityKey() | translate">
      {{ cardinality() }}
    </span>
    <!-- For editors, on hover: the property's dialog; built-in properties are not edited here. -->
    @if (canEdit() && editable()) {
      <button
        type="button"
        class="edit"
        data-cy="data-model-class-card-edit-property"
        [attr.aria-label]="'pages.ontologyMap.classPanel.editProperty' | translate: { property: property.label }"
        (click)="edit.emit(property.id)">
        <mat-icon>edit</mat-icon>
      </button>
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

      // The pencil covers the end of the local name, next to the cardinality, on the row's hover colour.
      .edit {
        position: absolute;
        top: 50%;
        right: 46px;
        transform: translateY(-50%);
        display: flex;
        padding: 2px;
        border: 0;
        border-radius: 50%;
        background: $cool_gray_50;
        box-shadow: -10px 0 8px -2px $cool_gray_50;
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

      :host(:hover) .edit,
      :host(:hover) .grip,
      .edit:focus-visible {
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

  readonly edit = output<string>();
  /** The link target was clicked: its card is to show. */
  readonly goTo = output<string>();

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
  /** The cardinality as the data model writes it: 1, 0-1, 1-n or 0-n. */
  readonly cardinality = computed(() => {
    const { required, multiple } = this.property();
    return `${required ? 1 : 0}${multiple ? '-n' : required ? '' : '-1'}`;
  });
  /** The translation key, under `pages.dataModels2.cardinality`, that says the cardinality in words. */
  readonly cardinalityKey = computed(() => {
    const { required, multiple } = this.property();
    return `${required ? 'required' : 'optional'}${multiple ? 'Multiple' : 'One'}`;
  });
  /** Whether the property is the data model's own, rather than built in, so it can be edited here. */
  readonly editable = computed(() => !this.property().id.startsWith(Constants.KnoraApiV2));
}
