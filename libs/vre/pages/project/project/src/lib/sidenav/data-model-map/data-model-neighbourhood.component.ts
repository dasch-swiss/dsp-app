import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Constants } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { representationIcon } from '../resource-class-sidenav/representation-icon';
import { DataModelGraph, DataModelNode } from './data-model-graph';

/** How many property chips the class card shows before "+N". */
const VISIBLE_PROPERTIES = 4;

interface Neighbour {
  node: DataModelNode;
  /** The labels of the links between the neighbour and the class, "subclass of" included. */
  links: string[];
  /** For a class above: how many classes it links to; below: how many link to it. */
  degree: number;
}

/**
 * One class and the classes directly linked with it: those that link to it above, those it links to below, each
 * line named after its link property.
 */
@Component({
  selector: 'app-data-model-neighbourhood',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, MatIcon, NgTemplateOutlet, TranslatePipe],
  template: `
    @let t = 'pages.dataBrowser.dataModelMap';
    @if (centre(); as centre) {
      <div class="neighbourhood" data-cy="data-model-neighbourhood">
        @if (above().length > 0) {
          <div class="row" role="list" [attr.aria-label]="t + '.linkingHere' | translate">
            @for (neighbour of above(); track neighbour.node.id) {
              <div class="slot" role="listitem">
                <ng-container *ngTemplateOutlet="card; context: { $implicit: neighbour, up: true }" />
                <div class="connector">
                  <span>{{ linkText(neighbour) }}</span>
                </div>
              </div>
            }
          </div>
        }

        <div class="centre" data-cy="data-model-neighbourhood-centre" [attr.aria-current]="'page'">
          <span class="title">
            <mat-icon aria-hidden="true">{{ icon(centre) }}</mat-icon>
            <span class="name">{{ centre.label }}</span>
            <span class="count">{{ centre.count | number }}</span>
          </span>
          @if (centre.description) {
            <span class="description">{{ centre.description }}</span>
          }
          @if (centre.properties?.length) {
            <span class="chips">
              @for (property of visibleProperties(); track $index) {
                <span class="chip">{{ property }}</span>
              }
              @if (hiddenProperties() > 0) {
                <span class="more">+{{ hiddenProperties() }}</span>
              }
            </span>
          }
        </div>

        @if (below().length > 0) {
          <div class="row" role="list" [attr.aria-label]="t + '.linkedFromHere' | translate">
            @for (neighbour of below(); track neighbour.node.id) {
              <div class="slot" role="listitem">
                <div class="connector">
                  <span>{{ linkText(neighbour) }}</span>
                </div>
                <ng-container *ngTemplateOutlet="card; context: { $implicit: neighbour, up: false }" />
              </div>
            }
          </div>
        }

        @if (above().length === 0 && below().length === 0) {
          <span class="no-links">{{ t + '.noLinks' | translate }}</span>
        }
      </div>
    }

    <ng-template #card let-neighbour let-up="up">
      @let node = neighbour.node;
      <button
        type="button"
        class="card"
        data-cy="data-model-neighbourhood-card"
        [class.external]="node.kind !== 'class'"
        [attr.aria-disabled]="node.navigable ? null : true"
        (click)="select(node)">
        <mat-icon aria-hidden="true">{{ icon(node) }}</mat-icon>
        <span class="text">
          <span class="name-line">
            <span class="name">{{ labelOf(node) }}</span>
            @if (node.count !== undefined) {
              <span class="count">{{ node.count | number }}</span>
            }
          </span>
          <span class="hint">
            @if (node.kind === 'external') {
              {{ 'pages.dataBrowser.dataModelMap.external' | translate }}
            } @else if (node.kind === 'class') {
              {{
                'pages.dataBrowser.dataModelMap.' +
                  (up ? 'linksToClasses' : 'linkedFromClasses') +
                  (neighbour.degree === 1 ? 'One' : '') | translate: { count: neighbour.degree }
              }}
            }
          </span>
        </span>
      </button>
    </ng-template>
  `,
  styles: [
    `
      @use '../../../../../../../../../apps/dsp-app/src/styles/config' as *;

      .neighbourhood {
        display: flex;
        flex-direction: column;
        padding: 8px;
        background: $cool_gray_50;
        border: 1px solid $cool_gray_200;
        border-radius: 8px;
      }

      .row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 0 8px;
      }

      .slot {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .connector {
        position: relative;
        height: 32px;

        &::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          border-left: 1.5px solid $primary_400;
        }

        span {
          position: absolute;
          left: calc(50% + 6px);
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          font-size: 11px;
          color: $cool_gray_700;
        }
      }

      .card {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        min-width: 0;
        padding: 6px 10px;
        border: 1px solid $primary_400;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        text-align: left;
        font: 400 11px/16px var(--font-sans, Roboto, sans-serif);
        color: $cool_gray_800;

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
        }

        &[aria-disabled='true'] {
          cursor: default;
        }

        mat-icon {
          flex: none;
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: $primary;
        }
      }

      .text,
      .name-line {
        display: flex;
        min-width: 0;
      }

      .text {
        flex-direction: column;
        flex: 1;
      }

      .name-line {
        gap: 4px;
        align-items: baseline;
      }

      .name {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 13px;
        font-weight: 500;
      }

      .count,
      .hint {
        color: $cool_gray_500;
        font-variant-numeric: tabular-nums;
      }

      .hint {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .centre {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px 12px;
        border: 1px solid $primary;
        border-radius: 8px;
        background: $primary_100;
        font-size: 12px;
        color: $cool_gray_800;

        .title {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: $primary;
        }

        .name {
          flex: 1;
          font-size: 14px;
        }

        .count {
          color: $cool_gray_600;
        }
      }

      .description {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        color: $cool_gray_700;
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .chip {
        max-width: 100%;
        padding: 1px 6px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        border-radius: 4px;
        background: white;
        font-size: 11px;
        color: $cool_gray_700;
      }

      .more {
        font-size: 11px;
        color: $cool_gray_500;
      }

      .no-links {
        padding: 8px 4px 0;
        font-size: 12px;
        color: $cool_gray_500;
      }
    `,
  ],
})
export class DataModelNeighbourhoodComponent {
  /** The data model the class belongs to. */
  readonly graph = input.required<DataModelGraph>();
  /** IRI of the class in the middle. */
  readonly classIri = input.required<string>();
  /** Label for knora-api's "any resource" card, in the current language. */
  readonly anyResourceLabel = input('Any resource');
  /** Label of a subclass line, in the current language. */
  readonly subclassLabel = input('subclass of');

