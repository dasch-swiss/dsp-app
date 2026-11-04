import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

/** A class linked with the class shown, once, with the properties joining them. */
export interface ClassConnection {
  id: string;
  label: string;
  navigable: boolean;
  /** The link properties joining it with the class, or the subclass label. */
  via: string;
}

/** How many classes each side shows; the others are counted under them. */
export const MAX_CONNECTIONS = 6;

/** Height of a class box and of the line under it naming the link, in px. */
const BOX = 30;
const ROW = 54;
/** Room above the boxes for the sides' titles. */
const TOP = 26;
/** Where the side columns end and the class's column starts, in % of the width. */
const SIDE = 28;
const MIDDLE = 34;
/** How far a side's box sits above the middle of its row. */
const LIFT = 6;

interface Placed extends ClassConnection {
  /** Middle of its box, from the top, in px. */
  y: number;
}

/**
 * The neighbourhood of one class as a small map: the classes linking to it on the left, the class in the middle, the
 * classes it links to on the right, each with the links joining them. A class clicked is shown instead.
 */
@Component({
  selector: 'app-class-connections',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon, MatTooltip, TranslatePipe],
  template: `
    @let t = 'pages.ontologyMap.classPanel';
    <div class="card" data-cy="class-connections">
      <div class="head">
        <mat-icon>hub</mat-icon>
        <span class="title">{{ t + '.connections' | translate }}</span>
        <span class="count">{{
          t + '.connectionCount' | translate: { in: incoming().length, out: outgoing().length }
        }}</span>
      </div>
      <div class="map" [style.height.px]="height()">
        <svg class="lines" aria-hidden="true" viewBox="0 0 100 1" preserveAspectRatio="none" [attr.height]="height()">
          @for (line of lines(); track $index) {
            <line
              vector-effect="non-scaling-stroke"
              [attr.x1]="line.x1"
              [attr.y1]="line.y1"
              [attr.x2]="line.x2"
              [attr.y2]="line.y2" />
          }
        </svg>
        @if (incoming().length || outgoing().length) {
          <span class="side-title left">{{ t + '.linkedFrom' | translate }}</span>
          <span class="side-title right">{{ t + '.linksTo' | translate }}</span>
        } @else {
          <span class="alone">{{ t + '.noConnections' | translate }}</span>
        }
        @for (side of sides(); track side.key) {
          @for (place of side.placed; track place.id) {
            <div class="node" [class]="side.key" [style.top.px]="place.y - BOX / 2">
              <button
                type="button"
                class="box"
                data-cy="class-connection"
                [disabled]="!place.navigable"
                [style.background]="colors().get(place.id) ?? '#FFFFFF'"
                [matTooltip]="place.label"
                (click)="classSelected.emit(place.id)">
                {{ place.label }}
              </button>
              <span class="via" [matTooltip]="place.via">{{
                side.key === 'in' ? (t + '.via' | translate: { property: place.via }) : place.via
              }}</span>
              <span class="arrow" aria-hidden="true"></span>
            </div>
          }
          @if (side.more) {
            <span class="more" [class]="side.key" [style.top.px]="height() - 18">{{
              t + '.more' | translate: { count: side.more }
            }}</span>
          }
        }
        <div class="node center" [style.top.px]="middle() - BOX / 2 - 4">
          <span class="box" [style.background]="colors().get(classIri()) ?? '#FFFFFF'" [matTooltip]="classLabel()">{{
            classLabel()
          }}</span>
          @if (incoming().length) {
            <span class="arrow" aria-hidden="true"></span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      :host {
        display: block;
      }

      .card {
        border: 1px solid $cool_gray_200;
        border-radius: 8px;
        background: $cool_gray_50;
        overflow: hidden;
      }

      .head {
        display: flex;
        align-items: center;
        gap: 8px;
        height: 40px;
        padding: 0 12px;
        border-bottom: 1px solid $cool_gray_200;
        background: white;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: $primary;
        }
      }

      .title {
        flex: 1;
        font-weight: 500;
      }

      .count {
        font-size: 12px;
        color: $cool_gray_500;
      }

      .map {
        position: relative;
        margin: 0 12px;
      }

      .lines {
        position: absolute;
        inset: 0;
        width: 100%;

        line {
          stroke: $cool_gray_400;
          stroke-width: 1.3;
        }
      }

      .side-title {
        position: absolute;
        top: 8px;
        font-size: 11px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: $cool_gray_500;

        &.left {
          left: 0;
        }

        &.right {
          right: 0;
        }
      }

      .node {
        position: absolute;
        width: ${SIDE}%;
        display: flex;
        flex-direction: column;
        align-items: stretch;

        &.in {
          left: 0;
        }

        &.out {
          right: 0;
        }

        &.center {
          left: ${MIDDLE}%;
          right: ${MIDDLE}%;
          width: auto;

          // A long name wraps onto a second line rather than being cut.
          .box {
            height: ${BOX + 8}px;
            padding: 0 6px;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            align-content: center;
            border: 2px solid $cool_gray_800;
            font-size: 13px;
            font-weight: 500;
            line-height: 16px;
            white-space: normal;
            cursor: default;
          }
        }
      }

      .box {
        height: ${BOX}px;
        box-sizing: border-box;
        padding: 0 8px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        font: inherit;
        font-size: 12px;
        font-weight: 500;
        line-height: ${BOX - 2}px;
        color: $cool_gray_800;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
        text-align: center;
      }

      button.box {
        cursor: pointer;

        &:hover:not(:disabled) {
          border-color: $primary;
          box-shadow: 0 0 0 1px $primary;
        }

        &:disabled {
          cursor: default;
          border-style: dashed;
          color: $cool_gray_600;
        }
      }

      .via {
        padding-top: 2px;
        font-size: 11px;
        line-height: 14px;
        color: $cool_gray_600;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      // Arrowheads where the lines meet a box: at the class for links to it, at the other class for links from it.
      .arrow {
        position: absolute;
        top: ${BOX / 2 - 4}px;
        border: 4px solid transparent;
      }

      .node.in .arrow {
        display: none;
      }

      .node.out .arrow {
        left: -8px;
        border-left: 6px solid $cool_gray_400;
        border-right-width: 0;
      }

      .node.center .arrow {
        top: ${(BOX + 8) / 2 - 4}px;
        left: -6px;
        border-left: 6px solid $cool_gray_400;
        border-right-width: 0;
      }

      .more {
        position: absolute;
        width: ${SIDE}%;
        font-size: 11px;
        color: $cool_gray_500;
        text-align: center;

        &.in {
          left: 0;
        }

        &.out {
          right: 0;
        }
      }

      .alone {
        position: absolute;
        left: 0;
        right: 0;
        top: 6px;
        font-size: 12px;
        color: $cool_gray_500;
        text-align: center;
      }
    `,
  ],
})
export class ClassConnectionsComponent {
  protected readonly BOX = BOX;

