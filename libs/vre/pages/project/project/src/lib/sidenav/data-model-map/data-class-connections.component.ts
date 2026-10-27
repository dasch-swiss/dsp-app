import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Constants } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { DataModelGraph, DataModelNode } from './data-model-graph';

/** At most this many linked classes per side until "more" is clicked. */
export const SHOWN_PER_SIDE = 3;

interface Connection {
  node: DataModelNode;
  /** The link properties, or "subclass of", joining it with the class. */
  links: string[];
}

/**
 * The classes linked with one class, as one line: the classes linking to it, an arrow, the class, an arrow, the
 * classes it links to.
 */
@Component({
  selector: 'app-data-class-connections',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, MatIcon, MatTooltip, NgTemplateOutlet, TranslatePipe],
  template: `
    @let t = 'pages.dataBrowser.dataModelMap';
    @if (centre(); as centre) {
      <nav class="flow" data-cy="data-class-connections" [attr.aria-label]="t + '.connections' | translate">
        @if (allIncoming().length === 0 && allOutgoing().length === 0) {
          <span class="none">{{ t + '.noLinks' | translate }}</span>
        } @else {
          @if (allIncoming().length > 0) {
            <span class="side incoming" [attr.aria-label]="t + '.linkedFromHeading' | translate">
              <ng-container
                *ngTemplateOutlet="side; context: { $implicit: incoming(), more: moreIncoming(), side: 'incoming' }" />
            </span>
            <mat-icon class="arrow" aria-hidden="true">arrow_forward</mat-icon>
          }
          <span class="chip current" data-cy="data-class-connections-centre">{{ centre.label }}</span>
          @if (allOutgoing().length > 0) {
            <mat-icon class="arrow" aria-hidden="true">arrow_forward</mat-icon>
            <span class="side outgoing" [attr.aria-label]="t + '.linksToHeading' | translate">
              <ng-container
                *ngTemplateOutlet="side; context: { $implicit: outgoing(), more: moreOutgoing(), side: 'outgoing' }" />
            </span>
          }
        }
      </nav>
    }

    <ng-template #side let-connections let-more="more" let-sideName="side">
      @for (connection of connections; track connection.node.id) {
        @let node = connection.node;
        <button
          type="button"
          class="chip"
          data-cy="data-class-connections-chip"
          [class.external]="node.kind !== 'class'"
          [attr.aria-disabled]="node.navigable ? null : true"
          [matTooltip]="connection.links.join(', ')"
          (click)="select(node)">
          <span class="label">{{ labelOf(node) }}</span>
          @if (node.kind === 'class') {
            <span class="count">{{ node.count ?? 0 | number }}</span>
          }
        </button>
      }
      @if (more > 0) {
        <button type="button" class="more" (click)="expand(sideName)">
          {{ 'pages.dataBrowser.dataModelMap.moreClasses' | translate: { count: more } }}
        </button>
      }
    </ng-template>
  `,
  styles: [
    `
      @use '../../../../../../../../../apps/dsp-app/src/styles/config' as *;

      :host {
        display: block;
      }

      .flow,
      .side {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }

      .flow {
        font: 400 12px/16px var(--font-sans, Roboto, sans-serif);
        color: $cool_gray_500;
      }

      .arrow {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: $primary_400;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        box-sizing: border-box;
        height: 22px;
        max-width: 220px;
        padding: 0 7px;
        border: 1px solid $primary_300;
        border-radius: 4px;
        background: white;
        font: inherit;
        color: $cool_gray_700;
        cursor: pointer;

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
          font-style: italic;
          color: $cool_gray_500;
        }

        &[aria-disabled='true'] {
          cursor: default;
        }
      }

      .chip.current {
        padding: 0 8px;
        border-color: $primary;
        background: $primary;
        color: white;
        font-weight: 500;
        cursor: default;
      }

      .label {
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .count {
        flex: none;
        color: $cool_gray_500;
        font-variant-numeric: tabular-nums;
      }

      .more {
        padding: 0;
        border: 0;
        background: none;
        font: inherit;
        color: $primary;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }
    `,
  ],
})
export class DataClassConnectionsComponent {
  /** The data model the class belongs to. */
  readonly graph = input.required<DataModelGraph>();
  /** IRI of the class in the middle of the line. */
  readonly classIri = input.required<string>();
  /** Label of the chip for links that point at any resource, in the current language. */
  readonly anyResourceLabel = input('Any resource');
  /** Label of a line between a class and its superclass or subclass. */
  readonly subclassLabel = input('subclass of');

  /** A linked class was clicked; emits its IRI. */
  readonly classSelected = output<string>();

  readonly centre = computed(() => this.graph().nodes.find(node => node.id === this.classIri()));

  /** The sides whose hidden classes the user asked to see, for the class they asked it on. */
  private readonly _expanded = signal<{ iri: string; sides: ReadonlySet<string> }>({ iri: '', sides: new Set() });

  readonly allIncoming = computed(() => this._connections('incoming'));
  readonly allOutgoing = computed(() => this._connections('outgoing'));
  readonly incoming = computed(() => this._shown('incoming', this.allIncoming()));
  readonly outgoing = computed(() => this._shown('outgoing', this.allOutgoing()));
  readonly moreIncoming = computed(() => this.allIncoming().length - this.incoming().length);
  readonly moreOutgoing = computed(() => this.allOutgoing().length - this.outgoing().length);

  labelOf(node: DataModelNode): string {
    return node.kind === 'generic' && node.id === Constants.Resource ? this.anyResourceLabel() : node.label;
  }

  select(node: DataModelNode): void {
    if (node.navigable) {
      this.classSelected.emit(node.id);
    }
  }

  expand(side: 'incoming' | 'outgoing'): void {
    const { iri, sides } = this._expanded();
    const kept = iri === this.classIri() ? sides : new Set<string>();
    this._expanded.set({ iri: this.classIri(), sides: new Set([...kept, side]) });
  }

  private _shown(side: 'incoming' | 'outgoing', all: Connection[]): Connection[] {
    const { iri, sides } = this._expanded();
    return iri === this.classIri() && sides.has(side) ? all : all.slice(0, SHOWN_PER_SIDE);
  }

  /** The classes on one side, the ones with the most links first, each named once with all its link labels. */
  private _connections(direction: 'incoming' | 'outgoing'): Connection[] {
    const iri = this.classIri();
    const byId = new Map<string, string[]>();
    for (const edge of this.graph().edges) {
      if (edge.source === edge.target) continue;
      const near = direction === 'incoming' ? edge.target : edge.source;
      const other = direction === 'incoming' ? edge.source : edge.target;
      if (near !== iri) continue;
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
