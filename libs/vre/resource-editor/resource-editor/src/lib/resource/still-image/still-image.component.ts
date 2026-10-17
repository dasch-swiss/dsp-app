import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Constants, ReadResource, ReadStillImageExternalFileValue, ReadStillImageFileValue } from '@dasch-swiss/dsp-js';
import { NoResultsFoundComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { RepresentationService } from '../../representation/representation.service';
import { IIIFUrl } from '../../representation/third-party-iiif/third-party-iiif';
import { CompoundArrowNavigationComponent } from '../compound/compound-arrow-navigation.component';
import { CompoundSliderComponent } from '../compound/compound-slider.component';
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
            [showLeftToolbar]="showLeftToolbar"
            (imageIsPng)="afterFormatChange($event)" />
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
  @Input() showLeftToolbar = true;
  @ViewChild('osdViewer') osdViewerElement!: ElementRef;

  isViewInitialized = false;
  isPng = false;
  errorMessage: string | null = null;

  /** Increments per load, so an image whose info.json answers late doesn't replace a newer one. */
  private _loadRequest = 0;

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    protected osdService: OpenSeaDragonService,
    private readonly _osdDrawerService: OsdDrawerService,
    private readonly _representationService: RepresentationService,
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

  ngOnDestroy() {
    this.osdService.viewer.destroy();
  }

  private async _loadImage() {
    const loadRequest = ++this._loadRequest;
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
          await this._openInternalImage(image as ReadStillImageFileValue, loadRequest);
          break;
        case Constants.StillImageExternalFileValue:
          await this._openExternal3iFImage(image as ReadStillImageExternalFileValue);
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

  private async _openInternalImage(image: ReadStillImageFileValue, loadRequest: number): Promise<void> {
    // Only a restricted view can be capped in size; everyone else opens without the extra info.json request.
    const asSingleImage = image.userHasPermission === 'RV' ? await this._isSizeRestricted(image) : false;
    if (loadRequest !== this._loadRequest) {
      return;
    }

    const tiles = StillImageHelper.prepareTileSourcesFromFileValues(
      [image],
      (this.osdService.viewer as any).ajaxHeaders,
      this.isPng,
      asSingleImage
    );
    (this.osdService.viewer as any).loadTilesWithAjax = true;
    this.osdService.viewer.open(tiles);
  }

  /** Falls back to `false` (tiled, as for full access) when the info.json can't be fetched. */
  private async _isSizeRestricted(image: ReadStillImageFileValue): Promise<boolean> {
    try {
      const imageInfo = await firstValueFrom(
        this._representationService.getIiifImageInfo(image.iiifBaseUrl, image.filename)
      );
      return StillImageHelper.isSizeRestricted(image, imageInfo);
    } catch {
      return false;
    }
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
