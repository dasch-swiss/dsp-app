import { Clipboard } from '@angular/cdk/clipboard';
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Cardinality, Constants } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  CardProperty,
  ClassCardPropertyComponent,
  COMFORTABLE_CARD_SIZES,
} from '../data-models-rail/class-card-property.component';
import { DataModelGraph, DataModelProperty } from '../sidenav/data-model-map/data-model-graph';
import { representationIcon } from '../sidenav/resource-class-sidenav/representation-icon';
import { AddPropertyMenuComponent } from './add-property-menu.component';
import { CanDo, DATA_MODEL_EDITOR, injectDataModelEditing } from './data-model-editor';
import { dataModelNameOf, localNameOf } from './ontology-graph-elements';

const CARDINALITY_KEY: Record<Cardinality, string> = {
  [Cardinality._1]: 'required',
  [Cardinality._0_1]: 'optional',
  [Cardinality._0_n]: 'many',
  [Cardinality._1_n]: 'oneOrMore',
};

/** A property of the class as a row of the class cards. */
function cardPropertyOf({ id, label, type, linkTarget, cardinality }: DataModelProperty): CardProperty {
  return {
    id,
    label,
    type,
    ...(linkTarget ? { linkTarget } : {}),
    multiple: cardinality === Cardinality._0_n || cardinality === Cardinality._1_n,
    required: cardinality === Cardinality._1 || cardinality === Cardinality._1_n,
  };
}

/**
 * The details of one class of a data model, docked beside the Ontology map: its description, a small map of the
 * classes it links to and is linked from, and its properties with their types and how many values they take.
 */
