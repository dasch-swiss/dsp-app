import { Clipboard } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Cardinality, Constants } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DataModelGraph, DataModelProperty } from '../sidenav/data-model-map/data-model-graph';
import { representationIcon } from '../sidenav/resource-class-sidenav/representation-icon';
import { ClassConnection, ClassConnectionsComponent } from './class-connections.component';
import { localNameOf } from './ontology-graph-elements';
import { typeIconOf, typeNameOf } from './property-types';

const CARDINALITY_KEY: Record<Cardinality, string> = {
  [Cardinality._1]: 'required',
  [Cardinality._0_1]: 'optional',
  [Cardinality._0_n]: 'many',
  [Cardinality._1_n]: 'oneOrMore',
};

/**
 * The details of one class of a data model, docked beside the Ontology map: its description, a small map of the
 * classes it links to and is linked from, and its properties with their types and how many values they take.
 */
@Component({
  selector: 'app-resource-class-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ClassConnectionsComponent, MatButton, MatIcon, MatIconButton, MatTooltip, TranslatePipe],
  host: { '(keydown.escape)': 'closed.emit()' },
  template: `
    @let t = 'pages.ontologyMap.classPanel';
    @if (node(); as node) {
      <section class="panel" data-cy="class-panel" [attr.aria-label]="node.label">
        <header class="header">
          <mat-icon class="class-icon">{{ icon() }}</mat-icon>
          <div class="title">
            <h2 data-cy="class-panel-title">{{ node.label }}</h2>
            <span class="name-line">
              <code class="name" data-cy="class-panel-name">{{ nameOf(classIri()) }}</code>
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

        @if (node.description) {
          <p class="description">{{ node.description }}</p>
        }

        <app-class-connections
          [classIri]="classIri()"
          [classLabel]="node.label"
          [incoming]="incoming()"
          [outgoing]="outgoing()"
          [colors]="colors()"
          (classSelected)="showClass($event)" />

        <div class="group">
          <h3>{{ t + '.properties' | translate: { count: properties().length } }}</h3>
          @if (properties().length === 0) {
            <p class="none">{{ t + '.noProperties' | translate }}</p>
          }
          @for (property of properties(); track property.id) {
            @let open = openProperty() === property.id;
            <div
              class="property"
              [class.open]="open"
              data-cy="class-panel-property"
              (mouseenter)="propertyHovered.emit(property.id)"
              (mouseleave)="propertyHovered.emit(undefined)">
              <div class="property-line">
                <button
                  type="button"
                  class="property-toggle"
                  [disabled]="!property.description"
                  [attr.aria-expanded]="property.description ? open : null"
                  (click)="toggle(property)">
                  <mat-icon class="type-icon" [attr.data-type]="property.type">{{ typeIcon(property) }}</mat-icon>
                  <span class="property-label">{{ property.label }}</span>
                </button>
                @if (property.linkTarget; as target) {
                  <button
                    type="button"
                    class="value link"
                    [disabled]="!isNavigable(target)"
                    (click)="showClass(target)">
                    → {{ labelOf(target) }} · {{ t + '.' + cardinalityKey(property) | translate }}
                  </button>
                } @else {
                  <span class="value" [attr.data-type]="property.type">
                    {{ typeName(property) }} · {{ t + '.' + cardinalityKey(property) | translate }}
                  </span>
                }
                @if (canEdit() && isEditable(property)) {
                  <button
                    type="button"
                    class="edit-property"
                    data-cy="class-panel-edit-property"
                    [attr.aria-label]="t + '.editProperty' | translate: { property: property.label }"
                    [matTooltip]="t + '.editProperty' | translate: { property: property.label }"
                    (click)="editProperty.emit(property.id)">
                    <mat-icon>edit</mat-icon>
                  </button>
                }
              </div>
              @if (open && property.description) {
                <p class="property-description">{{ property.description }}</p>
              }
            </div>
          }
        </div>

        <!-- Kept in view at the bottom of the panel, however long the class's properties. -->
        <div class="actions">
          <button mat-flat-button color="primary" data-cy="class-panel-browse" (click)="browse.emit(classIri())">
            <mat-icon>view_list</mat-icon>
            {{ t + '.browse' | translate }}
          </button>
          <span class="spacer"></span>
          <button
            mat-stroked-button
            data-cy="class-panel-filter"
            [matTooltip]="t + '.filterHint' | translate"
            (click)="filter.emit(classIri())">
            <mat-icon>filter_alt</mat-icon>
            {{ t + '.filter' | translate }}
          </button>
          @if (canEdit()) {
            <button mat-stroked-button data-cy="class-panel-edit" (click)="edit.emit(classIri())">
              <mat-icon>edit</mat-icon>
              {{ t + '.edit' | translate }}
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
        border-left: 1px solid #ebebeb;
        box-shadow: -8px 0 24px rgba(0, 0, 0, 0.08);
        font: 400 13px/20px var(--font-sans, Roboto, sans-serif);
        color: rgba(0, 0, 0, 0.87);
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
        color: $cool_gray_500;
      }

      .property {
        border-top: 1px solid $cool_gray_100;

        &.open {
          margin: 0 -10px;
          padding: 0 10px 8px;
          border-top-color: transparent;
          border-radius: 4px;
          background: #f1f5fa;

          .property-label {
            font-weight: 500;
          }
        }
      }

      .property-line {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
      }

      .property-toggle,
      .link,
      .class-link {
        padding: 0;
        border: 0;
        background: none;
        font: inherit;
        text-align: left;
      }

      .property-toggle {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        color: inherit;
        cursor: pointer;

        &:disabled {
          cursor: default;
        }
      }

      .type-icon {
        flex: none;
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: $cool_gray_500;

        &[data-type='Link'] {
          color: $primary;
        }

        &[data-type='List'] {
          color: #92400e;
        }
      }

      .property-label {
        flex: 1;
        min-width: 0;
      }

      .value {
        flex: none;
        font-size: 12px;
        color: $cool_gray_500;

        &[data-type='List'] {
          color: #92400e;
        }
      }

      .link,
      .class-link {
        color: $primary;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }

        &:disabled {
          color: $cool_gray_500;
          cursor: default;
          text-decoration: none;
        }
      }

      // A pencil at the end of the row, shown while the row is hovered or has focus; its room is kept, so the row's
      // texts do not move.
      .edit-property {
        flex: none;
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

      .property:hover .edit-property,
      .property:focus-within .edit-property {
        visibility: visible;
      }

      .property-description {
        margin: 0;
        padding-left: 24px;
        font-size: 12px;
        line-height: 18px;
        color: $cool_gray_600;
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
  /** Label of a relation between a class and its superclass or subclass. */
  readonly subclassLabel = input('subclass of');
  /** Whether "Edit class" is offered. */
  readonly canEdit = input(false);
  /** A CSS background per class, for the map of its links; see `familyColors`. */
  readonly colors = input<Map<string, string>>(new Map());

  /** The panel was closed. */
  readonly closed = output<void>();
  /** A linked class was clicked; emits its IRI, to describe it instead. */
  readonly classSelected = output<string>();
  /** "Browse resources" was clicked; emits the class IRI. */
  readonly browse = output<string>();
  /** A property row is hovered; emits its IRI, or `undefined` when the pointer leaves it. */
  readonly propertyHovered = output<string | undefined>();
  /** "Filter on this class" was clicked; emits the class IRI, to show it with the classes it is linked with. */
  readonly filter = output<string>();
  /** "Edit class" was clicked; emits the class IRI. */
  readonly edit = output<string>();
  /** A property row's pencil was clicked; emits the property IRI. */
  readonly editProperty = output<string>();

  readonly node = computed(() => this.graph().nodes.find(node => node.id === this.classIri()));
  readonly properties = computed(() => this.node()?.propertyDetails ?? []);
  readonly icon = computed(() => representationIcon(this.node()?.representationClass));

  /** The property whose description is shown, for the class it was opened on. */
  private readonly _open = signal<{ classIri: string; propertyId: string } | undefined>(undefined);
  readonly openProperty = computed(() => {
    const open = this._open();
    return open?.classIri === this.classIri() ? open.propertyId : undefined;
  });

  readonly incoming = computed(() => this._connections('incoming'));
  readonly outgoing = computed(() => this._connections('outgoing'));

  toggle(property: DataModelProperty): void {
    if (!property.description) return;
    this._open.set(
      this.openProperty() === property.id ? undefined : { classIri: this.classIri(), propertyId: property.id }
    );
  }

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

  /** Whether the property belongs to a data model, which the project can edit, rather than to knora-api. */
  isEditable(property: DataModelProperty): boolean {
    return !property.id.startsWith(Constants.KnoraApiV2);
  }

  typeIcon(property: DataModelProperty): string {
    return typeIconOf(property.type);
  }

  typeName(property: DataModelProperty): string {
    return typeNameOf(property.type);
  }

  cardinalityKey(property: DataModelProperty): string {
    return CARDINALITY_KEY[property.cardinality];
  }

  /** The classes on one side, each once, with the properties joining them. */
  private _connections(direction: 'incoming' | 'outgoing'): ClassConnection[] {
    const iri = this.classIri();
    const via = new Map<string, string[]>();
    for (const edge of this.graph().edges) {
      if (edge.source === edge.target) continue;
      const [near, other] = direction === 'incoming' ? [edge.target, edge.source] : [edge.source, edge.target];
      if (near !== iri) continue;
      const label = edge.kind === 'subclass' ? this.subclassLabel() : edge.label;
      const labels = via.get(other) ?? [];
      if (!labels.includes(label)) labels.push(label);
      via.set(other, labels);
    }
    return [...via].map(([id, labels]) => ({
      id,
      label: this.labelOf(id),
      navigable: this.isNavigable(id),
      via: labels.join(', '),
    }));
  }

  /** The name in the data model, such as `linkToVideo`. */
  nameOf(iri: string): string {
    return localNameOf(iri);
  }

  copyName(iri: string): void {
    this._clipboard.copy(localNameOf(iri));
    this._notification.openSnackBar(this._translate.instant('pages.ontologyMap.nameCopied'));
  }
}
