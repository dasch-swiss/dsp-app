import { Component, EventEmitter, Inject, Input, Output, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import {
  Constants,
  KnoraApiConnection,
  ReadResource,
  ReadStillImageExternalFileValue,
  ReadStillImageFileValue,
  UpdateFileValue,
  UpdateResource,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import {
  ReplaceFileDialogComponent,
  ReplaceFileDialogProps,
} from '../replace-file-dialog/replace-file-dialog.component';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { ResourceUtil } from '../resource.util';
import { OpenSeaDragonService } from './open-sea-dragon.service';

@Component({
  selector: 'app-still-image-toolbar',
  templateUrl: './still-image-toolbar.component.html',
  styles: [
    `
      .toolbar {
        display: flex;
        justify-content: space-between;
        padding-right: 16px;
      }

      .icon-container {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      .clickable-icon {
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 32px;
        width: 32px;
      }

      .clickable-icon.disabled {
        pointer-events: none;
        opacity: 0.5;
      }
    `,
  ],
  standalone: false,
})
export class StillImageToolbarComponent {
  @Input({ required: true }) resource!: ReadResource;
  @Input({ required: true }) compoundMode!: boolean;
  @Input({ required: true }) isPng!: boolean;
  @Output() imageIsPng = new EventEmitter<boolean>();

  get imageFileValue() {
    const image = this.resource.properties[Constants.HasStillImageFileValue][0];
    switch (image.type) {
      case Constants.StillImageFileValue:
        return image as ReadStillImageFileValue;
      case Constants.StillImageExternalFileValue:
        return image as ReadStillImageExternalFileValue;
      default:
        throw new AppError('Unknown image type');
    }
  }

  get isReadStillImageExternalFileValue(): boolean {
    return !!this.imageFileValue && this.imageFileValue.type === Constants.StillImageExternalFileValue;
  }

  get userCanView() {
    return this.imageFileValue && ResourceUtil.userCanView(this.imageFileValue);
  }

  constructor(
    public notification: NotificationService,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    public resourceFetcherService: ResourceFetcherService,
    private _rs: RepresentationService,
    private _dialog: MatDialog,
    private _domSanitizer: DomSanitizer,
    private _matIconRegistry: MatIconRegistry,
    public osd: OpenSeaDragonService,
    private _viewContainerRef: ViewContainerRef
  ) {
    this._setupCssMaterialIcon();
  }

  toggleDrawMode(): void {
    this.osd.toggleDrawing();
  }

  download() {
    this._rs.downloadProjectFile(this.imageFileValue, this.resource);
  }

  replaceImage() {
    this._dialog.open<ReplaceFileDialogComponent, ReplaceFileDialogProps>(ReplaceFileDialogComponent, {
      ...DspDialogConfig.mediumDialog({
        title: 'Image',
        subtitle: 'Update image of the resource',
        representation: Constants.HasStillImageFileValue,
        resource: this.resource,
      }),
      viewContainerRef: this._viewContainerRef,
    });
  }

  private _replaceFile(file: UpdateFileValue) {
    const updateRes = new UpdateResource();
    updateRes.id = this.resource.id;
    updateRes.type = this.resource.type;
    updateRes.property = Constants.HasStillImageFileValue;
    updateRes.value = file;
    return this._dspApiConnection.v2.values.updateValue(updateRes as UpdateResource<UpdateFileValue>);
  }

  private _setupCssMaterialIcon() {
    this._matIconRegistry.addSvgIcon(
      'draw_region_icon',
      this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/draw-region-icon.svg')
    );
  }
}
