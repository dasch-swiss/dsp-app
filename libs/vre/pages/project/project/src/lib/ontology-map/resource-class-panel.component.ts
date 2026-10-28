import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Cardinality, Constants } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { DataModelGraph, DataModelProperty } from '../sidenav/data-model-map/data-model-graph';
import { representationIcon } from '../sidenav/resource-class-sidenav/representation-icon';

const CARDINALITY_KEY: Record<Cardinality, string> = {
  [Cardinality._1]: 'required',
  [Cardinality._0_1]: 'optional',
  [Cardinality._0_n]: 'many',
  [Cardinality._1_n]: 'oneOrMore',
};

/** Material icon per value type; types not named here show a generic one. */
const TYPE_ICON: Record<string, string> = {
  Text: 'short_text',
  Link: 'link',
  List: 'arrow_drop_down_circle',
  Date: 'event',
  Time: 'schedule',
  Uri: 'public',
  Int: 'pin',
  Decimal: 'pin',
  Boolean: 'check_box',
  Color: 'palette',
  Geoname: 'place',
  Interval: 'timelapse',
  Geom: 'category',
};

/** Shown names for value types whose local name reads poorly. */
const TYPE_NAME: Record<string, string> = { Uri: 'URI', Int: 'Integer', Geom: 'Geometry' };

interface Connection {
  id: string;
  label: string;
  navigable: boolean;
  /** The link properties joining it with the class, or the subclass label. */
  via: string;
}

/**
 * The details of one class of a data model, docked beside the Ontology map: its description, its properties with
 * their types and how many values they take, and the classes it links to and is linked from.
 */
@Component({
  selector: 'app-resource-class-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatIcon, MatIconButton, MatTooltip, TranslatePipe],
  host: { '(keydown.escape)': 'closed.emit()' },
  template: `
    @let t = 'pages.ontologyMap.classPanel';
    @if (node(); as node) {
      <section class="panel" data-cy="class-panel" [attr.aria-label]="node.label">
        <header class="header">
          <mat-icon class="class-icon">{{ icon() }}</mat-icon>
          <div class="title">
            <h2 data-cy="class-panel-title">{{ node.label }}</h2>
            <span class="subtitle">{{ t + '.subtitle' | translate: { model: dataModelLabel() } }}</span>
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

        <div class="group">
          <h3>{{ t + '.properties' | translate: { count: properties().length } }}</h3>
          @if (properties().length === 0) {
            <p class="none">{{ t + '.noProperties' | translate }}</p>
          }
          @for (property of properties(); track property.id) {
            @let open = openProperty() === property.id;
            <div class="property" [class.open]="open" data-cy="class-panel-property">
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
              </div>
              @if (open && property.description) {
                <p class="property-description">{{ property.description }}</p>
              }
            </div>
          }
        </div>

        @for (side of sides(); track side.key) {
          <div class="group">
            <h3>{{ t + '.' + side.key | translate }}</h3>
            <p class="connections">
              @for (connection of side.connections; track connection.id; let last = $last) {
                @if (connection.navigable) {
                  <button type="button" class="class-link" (click)="showClass(connection.id)">
                    {{ connection.label }}
                  </button>
                } @else {
                  <span class="class-name">{{ connection.label }}</span>
                }
                @if (connection.via) {
                  <span class="via">{{ t + '.via' | translate: { property: connection.via } }}</span>
                }
                @if (!last) {
                  <span class="separator" aria-hidden="true">·</span>
                }
              } @empty {
                <span class="none">{{ t + '.none' | translate }}</span>
              }
            </p>
          </div>
        }

        <div class="actions">
          <button mat-flat-button color="primary" data-cy="class-panel-browse" (click)="browse.emit(classIri())">
            {{ t + '.browse' | translate }}
          </button>
          <button mat-stroked-button data-cy="class-panel-filter" (click)="filter.emit(classIri())">
            <mat-icon>filter_alt</mat-icon>
            {{ t + '.filter' | translate }}
          </button>
          @if (canEdit()) {
            <button mat-stroked-button data-cy="class-panel-edit" (click)="edit.emit(classIri())">
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

      .subtitle {
        font-size: 12px;
        color: $cool_gray_500;
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

      .property-description {
        margin: 0;
        padding-left: 24px;
        font-size: 12px;
        line-height: 18px;
        color: $cool_gray_600;
      }

      .connections {
        margin: 0;
      }

      .via,
      .separator {
        margin-left: 4px;
        color: $cool_gray_500;
      }

      .separator {
        margin-right: 4px;
      }

      .actions {
        display: flex;
        gap: 8px;
        padding-top: 4px;
      }
    `,
  ],
})
export class ResourceClassPanelComponent {
  /** The data model the class belongs to. */
  readonly graph = input.required<DataModelGraph>();
  /** IRI of the class to describe. */
  readonly classIri = input.required<string>();
  /** Name of the data model, for the subtitle. */
  readonly dataModelLabel = input('');
  /** Label of the card for links that point at any resource, in the current language. */
  readonly anyResourceLabel = input('Any resource');
  /** Label of a relation between a class and its superclass or subclass. */
  readonly subclassLabel = input('subclass of');
  /** Whether "Edit class" is offered. */
  readonly canEdit = input(false);

  /** The panel was closed. */
  readonly closed = output<void>();
  /** A linked class was clicked; emits its IRI, to describe it instead. */
  readonly classSelected = output<string>();
  /** "Browse resources" was clicked; emits the class IRI. */
  readonly browse = output<string>();
  /** "Filter on this class" was clicked; emits the class IRI, to show it with the classes it is linked with. */
  readonly filter = output<string>();
  /** "Edit class" was clicked; emits the class IRI. */
  readonly edit = output<string>();

  readonly node = computed(() => this.graph().nodes.find(node => node.id === this.classIri()));
  readonly properties = computed(() => this.node()?.propertyDetails ?? []);
  readonly icon = computed(() => representationIcon(this.node()?.representationClass));

  /** The property whose description is shown, for the class it was opened on. */
  private readonly _open = signal<{ classIri: string; propertyId: string } | undefined>(undefined);
  readonly openProperty = computed(() => {
    const open = this._open();
    return open?.classIri === this.classIri() ? open.propertyId : undefined;
  });

  readonly sides = computed(() => [
    { key: 'linksTo', connections: this._connections('outgoing') },
    { key: 'linkedFrom', connections: this._connections('incoming') },
  ]);

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

  typeIcon(property: DataModelProperty): string {
    return TYPE_ICON[property.type] ?? 'label';
  }

  typeName(property: DataModelProperty): string {
    return TYPE_NAME[property.type] ?? property.type;
  }

  cardinalityKey(property: DataModelProperty): string {
    return CARDINALITY_KEY[property.cardinality];
  }

  /** The classes on one side, each once, with the properties joining them. */
  private _connections(direction: 'incoming' | 'outgoing'): Connection[] {
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
}
