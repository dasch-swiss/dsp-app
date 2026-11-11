import { Clipboard } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Cardinality, Constants } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { localNameOf, propertyRows, propertyUsage, StandardTerm } from './ontology-graph-elements';
import { PropertyLinkEnd, PropertyLinksComponent } from './property-links.component';
import { typeIconOf, typeNameOf } from './property-types';
import { TabShadePipe } from './tab-shade.pipe';

const CARDINALITY_KEY: Record<Cardinality, string> = {
  [Cardinality._1]: 'required',
  [Cardinality._0_1]: 'optional',
  [Cardinality._0_n]: 'many',
  [Cardinality._1_n]: 'oneOrMore',
};

/**
 * The details of one property of a data model, docked beside the Ontology map: its description, the classes a link
 * points at or a value's type, and the classes that have it, each with how many values it takes there.
 */
@Component({
  selector: 'app-property-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TabShadePipe, MatButton, MatIcon, MatIconButton, MatTooltip, PropertyLinksComponent, TranslatePipe],
  host: { '(keydown.escape)': 'closed.emit()' },
  template: `
    @let t = 'pages.ontologyMap.propertyPanel';
    @let c = 'pages.ontologyMap.classPanel';
    @if (usage(); as usage) {
      <section class="panel" data-cy="property-panel" [attr.aria-label]="usage.label">
        <header class="header">
          <span class="property-icon" [attr.data-type]="usage.type"
            ><mat-icon>{{ typeIcon(usage.type) }}</mat-icon></span
          >
          <div class="title">
            <h2 data-cy="property-panel-title">{{ usage.label }}</h2>
            <span class="name-line">
              <code class="name" data-cy="property-panel-name">{{ nameOf(propertyIri()) }}</code>
              <button
                type="button"
                class="copy"
                [attr.aria-label]="'pages.ontologyMap.copyName' | translate"
                [matTooltip]="'pages.ontologyMap.copyName' | translate"
                (click)="copyName(propertyIri())">
                <mat-icon>content_copy</mat-icon>
              </button>
            </span>
          </div>
          <button
            mat-icon-button
            data-cy="property-panel-close"
            [attr.aria-label]="t + '.close' | translate"
            [matTooltip]="t + '.close' | translate"
            (click)="closed.emit()">
            <mat-icon>close</mat-icon>
          </button>
        </header>

        @if (usage.description) {
          <p class="description">{{ usage.description }}</p>
        }

        <!-- Where it sits among the properties: its parent, the standard terms it maps to, its sub-properties. -->
        @if (lineage(); as lineage) {
          <div class="lineage" data-cy="property-panel-lineage">
            @if (lineage.parent; as parent) {
              <span class="lineage-line">
                <mat-icon>subdirectory_arrow_right</mat-icon>
                <span
                  >{{ t + '.subPropertyOf' | translate }}
                  <button
                    type="button"
                    class="lineage-link"
                    data-cy="property-panel-parent"
                    (click)="propertySelected.emit(parent.id)">
                    {{ parent.label }}</button
                  ><code class="lineage-name">{{ parent.name }}</code></span
                >
              </span>
            }
            @for (term of lineage.terms; track term.iri) {
              <span class="lineage-line" data-cy="property-panel-term">
                <mat-icon>public</mat-icon>
                <span
                  >{{ t + '.standardTerm' | translate }}
                  <code class="term" [title]="term.iri">{{ term.short }}</code>
                  <span class="lineage-muted"
                    >{{ term.vocabulary }}
                    @if (term.through) {
                      · {{ t + '.through' | translate: { property: term.through } }}
                    }
                  </span></span
                >
              </span>
            }
            @if (lineage.subs.length) {
              <span class="lineage-line">
                <mat-icon>account_tree</mat-icon>
                <span
                  >{{ t + '.subProperties' | translate }}
                  @for (sub of lineage.subs; track sub.id; let last = $last) {
                    <button type="button" class="lineage-link" (click)="propertySelected.emit(sub.id)">
                      {{ sub.label }}</button
                    >{{ last ? '' : ',' }}
                  }
                </span>
              </span>
            }
          </div>
        }

        @if (usage.pairs.length) {
          <app-property-links
            [links]="usage.pairs"
            [ends]="ends()"
            [colors]="colors()"
            (classSelected)="classSelected.emit($event)" />
        }

        <div class="facts">
          @if (usage.type === 'Link') {
            <div class="fact">
              <h3>{{ t + '.pointsTo' | translate }}</h3>
              <span class="targets">
                @for (target of usage.targets; track target) {
                  <button
                    type="button"
                    class="chip"
                    data-cy="property-panel-target"
                    [disabled]="!isNavigable(target)"
                    (click)="classSelected.emit(target)">
                    <span
                      class="tab"
                      aria-hidden="true"
                      [style.background]="colors().get(target) | tabShade: 'white'"></span>
                    <span class="chip-label">{{ labelOf(target) }}</span>
                    @if (isNavigable(target)) {
                      <mat-icon>chevron_right</mat-icon>
                    }
                  </button>
                }
              </span>
            </div>
            <div class="fact">
              <h3>{{ t + '.inModel' | translate }}</h3>
              <span class="count">{{ t + '.links' | translate: { count: usage.links } }}</span>
            </div>
          } @else {
            <div class="fact" data-cy="property-panel-type">
              <h3>{{ t + '.type' | translate }}</h3>
              <span class="type" [attr.data-type]="usage.type">
                <mat-icon>{{ typeIcon(usage.type) }}</mat-icon
                >{{ typeName(usage.type) }}
              </span>
            </div>
          }
        </div>

        <div class="group">
          <h3>{{ t + '.usedBy' | translate: { count: usage.users.length } }}</h3>
          @for (user of usage.users; track user.classIri) {
            <div class="user" data-cy="property-panel-user">
              <span class="dot" [style.background]="colors().get(user.classIri) ?? 'white'"></span>
              @if (isNavigable(user.classIri)) {
                <button type="button" class="class-link" (click)="classSelected.emit(user.classIri)">
                  {{ labelOf(user.classIri) }}
                </button>
              } @else {
                <span class="class-name">{{ labelOf(user.classIri) }}</span>
              }
              @if (user.inheritedFrom; as from) {
                <span class="inherited">{{ t + '.inheritedFrom' | translate: { class: labelOf(from) } }}</span>
              }
              @if (user.cardinality !== undefined) {
                <span class="cardinality">{{ c + '.' + cardinalityKey(user.cardinality) | translate }}</span>
              }
            </div>
          }
        </div>

        <div class="actions">
          @if (usage.type === 'Link') {
            <button
              mat-flat-button
              color="primary"
              data-cy="property-panel-filter"
              (click)="filter.emit(propertyIri())">
              <mat-icon>filter_alt</mat-icon>
              {{ t + '.filter' | translate }}
            </button>
          }
          @if (canEdit()) {
            <button mat-stroked-button data-cy="property-panel-edit" (click)="edit.emit(propertyIri())">
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

      .property-icon {
        flex: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #eaeff3;
        color: $primary;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
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

      .lineage {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 10px 12px;
        border: 1px solid $cool_gray_200;
        border-radius: 8px;
        background: $cool_gray_50;
      }

      .lineage-line {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        line-height: 20px;

        mat-icon {
          flex: none;
          margin-top: 2px;
          font-size: 16px;
          width: 16px;
          height: 16px;
          color: $cool_gray_500;
        }
      }

      .lineage-link {
        padding: 0;
        border: 0;
        background: none;
        font: inherit;
        font-weight: 500;
        color: $primary;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }

      .lineage-name {
        margin-left: 6px;
        font-family: 'Roboto Mono', ui-monospace, monospace;
        font-size: 11.5px;
        color: $cool_gray_600;
      }

      .term {
        padding: 0 6px;
        border: 1px solid $cool_gray_300;
        border-radius: 10px;
        background: white;
        font-family: 'Roboto Mono', ui-monospace, monospace;
        font-size: 11.5px;
      }

      .lineage-muted {
        color: $cool_gray_600;
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

      .type {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 15px;
        font-weight: 500;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .facts {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .fact {
        padding: 10px 12px;
        border: 1px solid #ebebeb;
        border-radius: 6px;

        h3 {
          padding-bottom: 6px;
        }
      }

      .targets {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      // A class as the Overview draws it: white, a slate border, its colour in a tab at the left.
      .chip {
        display: flex;
        align-items: stretch;
        gap: 2px;
        padding: 0 6px 0 0;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        overflow: hidden;
        background: white;
        font: inherit;
        font-weight: 500;
        color: #1f2937;
        cursor: pointer;

        .tab {
          flex: none;
          width: 12px;
        }

        .chip-label {
          display: flex;
          align-items: center;
          padding: 2px 0 2px 8px;
        }

        &:disabled {
          padding-right: 10px;
          cursor: default;
        }

        mat-icon {
          align-self: center;
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      .count {
        font-size: 15px;
        font-weight: 500;
      }

      .group {
        display: flex;
        flex-direction: column;
      }

      .user {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        border-top: 1px solid $cool_gray_100;

        &:last-child {
          border-bottom: 1px solid $cool_gray_100;
        }
      }

      .dot {
        flex: none;
        width: 10px;
        height: 10px;
        box-sizing: border-box;
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 50%;
      }

      .class-link,
      .class-name {
        flex: 1;
        min-width: 0;
      }

      .class-link {
        padding: 0;
        border: 0;
        background: none;
        font: inherit;
        text-align: left;
        color: $primary;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }

      .inherited {
        font-size: 11px;
        font-style: italic;
        color: $cool_gray_500;
      }

      .cardinality {
        flex: none;
        font-size: 12px;
        color: $cool_gray_500;
      }

      .actions {
        display: flex;
        gap: 8px;
        padding-top: 4px;
      }
    `,
  ],
})
export class PropertyPanelComponent {
  private readonly _clipboard = inject(Clipboard);
  private readonly _notification = inject(NotificationService);
  private readonly _translate = inject(TranslateService);

