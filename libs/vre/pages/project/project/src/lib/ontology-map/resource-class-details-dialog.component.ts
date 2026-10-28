import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { DataClassConnectionsComponent } from '../sidenav/data-model-map/data-class-connections.component';
import { DataModelGraph, DataModelProperty } from '../sidenav/data-model-map/data-model-graph';
import { representationIcon } from '../sidenav/resource-class-sidenav/representation-icon';

export interface ResourceClassDetailsDialogData {
  graph: DataModelGraph;
  /** The class to describe first; a linked class clicked in the panel replaces it. */
  classIri: string;
  anyResourceLabel: string;
  subclassLabel: string;
}

const CARDINALITY_KEY: Record<Cardinality, string> = {
  [Cardinality._1]: 'exactlyOne',
  [Cardinality._0_1]: 'atMostOne',
  [Cardinality._0_n]: 'anyNumber',
  [Cardinality._1_n]: 'atLeastOne',
};

/**
 * A side panel describing one class of a data model: its description, resource count, the classes it is linked with
 * and its properties. Closes with the IRI of the class to open in the Data tab, if the user asks for it.
 */
@Component({
  selector: 'app-resource-class-details-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DataClassConnectionsComponent,
    DecimalPipe,
    MatButton,
    MatDialogClose,
    MatIcon,
    MatIconButton,
    MatTooltip,
    TranslatePipe,
  ],
  template: `
    @let t = 'pages.ontologyMap.classDetails';
    @if (node(); as node) {
      <header class="header">
        <mat-icon class="class-icon">{{ icon() }}</mat-icon>
        <div class="title">
          <h2 data-cy="class-details-title">{{ node.label }}</h2>
          @let count = node.count ?? 0;
          <span class="count">
            {{ t + (count === 1 ? '.resourceCountOne' : '.resourceCount') | translate: { count: (count | number) } }}
          </span>
        </div>
        <button
          mat-icon-button
          mat-dialog-close
          data-cy="class-details-close"
          [attr.aria-label]="t + '.close' | translate"
          [matTooltip]="t + '.close' | translate">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <div class="body">
        @if (node.description) {
          <p class="description">{{ node.description }}</p>
        }

        <section>
          <h3>{{ t + '.connections' | translate }}</h3>
          <app-data-class-connections
            [graph]="data.graph"
            [classIri]="classIri()"
            [anyResourceLabel]="data.anyResourceLabel"
            [subclassLabel]="data.subclassLabel"
            (classSelected)="classIri.set($event)" />
        </section>

        <section>
          <h3>{{ t + '.properties' | translate: { count: properties().length } }}</h3>
          @if (properties().length === 0) {
            <p class="none">{{ t + '.noProperties' | translate }}</p>
          } @else {
            <ul class="properties" data-cy="class-details-properties">
              @for (property of properties(); track property.id) {
                <li>
                  <div class="property-line">
                    <span class="property-label">{{ property.label }}</span>
                    <span class="type" [class.link]="property.linkTarget">
                      @if (property.linkTarget) {
                        <mat-icon>arrow_forward</mat-icon>{{ labelOf(property.linkTarget) }}
                      } @else {
                        {{ property.type }}
                      }
                    </span>
                    <span class="cardinality">{{ t + '.' + cardinalityKey(property) | translate }}</span>
                  </div>
                  @if (property.description) {
                    <p class="property-description">{{ property.description }}</p>
                  }
                </li>
              }
            </ul>
          }
        </section>
      </div>

      <footer class="footer">
        <button mat-flat-button color="primary" data-cy="class-details-open" (click)="dialogRef.close(classIri())">
          <mat-icon>list</mat-icon>
          {{ t + '.openInData' | translate }}
        </button>
      </footer>
    }
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: var(--font-sans, Roboto, sans-serif);
      }

      .header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 20px 16px 12px 24px;
        border-bottom: 1px solid $cool_gray_200;
      }

      .class-icon {
        margin-top: 4px;
        color: $primary;
      }

      .title {
        flex: 1;
        min-width: 0;

        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 500;
          line-height: 28px;
        }
      }

      .count {
        font-size: 13px;
        color: $cool_gray_500;
      }

      .body {
        flex: 1;
        overflow-y: auto;
        padding: 16px 24px;
      }

      .description {
        margin: 0 0 20px;
        font-size: 14px;
        line-height: 20px;
        color: $cool_gray_700;
      }

      section + section {
        margin-top: 24px;
      }

      h3 {
        margin: 0 0 8px;
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: $cool_gray_600;
      }

      .none {
        margin: 0;
        font-size: 13px;
        color: $cool_gray_500;
      }

      .properties {
        margin: 0;
        padding: 0;
        list-style: none;

        li {
          padding: 8px 0;
          border-bottom: 1px solid $cool_gray_100;
        }
      }

      .property-line {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
      }

      .property-label {
        flex: 1;
        min-width: 0;
        font-weight: 500;
        color: $cool_gray_800;
      }

      .type {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 0 6px;
        border-radius: 4px;
        background: $cool_gray_100;
        font-size: 12px;
        line-height: 20px;
        color: $cool_gray_700;

        &.link {
          background: $primary_50;
          color: $primary_800;
        }

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }

      .cardinality {
        flex: none;
        width: 92px;
        text-align: right;
        font-size: 12px;
        color: $cool_gray_500;
      }

      .property-description {
        margin: 4px 0 0;
        font-size: 12px;
        line-height: 16px;
        color: $cool_gray_500;
      }

      .footer {
        display: flex;
        justify-content: flex-end;
        padding: 12px 24px;
        border-top: 1px solid $cool_gray_200;
      }
    `,
  ],
})
export class ResourceClassDetailsDialogComponent {
  readonly data = inject<ResourceClassDetailsDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject<MatDialogRef<ResourceClassDetailsDialogComponent, string>>(MatDialogRef);

  readonly classIri = signal(this.data.classIri);
  readonly node = computed(() => this.data.graph.nodes.find(node => node.id === this.classIri()));
  readonly properties = computed(() => this.node()?.propertyDetails ?? []);
  readonly icon = computed(() => representationIcon(this.node()?.representationClass));

  /** A link target's label: a class of the map if it is one, else the end of its IRI. */
  labelOf(iri: string): string {
    const node = this.data.graph.nodes.find(n => n.id === iri);
    return node ? node.label : iri.substring(iri.lastIndexOf('#') + 1);
  }

  cardinalityKey(property: DataModelProperty): string {
    return CARDINALITY_KEY[property.cardinality];
  }
}
