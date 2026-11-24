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
  styleUrl: './class-card-property.component.css',
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
