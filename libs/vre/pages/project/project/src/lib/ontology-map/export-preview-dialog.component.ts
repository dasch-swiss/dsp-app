import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { GraphExportArea, GraphExportOptions } from './ontology-graph.component';

export interface ExportPreviewData {
  /** Draws the graph as a PNG: the part in view or every class, at a resolution, with its legend or not. */
  render: (area: GraphExportArea, options: GraphExportOptions) => Promise<Blob> | undefined;
  /** The downloaded file's name without `.png`, such as `beol_ontology-map`. */
  fileName: string;
}

/** How the preview opens: large, the image on the left and its settings on the right. */
export const exportPreviewDialogConfig = (data: ExportPreviewData): MatDialogConfig<ExportPreviewData> => ({
  data,
  width: '1040px',
  maxWidth: '95vw',
  autoFocus: false,
  panelClass: 'export-preview-dialog',
});

const SCALES = [1, 2, 4] as const;
type Scale = (typeof SCALES)[number];

/** The image as made: its pixels each way, and its size in bytes. */
interface Rendered {
  url: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * The Diagram's Export: a preview of the image as it will be, what is in view or the whole model, at 1×, 2× or 4× and
 * with its legend or not; then copied to the clipboard or downloaded.
 */
@Component({
  selector: 'app-export-preview-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatIcon,
    MatIconButton,
    MatProgressSpinner,
    TranslatePipe,
  ],
  template: `
    @let e = 'pages.ontologyMap.exportDialog';
    <div class="dialog" data-cy="export-preview">
      <div class="stage">
        <div class="stage-top">
          <span>{{ e + (area() === 'whole' ? '.previewWhole' : '.previewView') | translate }}</span>
          @if (rendered(); as image) {
            <span class="dims" data-cy="export-preview-dims"
              >{{ image.width }} × {{ image.height }} px · {{ megabytes(image.bytes) }} MB</span
            >
          }
        </div>
        <div class="paper-wrap">
          @if (rendered(); as image) {
            <img
              class="paper"
              data-cy="export-preview-image"
              [class.busy]="busy()"
              [src]="image.url"
              [alt]="e + '.previewAlt' | translate" />
          }
          @if (busy()) {
            <mat-spinner class="spinner" diameter="36" />
          } @else if (failed()) {
            <p class="failed">{{ 'pages.ontologyMap.exportMenu.exportFailed' | translate }}</p>
          }
        </div>
      </div>

      <div class="side">
        <div class="side-head">
          <h2>{{ e + '.title' | translate }}</h2>
          <button
            mat-icon-button
            type="button"
            [attr.aria-label]="e + '.close' | translate"
            (click)="dialogRef.close()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="settings">
          <div class="setting">
            <span class="heading" id="export-area">{{ e + '.area' | translate }}</span>
            <mat-button-toggle-group
              aria-labelledby="export-area"
              data-cy="export-preview-area"
              hideSingleSelectionIndicator
              [value]="area()"
              (change)="area.set($event.value)">
              <mat-button-toggle value="view">{{ e + '.view' | translate }}</mat-button-toggle>
              <mat-button-toggle value="whole">{{ e + '.whole' | translate }}</mat-button-toggle>
            </mat-button-toggle-group>
          </div>

          <div class="setting">
            <span class="heading" id="export-scale">{{ e + '.resolution' | translate }}</span>
            <mat-button-toggle-group
              aria-labelledby="export-scale"
              data-cy="export-preview-scale"
              hideSingleSelectionIndicator
              [value]="scale()"
              (change)="scale.set($event.value)">
              @for (option of scales; track option) {
                <mat-button-toggle [value]="option">
                  <span class="toggle-text">
                    {{ option }}×
                    @if (widthAt(option); as width) {
                      <small>{{ width }} px</small>
                    }
                  </span>
                </mat-button-toggle>
              }
            </mat-button-toggle-group>
            <span class="hint">{{ e + '.resolutionHint' | translate }}</span>
          </div>

          <div class="setting">
            <span class="heading" id="export-legend">{{ e + '.legend' | translate }}</span>
            <mat-button-toggle-group
              aria-labelledby="export-legend"
              data-cy="export-preview-legend"
              hideSingleSelectionIndicator
              [value]="legend()"
              (change)="legend.set($event.value)">
              <mat-button-toggle [value]="true">{{ e + '.yes' | translate }}</mat-button-toggle>
              <mat-button-toggle [value]="false">{{ e + '.no' | translate }}</mat-button-toggle>
            </mat-button-toggle-group>
          </div>
        </div>

        <div class="actions">
          <button
            mat-flat-button
            color="primary"
            type="button"
            data-cy="export-preview-copy"
            [disabled]="failed()"
            (click)="copy()">
            <mat-icon>content_copy</mat-icon>
            {{ e + '.copy' | translate }}
          </button>
          <button
            mat-stroked-button
            type="button"
            data-cy="export-preview-download"
            [disabled]="failed()"
            (click)="download()">
            <mat-icon>download</mat-icon>
            {{ e + '.download' | translate }}
          </button>
          <button mat-button type="button" (click)="dialogRef.close()">{{ e + '.cancel' | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @use 'config' as *;

      .dialog {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 300px;
        max-height: 90vh;
      }

      .stage {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 0;
        padding: 20px;
        background: $cool_gray_200;
      }

      .stage-top {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        font-size: 12px;
        color: $cool_gray_600;
      }

      .dims {
        font-variant-numeric: tabular-nums;
      }

      .paper-wrap {
        position: relative;
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: center;
        min-height: 360px;
      }

      .paper {
        display: block;
        max-width: 100%;
        max-height: 70vh;
        object-fit: contain;
        background: white;
        box-shadow: 0 2px 10px rgb(0 0 0 / 18%);
        transition: opacity 0.15s;

        &.busy {
          opacity: 0.4;
        }
      }

      .spinner {
        position: absolute;
      }

      .failed {
        color: $cool_gray_600;
      }

      .side {
        display: flex;
        flex-direction: column;
        min-width: 0;
        border-left: 1px solid $cool_gray_100;
      }

      .side-head {
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 12px 8px 4px 20px;

        h2 {
          flex: 1;
          margin: 0;
          font-size: 18px;
          font-weight: 500;
        }
      }

      .settings {
        display: flex;
        flex-direction: column;
        gap: 18px;
        padding: 8px 20px 16px;
      }

      .setting {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .heading {
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: $cool_gray_500;
      }

      mat-button-toggle-group {
        display: flex;

        mat-button-toggle {
          flex: 1;
        }
      }

      .toggle-text {
        display: inline-flex;
        flex-direction: column;
        line-height: 1.2;
        padding: 4px 0;

        small {
          font-size: 11px;
          color: $cool_gray_500;
          font-variant-numeric: tabular-nums;
        }
      }

      .hint {
        font-size: 12px;
        color: $cool_gray_500;
      }

      .actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: auto;
        padding: 14px 20px 18px;
        border-top: 1px solid $cool_gray_100;
      }

      @media (max-width: 760px) {
        .dialog {
          grid-template-columns: 1fr;
          max-height: none;
        }

        .side {
          border-left: 0;
          border-top: 1px solid $cool_gray_100;
        }
      }
    `,
  ],
})
export class ExportPreviewDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ExportPreviewDialogComponent>);
  private readonly _data = inject<ExportPreviewData>(MAT_DIALOG_DATA);
  private readonly _notification = inject(NotificationService);
  private readonly _translate = inject(TranslateService);

  readonly scales = SCALES;
  readonly area = signal<GraphExportArea>('view');
  readonly scale = signal<Scale>(2);
  readonly legend = signal(true);

  /** The image for the settings chosen, being made: copying or downloading waits for it. */
  private readonly _png = computed(() =>
    this._data.render(this.area(), { scale: this.scale(), legend: this.legend() })
  );
  readonly rendered = signal<Rendered | undefined>(undefined);
  readonly busy = signal(true);
  readonly failed = signal(false);
  /** The settings the shown image was made with, to tell each resolution's width from it. */
  private readonly _renderedScale = signal<Scale>(2);

  constructor() {
    let made = 0;
    effect(() => {
      const png = this._png();
      const scale = this.scale();
      const turn = ++made;
      this.busy.set(true);
      this.failed.set(false);
      if (!png) {
        this.busy.set(false);
        this.failed.set(true);
        return;
      }
      png
        .then(async blob => {
          const bitmap = await createImageBitmap(blob);
          if (turn !== made) return;
          this._show({ url: URL.createObjectURL(blob), width: bitmap.width, height: bitmap.height, bytes: blob.size });
          this._renderedScale.set(scale);
          this.busy.set(false);
        })
        .catch(() => {
          if (turn !== made) return;
          this.busy.set(false);
          this.failed.set(true);
        });
    });
    inject(DestroyRef).onDestroy(() => this._show(undefined));
  }

  /** The image's width at another resolution, from the one shown. */
  widthAt(scale: Scale): number | undefined {
    const image = this.rendered();
    return image ? Math.round((image.width / this._renderedScale()) * scale) : undefined;
  }

  megabytes(bytes: number): string {
    return (bytes / 1_000_000).toFixed(1);
  }

  copy(): void {
    const png = this._png();
    if (!png) return;
    // The promise itself goes to the clipboard, so Safari keeps the click's permission while the image is drawn.
    navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]).then(
      () => this._notify('imageCopied'),
      () => this._notify('exportFailed', 'error')
    );
  }

  download(): void {
    this._png()?.then(
      blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this._data.fileName}${this.area() === 'whole' ? '_whole' : ''}_${this.scale()}x.png`;
        link.click();
        URL.revokeObjectURL(url);
      },
      () => this._notify('exportFailed', 'error')
    );
  }

  private _show(image: Rendered | undefined): void {
    const previous = this.rendered();
    if (previous) URL.revokeObjectURL(previous.url);
    this.rendered.set(image);
  }

  private _notify(key: string, type: 'success' | 'error' = 'success'): void {
    this._notification.openSnackBar(this._translate.instant(`pages.ontologyMap.exportMenu.${key}`), type);
  }
}