  /** IRI of the class in the middle. */
  readonly classIri = input.required<string>();
  /** Its label. */
  readonly classLabel = input.required<string>();
  /** The classes linking to it. */
  readonly incoming = input<ClassConnection[]>([]);
  /** The classes it links to. */
  readonly outgoing = input<ClassConnection[]>([]);
  /** A CSS background per class; see `familyColors`. */
  readonly colors = input<Map<string, string>>(new Map());

  /** A linked class was clicked; emits its IRI. */
  readonly classSelected = output<string>();

  private readonly _rows = computed(() =>
    Math.max(1, ...[this.incoming(), this.outgoing()].map(side => Math.min(side.length, MAX_CONNECTIONS)))
  );
  private readonly _more = computed(() =>
    [this.incoming(), this.outgoing()].some(side => side.length > MAX_CONNECTIONS)
  );

  readonly height = computed(() => TOP + this._rows() * ROW + (this._more() ? 18 : 0) + 4);
  readonly middle = computed(() => TOP + (this._rows() * ROW) / 2);

  readonly sides = computed(() =>
    (['in', 'out'] as const).map(key => {
      const all = key === 'in' ? this.incoming() : this.outgoing();
      const shown = all.slice(0, MAX_CONNECTIONS);
      // Each side centred on the class, its rows as far apart as on the fuller side.
      // Boxes sit a little above their row's middle, leaving room for the link's name under them.
      const first = this.middle() - ((shown.length - 1) * ROW) / 2 - LIFT;
      const placed: Placed[] = shown.map((connection, i) => ({ ...connection, y: first + i * ROW }));
      return { key, placed, more: all.length - shown.length };
    })
  );

  /** Lines from each class box to the class in the middle, in the map's units: % across, px down over its height. */
  readonly lines = computed(() => {
    const height = this.height();
    const middle = this.middle();
    return this.sides().flatMap(side =>
      side.placed.map(place => {
        const atSide = { x: side.key === 'in' ? SIDE : 100 - SIDE - 1.5, y: place.y / height };
        const atClass = { x: side.key === 'in' ? MIDDLE - 1.5 : 100 - MIDDLE, y: middle / height };
        return { x1: atSide.x, y1: atSide.y, x2: atClass.x, y2: atClass.y };
      })
    );
  });
}
