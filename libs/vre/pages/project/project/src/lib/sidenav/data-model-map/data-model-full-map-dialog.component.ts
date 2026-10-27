import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { DataModelGraph } from './data-model-graph';
import { DataModelMapComponent } from './data-model-map.component';

export interface DataModelFullMapDialogData {
  /** Name of the data model. */
  title: string;
  graph: DataModelGraph;
  selectedIri?: string;
  anyResourceLabel: string;
}

/** The whole-model map, drawn large over the page. Closes with the IRI of the class clicked, if any. */
@Component({
  selector: 'app-data-model-full-map-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DataModelMapComponent,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatIcon,
    MatIconButton,
    MatTooltip,
    TranslatePipe,
  ],
  template: `
    @let t = 'pages.dataBrowser.dataModelMap';
    <div class="title-row">
      <h2 mat-dialog-title>
        {{ data.title }}
        <span class="class-count">
          {{ t + (classCount === 1 ? '.classCountOne' : '.classCount') | translate: { count: classCount } }}
        </span>
      </h2>
      <button
        mat-icon-button
        mat-dialog-close
        data-cy="data-model-full-map-close"
        [attr.aria-label]="t + '.close' | translate"
        [matTooltip]="t + '.close' | translate">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <mat-dialog-content>
      <app-data-model-map
        [graph]="data.graph"
        [selectedIri]="data.selectedIri"
        [anyResourceLabel]="data.anyResourceLabel"
        [full]="true"
        (classSelected)="dialogRef.close($event)" />
    </mat-dialog-content>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .title-row {
        display: flex;
        align-items: center;
        padding-right: 12px;
      }

      h2 {
        flex: 1;
        min-width: 0;
      }

      .class-count {
        margin-left: 8px;
        font-size: 14px;
        font-weight: 400;
        color: rgba(0, 0, 0, 0.6);
      }

      mat-dialog-content {
        flex: 1;
        max-height: none;
      }
    `,
  ],
})
export class DataModelFullMapDialogComponent {
  readonly data = inject<DataModelFullMapDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject<MatDialogRef<DataModelFullMapDialogComponent, string>>(MatDialogRef);
  readonly classCount = this.data.graph.nodes.filter(node => node.kind === 'class').length;
}
