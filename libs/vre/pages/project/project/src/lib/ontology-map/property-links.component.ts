import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** One link the property makes, from a class that has it to the class it points at. */
export interface PropertyLink {
  source: string;
  target: string;
}

/** A class box in the map. */
export interface PropertyLinkEnd {
  id: string;
  label: string;
  navigable: boolean;
}

/** Height of a class box, and the distance between two boxes of a column, in px. */
const BOX = 28;
const ROW = 38;
/** Room above the boxes for the columns' titles. */
const TOP = 28;
/** The columns, `[left, right]` in % of the width. */
const FROM = [0, 38] as const;
const TO = [62, 100] as const;
/** How far left of a box a line stops, in % of the width, for the arrowhead drawn there. */
const ARROW_ROOM = 1.5;

interface Placed extends PropertyLinkEnd {
  /** Middle of its box, from the top, in px. */
  y: number;
}

/**
 * Every link a link property makes, as a small map: the classes that have it on the left, the classes it points at on
 * the right, one line per link. A class clicked is shown instead.
 */
@Component({
  selector: 'app-property-links',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    @let t = 'pages.ontologyMap.propertyPanel';
    <div class="card" data-cy="property-links">
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
        <span class="side-title" [style.left.%]="FROM[0]">{{ t + '.from' | translate }}</span>
        <span class="side-title" [style.right.%]="100 - TO[1]">{{ t + '.pointsTo' | translate }}</span>
        @for (side of sides(); track side.key) {
          @for (place of side.placed; track place.id) {
            <div
              class="node"
              [class]="side.key"
              [style.top.px]="place.y - BOX / 2"
              [style.left.%]="side.column[0]"
              [style.width.%]="side.column[1] - side.column[0]">
              <button
                type="button"
                class="box"
                data-cy="property-link-class"
                [disabled]="!place.navigable"
                [style.background]="colors().get(place.id) ?? '#FFFFFF'"
                (click)="classSelected.emit(place.id)">
                {{ place.label }}
              </button>
              @if (side.key === 'to') {
                <span class="arrow" aria-hidden="true"></span>
              }
            </div>
          }
        }
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
      }

      .node {
        position: absolute;
        display: flex;
      }

      .box {
        flex: 1;
        min-width: 0;
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
        text-align: center;
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

      // The arrowhead where the links meet the class they point at.
      .arrow {
        position: absolute;
        top: ${BOX / 2 - 4}px;
        left: -8px;
        border: 4px solid transparent;
        border-left: 6px solid $cool_gray_400;
        border-right-width: 0;
      }
    `,
  ],
})
export class PropertyLinksComponent {
  protected readonly BOX = BOX;
  protected readonly FROM = FROM;
  protected readonly TO = TO;

  /** The links, each once. */
  readonly links = input.required<PropertyLink[]>();
  /** Label and whether it can be shown, per class at either end. */
  readonly ends = input.required<Map<string, PropertyLinkEnd>>();
  /** A CSS background per class; see `familyColors`. */
  readonly colors = input<Map<string, string>>(new Map());

  /** A class was clicked; emits its IRI. */
  readonly classSelected = output<string>();

  /** The classes on each side, each once: sources by label, targets in the order their links leave, so few cross. */
  private readonly _columns = computed(() => {
    const ends = this.ends();
    const label = (iri: string) => ends.get(iri)?.label ?? iri;
    const from = [...new Set(this.links().map(link => link.source))].sort((a, b) => label(a).localeCompare(label(b)));
    const to = [
      ...new Set(
        from.flatMap(source =>
          this.links()
            .filter(link => link.source === source)
            .map(link => link.target)
        )
      ),
    ];
    return { from, to };
  });

  private readonly _rows = computed(() => Math.max(1, this._columns().from.length, this._columns().to.length));

  readonly height = computed(() => TOP + this._rows() * ROW + 4);

  readonly sides = computed(() => {
    const ends = this.ends();
    const middle = TOP + (this._rows() * ROW) / 2;
    const place = (iris: string[]): Placed[] => {
      // Each column centred on the map, its boxes as far apart as on the fuller column.
      const first = middle - ((iris.length - 1) * ROW) / 2;
      return iris.map((id, i) => ({ ...(ends.get(id) ?? { id, label: id, navigable: false }), y: first + i * ROW }));
    };
    return [
      { key: 'from', column: FROM, placed: place(this._columns().from) },
      { key: 'to', column: TO, placed: place(this._columns().to) },
    ] as const;
  });

  /** One line per link, in the map's units: % across, px down over its height. */
  readonly lines = computed(() => {
    const height = this.height();
    const [from, to] = this.sides();
    const yOf = (placed: readonly Placed[], id: string) => (placed.find(place => place.id === id)?.y ?? 0) / height;
    return this.links().map(link => ({
      x1: FROM[1],
      y1: yOf(from.placed, link.source),
      x2: TO[0] - ARROW_ROOM,
      y2: yOf(to.placed, link.target),
    }));
  });
}
