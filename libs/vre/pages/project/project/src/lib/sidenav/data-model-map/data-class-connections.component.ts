import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Constants } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { representationIcon } from '../resource-class-sidenav/representation-icon';
import { DataModelGraph, DataModelNode } from './data-model-graph';

/** At most this many linked classes per side; the rest are counted. */
export const SHOWN_PER_SIDE = 4;

interface Connection {
  node: DataModelNode;
  /** The link properties, or "subclass of", joining it with the class. */
  links: string[];
}

/**
 * The classes linked with one class, as a strip: the classes linking to it on the left, the class in the middle,
 * the classes it links to on the right.
 */
@Component({
  selector: 'app-data-class-connections',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, MatIcon, MatTooltip, NgTemplateOutlet, TranslatePipe],
  template: `
    @let t = 'pages.dataBrowser.dataModelMap';
    @if (centre(); as centre) {
      <section class="strip" data-cy="data-class-connections" [attr.aria-label]="t + '.connections' | translate">
        <span class="heading incoming-heading">
          {{ t + '.linkedFromHeading' | translate }}
          @if (moreIncoming() > 0) {
            · {{ t + '.moreClasses' | translate: { count: moreIncoming() } }}
          }
        </span>
        <span class="heading outgoing-heading">
          {{ t + '.linksToHeading' | translate }}
          @if (moreOutgoing() > 0) {
            · {{ t + '.moreClasses' | translate: { count: moreOutgoing() } }}
          }
        </span>
        <div class="side incoming">
          @if (incoming().length > 0) {
            <ng-container *ngTemplateOutlet="side; context: { $implicit: incoming() }" />
          } @else {
            <span class="none">{{ t + '.noIncoming' | translate }}</span>
          }
        </div>
        <div class="joint in-joint" [class.drawn]="incoming().length > 0"></div>
        <div class="centre">
          <span class="card current" data-cy="data-class-connections-centre">
            <mat-icon>{{ icon(centre) }}</mat-icon>
            <span class="label">{{ centre.label }}</span>
            <span class="count">{{ centre.count ?? 0 | number }}</span>
          </span>
        </div>
        <div class="joint out-joint" [class.drawn]="outgoing().length > 0"></div>
        <div class="side outgoing">
          @if (outgoing().length > 0) {
            <ng-container *ngTemplateOutlet="side; context: { $implicit: outgoing() }" />
          } @else {
            <span class="none">{{ t + '.noOutgoing' | translate }}</span>
          }
        </div>
      </section>
    }

    <ng-template #side let-connections>
      <div class="cards">
        @for (connection of connections; track connection.node.id) {
          @let node = connection.node;
          <button
            type="button"
            class="card"
            data-cy="data-class-connections-card"
            [class.external]="node.kind !== 'class'"
            [attr.aria-disabled]="node.navigable ? null : true"
            [matTooltip]="connection.links.join(', ')"
            (click)="select(node)">
            <mat-icon>{{ icon(node) }}</mat-icon>
            <span class="label">{{ labelOf(node) }}</span>
            @if (node.kind === 'class') {
              <span class="count">{{ node.count ?? 0 | number }}</span>
            }
          </button>
        }
      </div>
    </ng-template>
  `,
  styles: [
    `
      @use '../../../../../../../../../apps/dsp-app/src/styles/config' as *;

      $card-height: 28px;
      $line: 1.5px solid $primary_400;

      :host {
        display: block;
      }

      .strip {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 24px auto 24px minmax(0, 1fr);
        grid-template-areas:
          'in-heading . . . out-heading'
          'incoming in-joint centre out-joint outgoing';
        row-gap: 4px;
        align-items: center;
        padding: 8px 12px 10px;
        background: $cool_gray_50;
        border: 1px solid $cool_gray_200;
        border-radius: 8px;
      }

      .incoming-heading {
        grid-area: in-heading;
      }

      .outgoing-heading {
        grid-area: out-heading;
      }

      .incoming {
        grid-area: incoming;
      }

      .outgoing {
        grid-area: outgoing;
      }

      .centre {
        grid-area: centre;
        display: flex;
      }

      .side {
        min-width: 0;
      }

      .heading,
      .none {
        font-size: 11px;
        line-height: 14px;
        color: $cool_gray_500;
      }

      .cards {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      // The bracket joining the cards of a side, in the gap towards the class in the middle.
      .incoming .cards::after,
      .outgoing .cards::after {
        content: '';
        position: absolute;
        top: calc($card-height / 2);
        bottom: calc($card-height / 2);
        border-left: $line;
      }

      .incoming .cards::after {
        right: -12px;
      }

      .outgoing .cards::after {
        left: -12px;
      }

      .joint {
        align-self: center;
        height: 0;

        &.drawn {
          border-top: $line;
        }
      }

      .in-joint {
        grid-area: in-joint;
        margin-left: 12px;
      }

      .out-joint {
        grid-area: out-joint;
        margin-right: 12px;
      }

      .card {
        position: relative;
        display: flex;
        align-items: center;
        gap: 6px;
        box-sizing: border-box;
        height: $card-height;
        min-width: 0;
        padding: 0 8px;
        border: 1px solid $primary_400;
        border-radius: 6px;
        background: white;
        font: 400 12px/16px var(--font-sans, Roboto, sans-serif);
        color: $cool_gray_800;
        text-align: left;
        cursor: pointer;

        mat-icon {
          flex: none;
          font-size: 14px;
          width: 14px;
          height: 14px;
          color: $primary;
        }

        &:hover {
          border-color: $primary;
        }

        &:focus-visible {
          outline: 2px solid $primary;
          outline-offset: 1px;
        }

        &.external {
          border-style: dashed;
          border-color: $cool_gray_300;
          background: transparent;
          font-style: italic;
          color: $cool_gray_500;

          mat-icon {
            color: $cool_gray_400;
          }
        }

        &[aria-disabled='true'] {
          cursor: default;
        }
      }

      // Each card's tick towards the bracket.
      .incoming .card::after,
      .outgoing .card::before {
        content: '';
        position: absolute;
        top: 50%;
        width: 11px;
        border-top: $line;
      }

      .incoming .card::after {
        right: -12px;
      }

      .outgoing .card::before {
        left: -12px;
      }

      .card.current {
        max-width: 200px;
        border: 2px solid $primary;
        background: $primary;
        color: white;
        font-weight: 500;
        cursor: default;

        mat-icon,
        .count {
          color: $primary_100;
        }
      }

      .label {
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .count {
        flex: none;
        font-size: 11px;
        color: $cool_gray_500;
        font-variant-numeric: tabular-nums;
      }
    `,
  ],
})
export class DataClassConnectionsComponent {
  /** The data model the class belongs to. */
  readonly graph = input.required<DataModelGraph>();
  /** IRI of the class in the middle. */
  readonly classIri = input.required<string>();
  /** Label of the card for links that point at any resource, in the current language. */
  readonly anyResourceLabel = input('Any resource');
  /** Label of a line between a class and its superclass or subclass. */
  readonly subclassLabel = input('subclass of');

