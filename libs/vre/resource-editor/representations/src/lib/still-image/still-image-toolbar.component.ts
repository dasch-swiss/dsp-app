import { Component, EventEmitter, Inject, Input, Output } from '@angular/core';
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
import { ResourceUtil } from '@dasch-swiss/vre/shared/app-common';
import { DspApiConnectionToken, DspDialogConfig } from '@dasch-swiss/vre/shared/app-config';
import { AppError } from '@dasch-swiss/vre/shared/app-error-handler';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { filter, switchMap } from 'rxjs/operators';
import { EditThirdPartyIiifFormComponent } from '../edit-third-party-iiif-form/edit-third-party-iiif-form.component';
import { ThirdPartyIiifProps } from '../edit-third-party-iiif-form/edit-third-party-iiif-types';
import {
  ReplaceFileDialogComponent,
  ReplaceFileDialogProps,
} from '../replace-file-dialog/replace-file-dialog.component';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
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

        button {
          width: 32px !important;
        }
      }
    `,
  ],
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

  get userCanEdit() {
    return ResourceUtil.userCanEdit(this.resource);
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
    public osd: OpenSeaDragonService
  ) {
    this._setupCssMaterialIcon();
  }

  toggleDrawMode(): void {
    this.osd.viewer.setMouseNavEnabled(!this.osd.viewer.isMouseNavEnabled());
  }

  download() {
    this._rs.downloadProjectFile(this.imageFileValue, this.resource);
  }

  replaceImage() {
    let dialogRef;
    if (this.isReadStillImageExternalFileValue) {
      dialogRef = this._dialog.open<EditThirdPartyIiifFormComponent, ThirdPartyIiifProps>(
        EditThirdPartyIiifFormComponent,
        DspDialogConfig.dialogDrawerConfig({
          resourceId: this.resource.id,
          fileValue: this.imageFileValue as ReadStillImageExternalFileValue,
        })
      );
    } else {
      dialogRef = this._dialog.open<ReplaceFileDialogComponent, ReplaceFileDialogProps>(ReplaceFileDialogComponent, {
        data: {
          projectUuid: ProjectService.IriToUuid(this.resource.attachedToProject),
          title: 'Image',
          subtitle: 'Update image of the resource',
          representation: Constants.HasStillImageFileValue,
          propId: this.resource.properties[Constants.HasStillImageFileValue][0].id,
        },
      });
    }

    dialogRef
      .afterClosed()
      .pipe(
        filter(data => !!data),
        switchMap((data: UpdateFileValue) => this._replaceFile(data))
      )
      .subscribe(() => {
        this.resourceFetcherService.reload();
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