  /** The data model, with its subclass relations, so inherited uses are told apart. */
  readonly graph = input.required<DataModelGraph>();
  /** IRI of the link property to describe. */
  readonly propertyIri = input.required<string>();
  /** Colour per class, as the graph draws them. */
  readonly colors = input<Map<string, string>>(new Map());
  /** Label of knora-api's "any resource", in the current language. */
  readonly anyResourceLabel = input('Any resource');
  /** Whether "Edit property" is offered. */
  readonly canEdit = input(false);

  /** The panel was closed. */
  readonly closed = output<void>();
  /** A class was clicked; emits its IRI, to describe it instead. */
  readonly classSelected = output<string>();
  /** "Show only these links" was clicked; emits the property IRI. */
  readonly filter = output<string>();
  /** "Edit property" was clicked; emits the property IRI. */
  readonly edit = output<string>();

  readonly usage = computed(() => propertyUsage(this.graph(), this.propertyIri()));

  /** A property named in the panel was clicked, its parent or a sub-property; emits its IRI, to show it instead. */
  readonly propertySelected = output<string>();

  /**
   * Where the property sits: its parent among the data model's properties, the standard terms it maps to, its own and
   * those it has through its parents, and its sub-properties; none when it has none of these.
   */
  readonly lineage = computed(() => {
    const rows = propertyRows(this.graph());
    const byId = new Map(rows.map(row => [row.id, row]));
    const row = byId.get(this.propertyIri());
    if (!row) return undefined;
    const parent = row.parent ? byId.get(row.parent) : undefined;
    const terms: (StandardTerm & { through?: string })[] = [...row.terms];
    const seen = new Set([row.id]);
    for (let up = parent; up && !seen.has(up.id); up = up.parent ? byId.get(up.parent) : undefined) {
      seen.add(up.id);
      terms.push(
        ...up.terms
          .filter(term => !terms.some(other => other.iri === term.iri))
          .map(term => ({ ...term, through: up!.label }))
      );
    }
    const subs = rows.filter(other => other.parent === row.id);
    if (!parent && !terms.length && !subs.length) return undefined;
    return { parent, terms, subs };
  });

  /** The classes at either end of the property's links, for its map. */
  readonly ends = computed(() => {
    const ends = new Map<string, PropertyLinkEnd>();
    for (const { source, target } of this.usage()?.pairs ?? []) {
      for (const id of [source, target]) ends.set(id, { id, label: this.labelOf(id), navigable: this.isNavigable(id) });
    }
    return ends;
  });

  isNavigable(iri: string): boolean {
    return this.graph().nodes.some(node => node.id === iri && node.kind === 'class');
  }

  labelOf(iri: string): string {
    if (iri === Constants.Resource) return this.anyResourceLabel();
    return this.graph().nodes.find(node => node.id === iri)?.label ?? iri.substring(iri.lastIndexOf('#') + 1);
  }

  typeIcon(type: string): string {
    return typeIconOf(type);
  }

  typeName(type: string): string {
    return typeNameOf(type);
  }

  cardinalityKey(cardinality: Cardinality): string {
    return CARDINALITY_KEY[cardinality];
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