  /** A linked class was clicked; emits its IRI. */
  readonly classSelected = output<string>();

  readonly centre = computed(() => this.graph().nodes.find(node => node.id === this.classIri()));

  private readonly _incoming = computed(() => this._connections('incoming'));
  private readonly _outgoing = computed(() => this._connections('outgoing'));
  readonly incoming = computed(() => this._incoming().slice(0, SHOWN_PER_SIDE));
  readonly outgoing = computed(() => this._outgoing().slice(0, SHOWN_PER_SIDE));
  readonly moreIncoming = computed(() => this._incoming().length - this.incoming().length);
  readonly moreOutgoing = computed(() => this._outgoing().length - this.outgoing().length);

  icon(node: DataModelNode): string {
    return node.kind === 'class' ? representationIcon(node.representationClass) : 'link';
  }

  labelOf(node: DataModelNode): string {
    return node.kind === 'generic' && node.id === Constants.Resource ? this.anyResourceLabel() : node.label;
  }

  select(node: DataModelNode): void {
    if (node.navigable) {
      this.classSelected.emit(node.id);
    }
  }

  /** The classes on one side, the ones with the most links first, each named once with all its link labels. */
  private _connections(direction: 'incoming' | 'outgoing'): Connection[] {
    const iri = this.classIri();
    const byId = new Map<string, string[]>();
    for (const edge of this.graph().edges) {
      if (edge.source === edge.target) continue;
      const other =
        direction === 'incoming'
          ? edge.target === iri
            ? edge.source
            : undefined
          : edge.source === iri
            ? edge.target
            : undefined;
      if (!other) continue;
      const label = edge.kind === 'subclass' ? this.subclassLabel() : edge.label;
      const links = byId.get(other) ?? [];
      if (!links.includes(label)) links.push(label);
      byId.set(other, links);
    }
    const nodes = new Map(this.graph().nodes.map(node => [node.id, node]));
    return [...byId]
      .filter(([id]) => nodes.has(id))
      .map(([id, links]) => ({ node: nodes.get(id)!, links }))
      .sort((a, b) => b.links.length - a.links.length || a.node.label.localeCompare(b.node.label));
  }
}
