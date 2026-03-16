import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Constants,
  ReadResource,
  ReadStillImageExternalFileValue,
  ReadStillImageFileValue,
  ReadStillImageVectorFileValue,
} from '@dasch-swiss/dsp-js';
import { NoResultsFoundComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateService } from '@ngx-translate/core';
import { CompoundArrowNavigationComponent } from '../../compound/compound-arrow-navigation.component';
import { CompoundSliderComponent } from '../../compound/compound-slider.component';
import { IIIFUrl } from '../third-party-iiif/third-party-iiif';
import { OpenSeaDragonService } from './open-sea-dragon.service';
import { OsdDrawerService } from './osd-drawer.service';
import { StillImageHelper } from './still-image-helper';
import { StillImageToolbarComponent } from './still-image-toolbar.component';

@Component({
  selector: 'app-still-image',
  template: ` @if (errorMessage) {
      <app-no-results-found
        [message]="errorMessage"
        [color]="'white'"
        style="    flex: 1;
    justify-content: center;
    align-items: center;
    display: flex;" />
    } @else {
      <div class="osd-container" [class.drawing]="isViewInitialized && osdService.drawing" #osdViewer>
        @if (compoundMode) {
          <div>
            <app-compound-arrow-navigation [forwardNavigation]="false" class="arrow" />
            <app-compound-arrow-navigation [forwardNavigation]="true" class="arrow" />
          </div>
        }
      </div>
      <div class="toolbar-container">
        @if (compoundMode) {
          <app-compound-slider />
        }

        @if (isViewInitialized) {
          <app-still-image-toolbar
            [resource]="resource"
            [compoundMode]="compoundMode"
            [isPng]="isPng"
            (imageIsPng)="afterFormatChange($event)"
            (svgBackgroundChange)="onSvgBackgroundChange($event)" />
        }
      </div>
    }`,
  styleUrls: ['./still-image.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [OsdDrawerService, OpenSeaDragonService],
  imports: [
    CompoundArrowNavigationComponent,
    CompoundSliderComponent,
    StillImageToolbarComponent,
    NoResultsFoundComponent,
  ],
})
export class StillImageComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input({ required: true }) compoundMode!: boolean;
  @Input({ required: true }) resource!: ReadResource;
  @ViewChild('osdViewer') osdViewerElement!: ElementRef;

  isViewInitialized = false;
  isPng = false;
  errorMessage: string | null = null;

  private _svgBlobUrl: string | null = null;
  private readonly _destroyRef = inject(DestroyRef);

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    private readonly _http: HttpClient,
    protected osdService: OpenSeaDragonService,
    private readonly _osdDrawerService: OsdDrawerService,
    private readonly _translateService: TranslateService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isViewInitialized && changes['resource']) {
      this._osdDrawerService.update(this.resource);
      this._loadImage();
    }
  }

  ngAfterViewInit() {
    this.osdService.onInit(this.osdViewerElement.nativeElement);
    this._osdDrawerService.onInit(this.resource);
    this.isViewInitialized = true;
    this._cdr.detectChanges();
    this._loadImage();
  }

  afterFormatChange(value: boolean) {
    this.isPng = value;
    this._loadImage();
  }

  onSvgBackgroundChange(bg: 'default' | 'white' | 'transparent'): void {
    const container = this.osdViewerElement?.nativeElement as HTMLElement | null;
    if (!container) return;
    if (bg === 'white') {
      container.style.background = 'white';
    } else if (bg === 'transparent') {
      container.style.background =
        'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%) 0 0 / 24px 24px,' +
        'linear-gradient(45deg, #ccc 25%, #fff 25%, #fff 75%, #ccc 75%) 12px 12px / 24px 24px';
    } else {
      container.style.background = '';
    }
  }

  ngOnDestroy() {
    if (this._svgBlobUrl) {
      URL.revokeObjectURL(this._svgBlobUrl);
    }
    this.osdService.viewer.destroy();
  }

  private async _loadImage() {
    try {
      // Clear any previous errors
      this.errorMessage = null;

      const imageValues = this.resource.properties[Constants.HasStillImageFileValue];
      if (!imageValues?.length) {
        this.errorMessage = this._translateService.instant(
          'resourceEditor.representations.stillImage.errors.unknownImageType'
        );
        this._cdr.detectChanges();
        return;
      }
      const image = imageValues[0];

      switch (image.type) {
        case Constants.StillImageFileValue:
          this._openInternalImage(image as ReadStillImageFileValue);
          break;
        case Constants.StillImageExternalFileValue:
          await this._openExternal3iFImage(image as ReadStillImageExternalFileValue);
          break;
        case Constants.StillImageVectorFileValue:
          this._openSvgImage(image as ReadStillImageVectorFileValue);
          break;
        default:
          this.errorMessage = this._translateService.instant(
            'resourceEditor.representations.stillImage.errors.unknownImageType'
          );
          this._cdr.detectChanges();
      }
    } catch (error) {
      this.errorMessage =
        error instanceof Error
          ? error.message
          : this._translateService.instant('resourceEditor.representations.stillImage.errors.failedToLoadImage');
      this._cdr.detectChanges();
    }
  }

  private _openInternalImage(image: ReadStillImageFileValue): void {
    const tiles = StillImageHelper.prepareTileSourcesFromFileValues(
      [image],
      (this.osdService.viewer as any).ajaxHeaders,
      this.isPng
    );
    (this.osdService.viewer as any).loadTilesWithAjax = true;
    this.osdService.viewer.open(tiles);
  }

  private _openSvgImage(image: ReadStillImageVectorFileValue): void {
    // Revoke previous blob URL to prevent memory leaks
    if (this._svgBlobUrl) {
      URL.revokeObjectURL(this._svgBlobUrl);
      this._svgBlobUrl = null;
    }

    // Fetch SVG using HttpClient which has auth interceptor
    this._http
      .get(image.fileUrl, { responseType: 'blob' })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: blob => {
          this._svgBlobUrl = URL.createObjectURL(blob);
          (this.osdService.viewer as any).loadTilesWithAjax = false;
          this.osdService.viewer.open({
            type: 'image',
            url: this._svgBlobUrl,
          });
        },
        error: () => {
          this.errorMessage = this._translateService.instant(
            'resourceEditor.representations.stillImage.errors.failedToLoadImage'
          );
          this._cdr.detectChanges();
        },
      });
  }

  private async _openExternal3iFImage(image: ReadStillImageExternalFileValue) {
    const i3f = IIIFUrl.createUrl(image.externalUrl);
    if (!i3f) {
      this.errorMessage = this._translateService.instant(
        'resourceEditor.representations.stillImage.errors.cannotOpenIiifUrl'
      );
      this._cdr.detectChanges();
      return;
    }

    try {
      // Fetch and validate the info.json before passing to OpenSeadragon
      const response = await fetch(i3f.infoJsonUrl);
      if (!response.ok) {
        this.errorMessage = this._translateService.instant(
          'resourceEditor.representations.stillImage.errors.failedToFetchInfoJson',
          { status: response.status, statusText: response.statusText }
        );
        this._cdr.detectChanges();
        return;
      }

      const infoJson = await response.json();

      // Validate required IIIF parameters
      if (!infoJson.width || !infoJson.height || !(infoJson['@id'] || infoJson['id'])) {
        this.errorMessage = this._translateService.instant(
          'resourceEditor.representations.stillImage.errors.invalidIiifSource'
        );
        this._cdr.detectChanges();
        return;
      }

      // If validation passes, clear any previous errors and open with OpenSeadragon
      this.errorMessage = null;
      (this.osdService.viewer as any).loadTilesWithAjax = false;
      this.osdService.viewer.open(infoJson);
      this._cdr.detectChanges();
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Unknown error';
      this.errorMessage = this._translateService.instant(
        'resourceEditor.representations.stillImage.errors.failedToLoadExternalImage',
        { error: errorText }
      );
      this._cdr.detectChanges();
    }
  }
}
