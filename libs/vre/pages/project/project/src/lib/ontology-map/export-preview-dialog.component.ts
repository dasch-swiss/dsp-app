import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTooltip } from '@angular/material/tooltip';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  EXPORT_CANVAS_LIMIT,
  GraphExportArea,
  GraphExportFormat,
  GraphExportOptions,
} from './ontology-graph.component';

export interface ExportPreviewData {
  /** Draws the graph as a PNG: the part in view or every class, at a resolution, with its legend or not. */
  render: (area: GraphExportArea, options: GraphExportOptions) => Promise<Blob> | undefined;
  /** The downloaded file's name without its extension, such as `beol_ontology-map`. */
  fileName: string;
  /** The data model's name, written over the image when chosen. */
  title: string;
  /** What the graph is filtered on, written under the name in an image of what is in view; none unfiltered. */
  filter?: string;
}

/** How the preview opens: the image on the left, its settings in a narrow column on the right. */
export const exportPreviewDialogConfig = (data: ExportPreviewData): MatDialogConfig<ExportPreviewData> => ({
  data,
  width: '920px',
  maxWidth: '95vw',
  autoFocus: false,
  panelClass: 'export-preview-dialog',
});

/** The resolutions offered, by name: each draws the graph at a scale. */
const LEVELS = [
  { key: 'low', scale: 1 },
  { key: 'standard', scale: 2 },
  { key: 'high', scale: 8 },
] as const;
type Level = (typeof LEVELS)[number];