@Component({
  selector: 'app-resource-class-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AddPropertyMenuComponent,
    CdkDrag,
    CdkDragPlaceholder,
    CdkDropList,
    ClassCardPropertyComponent,
    NgTemplateOutlet,
    MatButton,
    MatIcon,
    MatIconButton,
    MatTooltip,
    TranslatePipe,
  ],
  host: { '(keydown.escape)': 'closed.emit()' },
  template: `
    @let t = 'pages.ontologyMap.classPanel';
    @if (node(); as node) {
      <section class="panel" data-cy="class-panel" [attr.aria-label]="node.label">
        <header class="header">
          <mat-icon class="class-icon">{{ icon() }}</mat-icon>
          <div class="title">
            <h2 data-cy="class-panel-title">{{ node.label }}</h2>
            @if (elsewhere()) {
              <span class="kind" data-cy="class-panel-kind">{{
                builtIn() ? (t + '.builtIn' | translate) : (t + '.otherModel' | translate: { model: model() })
              }}</span>
            }
            <span class="name-line">
              <code class="name" data-cy="class-panel-name">{{ name() }}</code>
              <button
                type="button"
                class="copy"
                [attr.aria-label]="'pages.ontologyMap.copyName' | translate"
                [matTooltip]="'pages.ontologyMap.copyName' | translate"
                (click)="copyName(classIri())">
                <mat-icon>content_copy</mat-icon>
              </button>
            </span>
          </div>
          <button
            mat-icon-button
            data-cy="class-panel-close"
            [attr.aria-label]="t + '.close' | translate"
            [matTooltip]="t + '.close' | translate"
            (click)="closed.emit()">
            <mat-icon>close</mat-icon>
          </button>
        </header>

        @if (elsewhere()) {
          <!-- A class of another data model, or a built-in one: where it comes from, and how this one uses it. -->
          <p class="description" data-cy="class-panel-elsewhere">
            @if (builtIn()) {
              {{ t + '.builtInText' | translate }}
            } @else {
              {{ t + '.otherModelText' | translate: { current: currentModel(), model: model() } }}
            }
          </p>
        } @else if (node.description) {
          <p class="description">{{ node.description }}</p>
        }

        @if (!elsewhere()) {
          <div class="group">
            <h3>{{ t + '.properties' | translate: { count: properties().length } }}</h3>
            <!-- The rows of the class cards, alike in look and use: the class's own and inherited properties together,
                 in its form order; editors drag its own to another place, change a cardinality, edit or remove a
                 property on hover. -->
            @let drag = reorderable();
            <ng-template #ownList let-list>
              <ul
                class="props"
                cdkDropList
                [cdkDropListDisabled]="!drag"
                (cdkDropListDropped)="dropped(node.id, list, $event)">
                @for (property of list; track property.id) {
                  @let isOwn = ownIds().has(property.id);
                  <li
                    appClassCardProperty
                    cdkDrag
                    cdkDragLockAxis="y"
                    cdkDragBoundary=".props"
                    [cdkDragDisabled]="!drag || !isOwn"
                    [property]="property"
                    [homeIri]="node.id"
                    [labelOf]="labelOfIri"
                    [reachable]="!!property.linkTarget && classIris().has(property.linkTarget)"
                    [canEdit]="canEdit()"
                    [draggable]="drag && isOwn"
                    [classIri]="isOwn ? node.id : undefined"
                    [className]="node.label"
                    (mouseenter)="propertyHovered.emit(property.id)"
                    (mouseleave)="propertyHovered.emit(undefined)"
                    (edit)="editProperty.emit($event)"
                    (remove)="removeProperty(node, property)"
                    (goTo)="showClass($event)">
                    <div class="drop-line" *cdkDragPlaceholder></div>
                  </li>
                }
              </ul>
            </ng-template>
            @if (all().length) {
              <ng-container *ngTemplateOutlet="ownList; context: { $implicit: all() }" />
            } @else {
              <p class="none">{{ 'pages.dataModels2.noProperties' | translate }}</p>
            }
            @if (canEdit()) {
              <div class="add-property">
                <app-add-property-menu [classIri]="classIri()" [row]="true" />
              </div>
            }
          </div>
        }

        <!-- Kept in view at the bottom of the panel, however long the class's properties. -->
        <!-- Editors edit or delete the class; everyone browses its resources. -->
        <div class="actions">
          @if (canEdit() && !elsewhere()) {
            <button mat-flat-button color="primary" data-cy="class-panel-edit" (click)="edit.emit(classIri())">
              <mat-icon>edit</mat-icon>
              {{ t + '.edit' | translate }}
            </button>
            @if (editing?.canDelete) {
              @let check = deleteCheck();
              <!-- Only once the API says nothing uses the class; why not, on hover, when something does. -->
              <span
                [matTooltip]="(check?.canDo ? '' : 'pages.dataModels2.cannotDeleteClass') | translate"
                [matTooltipDisabled]="!check || check.canDo">
                <button
                  mat-stroked-button
                  class="delete"
                  data-cy="class-panel-delete"
                  [disabled]="!check?.canDo"
                  (click)="deleteClass(node)">
                  <mat-icon>delete</mat-icon>
                  {{ 'ui.common.actions.delete' | translate }}
                </button>
              </span>
            }
          }
          <span class="spacer"></span>
          @if (!elsewhere()) {
            <button mat-stroked-button data-cy="class-panel-browse" (click)="browse.emit(classIri())">
              <mat-icon>open_in_new</mat-icon>
              {{ 'pages.ontology.resourceClassInfo.openInstances' | translate }}
            </button>
          } @else if (canOpenModel()) {
            <button
              mat-flat-button
              color="primary"
              data-cy="class-panel-open-model"
              (click)="openInModel.emit(classIri())">
              <mat-icon>open_in_new</mat-icon>
              {{ t + '.openIn' | translate: { model: model() } }}
            </button>
          }
        </div>
      </section>
    }
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      :host {
        display: block;
      }

      .panel {
        box-sizing: border-box;
        height: 100%;
        overflow: auto;
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 18px;
        background: white;
        border-left: 1px solid $cold_grey_50;
        box-shadow: -8px 0 24px rgba($black, 0.08);
        font: 400 13px/20px var(--font-sans, Roboto, sans-serif);
        color: $dark-text;
      }

      .header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .class-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: $primary;
      }

      .title {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;

        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 500;
          line-height: 28px;
        }
      }

      .name-line {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .name {
        padding: 1px 6px;
        border-radius: 4px;
        background: $cool_gray_100;
        font-family: 'Roboto Mono', ui-monospace, monospace;
        font-size: 12px;
        color: $cool_gray_700;
      }

      .copy {
        display: flex;
        padding: 2px;
        border: 0;
        border-radius: 4px;
        background: none;
        color: $cool_gray_500;
        cursor: pointer;

        &:hover {
          background: $cool_gray_100;
        }

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }

      .description {
        margin: 0;
        color: $cool_gray_700;
      }

      .kind {
        font-size: 12px;
        color: $cool_gray_600;
      }

      .group {
        display: flex;
        flex-direction: column;
      }

      h3 {
        margin: 0;
        padding-bottom: 6px;
        font-size: 12px;
        font-weight: 400;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: $cool_gray_500;
      }

      .none {
        margin: 0;
        padding: 6px 0 8px;
        border-top: 1px solid $cool_gray_100;
        font-size: 12.5px;
        color: $cool_gray_500;
      }

      // The cards' rows, across the panel's padding, between lines as on a card.
      // The cards' comfortable sizes.
      .props {
        ${COMFORTABLE_CARD_SIZES}
      }

      .props {
        list-style: none;
        margin: 0 -16px;
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

      .add-property {
        display: block;
        margin: 0 -16px;
        border-top: 1px solid $cool_gray_100;
      }

      // A footer across the panel, against its padding: pushed down when the panel is short, stuck to the bottom when
      // it scrolls.
      .actions {
        position: sticky;
        bottom: -20px;
        margin: auto -24px -20px;
        padding: 12px 24px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: white;
        border-top: 1px solid $cool_gray_200;

        // Deleting, in red, once possible.
        .delete:not([disabled]) {
          color: $red_800;
          border-color: $red_800;
        }

        button {
          --mat-button-filled-container-height: 36px;
          --mat-button-outlined-container-height: 36px;
          flex: none;
          white-space: nowrap;
        }
      }

      .spacer {
        flex: 1;
      }
    `,
  ],
})
export class ResourceClassPanelComponent {
  private readonly _clipboard = inject(Clipboard);
  private readonly _notification = inject(NotificationService);
  private readonly _translate = inject(TranslateService);