  /** A linked class card was activated; emits the class IRI. */
  readonly classSelected = output<string>();

  readonly centre = computed(() => this.graph().nodes.find(node => node.id === this.classIri()));

  /** Classes that link to the class in the middle. */
  readonly above = computed(() => this._neighbours('above'));
  /** Classes the class in the middle links to. */
  readonly below = computed(() => this._neighbours('below'));

  readonly visibleProperties = computed(() => (this.centre()?.properties ?? []).slice(0, VISIBLE_PROPERTIES));
  readonly hiddenProperties = computed(() => (this.centre()?.properties?.length ?? 0) - VISIBLE_PROPERTIES);

  icon(node: DataModelNode): string {
    return node.kind === 'class' ? representationIcon(node.representationClass) : 'link';
  }

  labelOf(node: DataModelNode): string {
    return node.kind === 'generic' && node.id === Constants.Resource ? this.anyResourceLabel() : node.label;
  }

  linkText(neighbour: Neighbour): string {
    return neighbour.links.join(', ');
  }

  select(node: DataModelNode): void {
    if (node.navigable) {
      this.classSelected.emit(node.id);
    }
  }

  private _neighbours(side: 'above' | 'below'): Neighbour[] {
    const centre = this.classIri();
    const { nodes, edges } = this.graph();
    const ownEnd = side === 'above' ? 'target' : 'source';
    const otherEnd = side === 'above' ? 'source' : 'target';
    const links = new Map<string, string[]>();
    for (const edge of edges) {
      if (edge[ownEnd] !== centre || edge[otherEnd] === centre) continue;
      const label = edge.kind === 'subclass' ? this.subclassLabel() : edge.label;
      links.set(edge[otherEnd], [...new Set([...(links.get(edge[otherEnd]) ?? []), label])]);
    }
    // A class above shows how many classes it links to; a class below, how many link to it.
    const degree = (id: string) => new Set(edges.filter(edge => edge[otherEnd] === id).map(edge => edge[ownEnd])).size;
    return nodes
      .filter(node => links.has(node.id))
      .map(node => ({ node, links: links.get(node.id)!, degree: degree(node.id) }))
      .sort((a, b) => this.labelOf(a.node).localeCompare(this.labelOf(b.node)));
  }
}