/** The image as made: its pixels each way, and its size in bytes. */
interface Rendered {
  url: string;
  width: number;
  height: number;
  bytes: number;
  /** The scale it was drawn at, to tell each other resolution's width from it. */
  scale: number;
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
    MatSlideToggle,
    MatTooltip,
    TranslatePipe,
  ],
  template: `
    @let e = 'pages.ontologyMap.exportDialog';
    <div class="dialog" data-cy="export-preview">
      <div class="stage">
        <div class="stage-top">
          {{ e + (area() === 'whole' ? '.previewWhole' : '.previewView') | translate }}
          @if (rendered(); as image) {
            <span class="dims" data-cy="export-preview-dims"
              >· {{ image.width }} × {{ image.height }} px · {{ fileSize(image.bytes) }}</span
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
            <mat-spinner class="spinner" diameter="32" />
          } @else if (failed()) {
            <p class="failed">{{ 'pages.ontologyMap.exportMenu.exportFailed' | translate }}</p>
          }
        </div>
      </div>

      <!-- The settings, as the View options menu shows its own: small headings, toggles and switches. -->
      <div class="side">
        <div class="side-head">
          <h2>{{ e + '.title' | translate }}</h2>
          <button
            mat-icon-button
            type="button"
            class="close"
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
            <span class="heading" id="export-format">{{ e + '.format' | translate }}</span>
            <mat-button-toggle-group
              aria-labelledby="export-format"
              data-cy="export-preview-format"
              hideSingleSelectionIndicator
              [value]="format()"
              (change)="format.set($event.value)">
              <mat-button-toggle value="png" [matTooltip]="e + '.pngHint' | translate">PNG</mat-button-toggle>
              <mat-button-toggle value="svg" [matTooltip]="e + '.svgHint' | translate">SVG</mat-button-toggle>
            </mat-button-toggle-group>
          </div>

          @if (format() === 'png') {
            <div class="setting">
              <span class="heading" id="export-scale">{{ e + '.resolution' | translate }}</span>
              <mat-button-toggle-group
                aria-labelledby="export-scale"
                data-cy="export-preview-scale"
                hideSingleSelectionIndicator
                [value]="level()"
                (change)="level.set($event.value)">
                @for (option of levels; track option.key) {
                  <mat-button-toggle [value]="option" [matTooltip]="levelHint(option)">{{
                    e + '.' + option.key | translate
                  }}</mat-button-toggle>
                }
              </mat-button-toggle-group>
            </div>
          }

          <div class="setting">
            <span class="heading">{{ e + '.include' | translate }}</span>
            <mat-slide-toggle
              labelPosition="before"
              data-cy="export-preview-title"
              [checked]="title()"
              (change)="title.set($event.checked)"
              >{{ e + '.modelName' | translate }}</mat-slide-toggle
            >
            <mat-slide-toggle
              labelPosition="before"
              data-cy="export-preview-legend"
              [checked]="legend()"
              (change)="legend.set($event.checked)"
              >{{ e + '.legend' | translate }}</mat-slide-toggle
            >
          </div>
        </div>

        <!-- The two ways out, as pills: downloading shows first. -->
        <div class="actions">
          <button mat-stroked-button type="button" data-cy="export-preview-copy" [disabled]="failed()" (click)="copy()">
            <mat-icon>content_copy</mat-icon>
            {{ e + '.copy' | translate }}
          </button>
          <button
            mat-flat-button
            color="primary"
            type="button"
            data-cy="export-preview-download"
            [disabled]="failed()"
            (click)="download()">
            <mat-icon>download</mat-icon>
            {{ e + '.download' | translate: { format: format().toUpperCase() } }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @use 'config' as *;

      .dialog {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 240px;
        max-height: 90vh;
        font-size: 13px;
      }

      .stage {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
        padding: 16px;
        background: $cool_gray_200;
      }

      .stage-top {
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
        min-height: 320px;
      }

      .paper {
        display: block;
        max-width: 100%;
        max-height: 70vh;
        object-fit: contain;
        background: white;
        box-shadow: 0 2px 8px rgb(0 0 0 / 16%);
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
        padding: 8px 4px 4px 16px;

        h2 {
          flex: 1;
          margin: 0;
          font-size: 15px;
          font-weight: 500;
        }

        .close {
          --mat-icon-button-state-layer-size: 32px;
          padding: 4px;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }
      }

      .settings {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 4px 16px 12px;
      }

      .setting {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      // As the View options menu's headings.
      .heading {
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: $cool_gray_500;
      }

      // As the View options menu's text sizes: 30 px high, 13 px text, each choice as wide as the others.
      mat-button-toggle-group {
        --mat-button-toggle-height: 30px;
        --mat-button-toggle-label-text-size: 13px;
        --mat-button-toggle-shape: 15px;
        display: flex;

        mat-button-toggle {
          flex: 1;
        }
      }

      // Its words on the left, its switch at the right edge.
      mat-slide-toggle {
        --mat-slide-toggle-label-text-size: 13px;
        display: block;

        ::ng-deep .mdc-form-field {
          display: flex;
          justify-content: space-between;
          width: 100%;

          .mdc-label {
            margin-left: 0;
          }
        }
      }

      // As the Diagram's pills: 32 px high and round.
      // One under the other, the download first, so their words fit on one line in every language.
      .actions {
        display: flex;
        flex-direction: column-reverse;
        gap: 8px;
        margin-top: auto;
        padding: 12px 16px;
        border-top: 1px solid $cool_gray_100;

        button {
          --mat-button-filled-container-height: 32px;
          --mat-button-outlined-container-height: 32px;
          --mat-button-filled-container-shape: 16px;
          --mat-button-outlined-container-shape: 16px;
          --mat-button-filled-label-text-size: 13px;
          --mat-button-outlined-label-text-size: 13px;
          --mat-button-filled-horizontal-padding: 10px;
          --mat-button-outlined-horizontal-padding: 10px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
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

  readonly levels = LEVELS;
  readonly area = signal<GraphExportArea>('view');
  readonly format = signal<GraphExportFormat>('png');
  readonly level = signal<Level>(LEVELS[1]);
  readonly legend = signal(true);
  /** Whether the data model's name is written over the image. */
  readonly title = signal(true);

  /** The image for the settings chosen, being made: copying or downloading waits for it. */
  private _png: Promise<Blob> | undefined;
  readonly rendered = signal<Rendered | undefined>(undefined);
  readonly busy = signal(true);
  readonly failed = signal(false);

  constructor() {
    let made = 0;
    effect(() => {
      const area = this.area();
      const format = this.format();
      // An SVG has no resolution: its size is the graph's, in screen pixels.
      const scale = format === 'svg' ? 1 : this.level().scale;
      const titled = this.title();
      const options: GraphExportOptions = {
        format,
        scale,
        legend: this.legend(),
        title: titled ? this._data.title : undefined,
        // The whole model is never filtered: only what is in view says what it is filtered on.
        subtitle: titled && area === 'view' ? this._data.filter : undefined,
      };
      // Drawing may set up what it draws from, such as the whole model's copy: not part of what this effect follows.
      const png = untracked(() => this._data.render(area, options));
      this._png = png;
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
          const url = URL.createObjectURL(blob);
          const size = await sizeOf(url).catch(() => ({ width: 0, height: 0 }));
          if (turn !== made) {
            URL.revokeObjectURL(url);
            return;
          }
          this._show({
            url,
            width: size.width,
            height: size.height,
            bytes: blob.size,
            scale,
          });
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

  /** A resolution's scale, and its width once the shown image is drawn, such as `2× · 3200 px`. */
  levelHint(level: Level): string {
    const image = this.rendered();
    if (!image) return `${level.scale}×`;
    // No side is drawn wider than the canvas allows, whatever the scale.
    const ratio = Math.min(level.scale / image.scale, EXPORT_CANVAS_LIMIT / Math.max(image.width, image.height));
    return `${level.scale}× · ${Math.round(image.width * ratio)} px`;
  }

  /** The file's size, in KB under a tenth of a MB, such as an SVG's often is, else in MB. */
  fileSize(bytes: number): string {
    return bytes < 100_000 ? `${Math.max(1, Math.round(bytes / 1000))} KB` : `${(bytes / 1_000_000).toFixed(1)} MB`;
  }

  copy(): void {
    const png = this._png;
    if (!png) return;
    // The promise itself goes to the clipboard, so Safari keeps the click's permission while the image is drawn. An
    // SVG goes as its markup too, which design tools and editors paste, where the browser cannot copy it as an image.
    const item: Record<string, Promise<Blob>> = this.format() === 'svg'
      ? {
          'text/plain': png.then(async blob => new Blob([await blob.text()], { type: 'text/plain' })),
          ...(ClipboardItem.supports?.('image/svg+xml') ? { 'image/svg+xml': png } : {}),
        }
      : { 'image/png': png };
    navigator.clipboard.write([new ClipboardItem(item)]).then(
      () => this._notify('imageCopied'),
      () => this._notify('exportFailed', 'error')
    );
  }

  download(): void {
    this._png?.then(
      blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const whole = this.area() === 'whole' ? '_whole' : '';
        link.download =
          this.format() === 'svg'
            ? `${this._data.fileName}${whole}.svg`
            : `${this._data.fileName}${whole}_${this.level().key}.png`;
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

/** An image's own width and height, a PNG's or an SVG's, read as the browser shows it. */
function sizeOf(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = url;
  });
}