  /** The data model the class belongs to. */
  readonly graph = input.required<DataModelGraph>();
  /** IRI of the class to describe. */
  readonly classIri = input.required<string>();
  /** Label of the card for links that point at any resource, in the current language. */
  readonly anyResourceLabel = input('Any resource');
  /** Whether "Edit class" is offered. */
  readonly canEdit = input(false);
  /** A CSS background per class, for the map of its links; see `familyColors`. */
  readonly colors = input<Map<string, string>>(new Map());
  /** The name of the data model shown, for a class of another one to say which uses it. */
  readonly currentModel = input('');
  /** The names of the project's data models, which a class of another one can be opened in. */
  readonly models = input<readonly string[]>([]);

  /** The panel was closed. */
  readonly closed = output<void>();
  /** A linked class was clicked; emits its IRI, to describe it instead. */
  readonly classSelected = output<string>();
  /** "Browse resources" was clicked; emits the class IRI. */
  readonly browse = output<string>();
  /** A property row is hovered; emits its IRI, or `undefined` when the pointer leaves it. */
  readonly propertyHovered = output<string | undefined>();
  /** "Edit class" was clicked; emits the class IRI. */
  readonly edit = output<string>();
  /** A property row's pencil was clicked; emits the property IRI. */
  readonly editProperty = output<string>();
  /** "Open in …" was clicked, on a class of another data model; emits its IRI, to show it in its own. */
  readonly openInModel = output<string>();

  readonly node = computed(() => this.graph().nodes.find(node => node.id === this.classIri()));

  // Only where the app provides the data model editor: without it, nothing here edits.
  readonly editing = inject(DATA_MODEL_EDITOR, { optional: true }) ? injectDataModelEditing() : undefined;
  private readonly _destroyRef = inject(DestroyRef);
  /** What the API says of deleting the class shown; none while it checks. */
  readonly deleteCheck = signal<CanDo | undefined>(undefined);

  constructor() {
    // The data model read again has the dragged order, or not if saving failed: either way it is what shows.
    effect(() => {
      this.graph();
      untracked(() => this._dragged.set(undefined));
    });
    // Each class shown, for editors, is checked once: Delete is offered only when nothing uses it.
    effect(() => {
      const iri = this.classIri();
      const editing = this.editing;
      const check = this.canEdit() && !!editing?.canDelete && !this.elsewhere();
      untracked(() => {
        this.deleteCheck.set(undefined);
        if (!check || !editing) return;
        editing
          .canDeleteClass(iri)
          .pipe(takeUntilDestroyed(this._destroyRef))
          .subscribe(result => {
            if (this.classIri() === iri) this.deleteCheck.set(result);
          });
      });
    });
  }

  /** The class's superclass, whose properties it has. */
  private readonly _parent = computed(() => {
    const graph = this.graph();
    const parent = graph.edges.find(edge => edge.kind === 'subclass' && edge.source === this.classIri())?.target;
    return parent ? graph.nodes.find(node => node.id === parent) : undefined;
  });
  /** The properties the class has from its superclass: removed on the superclass, not here. */
  readonly inherited = computed(() => new Set((this._parent()?.propertyDetails ?? []).map(property => property.id)));

