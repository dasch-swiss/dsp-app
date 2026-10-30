import { Clipboard } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Cardinality, Constants } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { localNameOf, propertyUsage } from './ontology-graph-elements';

const CARDINALITY_KEY: Record<Cardinality, string> = {
  [Cardinality._1]: 'required',
  [Cardinality._0_1]: 'optional',
  [Cardinality._0_n]: 'many',
  [Cardinality._1_n]: 'oneOrMore',
};

/**
 * The details of one link property of a data model, docked beside the Ontology map: its description, the classes it
 * points at, and the classes that have it, each with how many values it takes there.
 */
@Component({
  selector: 'app-property-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatIcon, MatIconButton, MatTooltip, TranslatePipe],
  host: { '(keydown.escape)': 'closed.emit()' },
  template: `
    @let t = 'pages.ontologyMap.propertyPanel';
    @let c = 'pages.ontologyMap.classPanel';
    @if (usage(); as usage) {
      <section class="panel" data-cy="property-panel" [attr.aria-label]="usage.label">
        <header class="header">
          <span class="property-icon"><mat-icon>link</mat-icon></span>
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
            <span class="subtitle">{{ t + '.subtitle' | translate: { model: dataModelLabel() } }}</span>
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

        <div class="facts">
          <div class="fact">
            <h3>{{ t + '.pointsTo' | translate }}</h3>
            <span class="targets">
              @for (target of usage.targets; track target) {
                <button
                  type="button"
                  class="chip"
                  data-cy="property-panel-target"
                  [style.background]="colors().get(target) ?? 'white'"
                  [disabled]="!isNavigable(target)"
                  (click)="classSelected.emit(target)">
                  {{ labelOf(target) }}
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
          <button mat-flat-button color="primary" data-cy="property-panel-filter" (click)="filter.emit(propertyIri())">
            <mat-icon>filter_alt</mat-icon>
            {{ t + '.filter' | translate }}
          </button>
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

      .subtitle {
        font-size: 12px;
        color: $cool_gray_500;
      }

      .description {
        margin: 0;
        color: $cool_gray_700;
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

      .chip {
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 2px 6px 2px 10px;
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 12px;
        font: inherit;
        font-weight: 500;
        color: #1f2937;
        cursor: pointer;

        &:disabled {
          padding-right: 10px;
          cursor: default;
        }

        mat-icon {
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
  /** Name of the data model, for the subtitle. */
  readonly dataModelLabel = input('');
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

  isNavigable(iri: string): boolean {
    return this.graph().nodes.some(node => node.id === iri && node.kind === 'class');
  }

  labelOf(iri: string): string {
    if (iri === Constants.Resource) return this.anyResourceLabel();
    return this.graph().nodes.find(node => node.id === iri)?.label ?? iri.substring(iri.lastIndexOf('#') + 1);
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
