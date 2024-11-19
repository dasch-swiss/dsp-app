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
import { Constants, ReadResource, ReadStillImageFileValue } from '@dasch-swiss/dsp-js';
import { ReadStillImageExternalFileValue } from '@dasch-swiss/dsp-js/src/models/v2/resources/values/read/read-file-value';
import { AppError } from '@dasch-swiss/vre/shared/app-error-handler';
import { IIIFUrl } from '../third-party-iiif/third-party-iiif';
import { OpenSeaDragonService } from './open-sea-dragon.service';
import { OsdDrawerService } from './osd-drawer.service';
import { StillImageHelper } from './still-image-helper';

@Component({
  selector: 'app-still-image',
  template: ` <div
      class="osd-container"
      [class.drawing]="isViewInitialized && !osdService.viewer.isMouseNavEnabled()"
      #osdViewer>
      <div *ngIf="compoundMode">
        <app-compound-arrow-navigation [forwardNavigation]="false" class="arrow" />
        <app-compound-arrow-navigation [forwardNavigation]="true" class="arrow" />
      </div>
    </div>
    <div class="toolbar">
      <app-compound-slider *ngIf="compoundMode" />

      <app-still-image-toolbar
        *ngIf="isViewInitialized"
        [resource]="resource"
        [compoundMode]="compoundMode"
        [isPng]="isPng"
        (imageIsPng)="afterFormatChange($event)" />
    </div>`,
  styleUrls: ['./still-image.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [OsdDrawerService, OpenSeaDragonService],
})
export class StillImageComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input({ required: true }) compoundMode!: boolean;
  @Input({ required: true }) resource!: ReadResource;
  @ViewChild('osdViewer') osdViewerElement!: ElementRef;

  isViewInitialized = false;
  isPng = false;

  constructor(
    private _cdr: ChangeDetectorRef,
    protected osdService: OpenSeaDragonService,
    private _osdDrawerService: OsdDrawerService
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

  private _loadImage() {
    const image = this.resource.properties[Constants.HasStillImageFileValue][0];

    switch (image.type) {
      case Constants.StillImageFileValue:
        this._openInternalImage(image as ReadStillImageFileValue);
        break;
      case Constants.StillImageExternalFileValue:
        this._openExternal3iFImage(image as ReadStillImageExternalFileValue);
        break;
      default:
        throw new AppError('Unknown image type');
    }
  }

  private _openInternalImage(image: ReadStillImageFileValue): void {
    const tiles = StillImageHelper.prepareTileSourcesFromFileValues(
      [image],
      (this.osdService.viewer as any).ajaxHeaders,
      this.isPng
    );
    this.osdService.viewer.open(tiles);
  }

  private _openExternal3iFImage(image: ReadStillImageExternalFileValue) {
    const i3f = IIIFUrl.createUrl(image.externalUrl);
    if (!i3f) {
      throw new AppError('Error with IIIF URL');
    }

    this.osdService.viewer.open(i3f.infoJsonUrl);
  }
}