  /** The order a drag gave the class's own properties, shown until the data model is read again. */
  private readonly _dragged = signal<{ classIri: string; order: string[] } | undefined>(undefined);
  /** The class's own properties, as rows of the cards, in their form order. */
  readonly own = computed(() => {
    let own = this.properties()
      .filter(property => !this.inherited().has(property.id))
      .map(cardPropertyOf);
    const dragged = this._dragged();
    if (dragged?.classIri === this.classIri()) {
      own = [...own].sort((a, b) => dragged.order.indexOf(a.id) - dragged.order.indexOf(b.id));
    }
    return own;
  });
  readonly ownIds = computed(() => new Set(this.own().map(property => property.id)));
  /** All its properties, as rows of the cards, in its form order: its own in the dragged order, if any. */
  readonly all = computed(() => {
    const own = [...this.own()];
    return this.properties().map(property =>
      this.ownIds().has(property.id) ? own.shift()! : cardPropertyOf(property)
    );
  });
  /** For editors, where the editor can save a new order. */
  readonly reorderable = computed(() => this.canEdit() && !!this.editing?.canReorder);
  readonly labelOfIri = (iri: string) => this.labelOf(iri);

  /**
   * A property of `list`, the class's own and inherited ones, was dropped elsewhere in it: the class's own properties
   * take the new order, the inherited keeping their places, shown at once, then saved.
   */
  dropped(classIri: string, list: CardProperty[], event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return;
    const moved = list.map(property => property.id);
    moveItemInArray(moved, event.previousIndex, event.currentIndex);
    const order = moved.filter(id => this.ownIds().has(id));
    this._dragged.set({ classIri, order });
    this.editing
      ?.reorderProperties(classIri, order)
      .pipe(takeUntilDestroyed(this._destroyRef))
      // Not saved, the properties go back to their saved order.
      .subscribe(saved => !saved && this._dragged.set(undefined));
  }

  /** Takes the property off the class, once checked and confirmed; the data model is then read again. */
  removeProperty(node: { id: string; label: string }, property: CardProperty): void {
    this.editing
      ?.removeProperty(node.id, property.id, { property: property.label, class: node.label })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe();
  }

  /** Deletes the class once confirmed, then closes the panel. */
  deleteClass(node: { id: string; label: string }): void {
    this.editing
      ?.deleteClass(node.id, node.label)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(deleted => deleted && this.closed.emit());
  }
  readonly properties = computed(() => this.node()?.propertyDetails ?? []);
  /** The data model's classes, which a link target opens. */
  readonly classIris = computed(
    () =>
      new Set(
        this.graph()
          .nodes.filter(node => node.kind === 'class')
          .map(node => node.id)
      )
  );
  readonly name = computed(() => this.nameOf(this.classIri()));
  readonly icon = computed(() => representationIcon(this.node()?.representationClass));

  /** Whether the class belongs to another data model, or comes with DSP: shown, not defined, in this one. */
  readonly elsewhere = computed(() => !!this.node() && this.node()!.kind !== 'class');
  /** The name of the data model it comes from, such as `biblio`. */
  readonly model = computed(() => (this.elsewhere() ? (dataModelNameOf(this.classIri()) ?? '') : ''));
  /** Whether it comes with DSP itself, in knora-api, rather than from a project's data model. */
  readonly builtIn = computed(() => this.classIri().startsWith(Constants.KnoraApiV2));
  /** Whether its data model is one of the project's, so it can be opened there. */
  readonly canOpenModel = computed(() => !this.builtIn() && this.models().includes(this.model()));

  showClass(iri: string): void {
    if (this.isNavigable(iri)) {
      this.classSelected.emit(iri);
    }
  }

  isNavigable(iri: string): boolean {
    return this.graph().nodes.some(node => node.id === iri && node.kind === 'class');
  }

  labelOf(iri: string): string {
    if (iri === Constants.Resource) return this.anyResourceLabel();
    return this.graph().nodes.find(node => node.id === iri)?.label ?? iri.substring(iri.lastIndexOf('#') + 1);
  }

  cardinalityKey(property: DataModelProperty): string {
    return CARDINALITY_KEY[property.cardinality];
  }

  /** The name in the data model, such as `linkToVideo`; for a class of another one, prefixed, as `biblio:Book`. */
  nameOf(iri: string): string {
    return this.elsewhere() && this.model() ? `${this.model()}:${localNameOf(iri)}` : localNameOf(iri);
  }

  copyName(iri: string): void {
    this._clipboard.copy(this.nameOf(iri));
    this._notification.openSnackBar(this._translate.instant('pages.ontologyMap.nameCopied'));
  }
}
