import { ClipboardModule } from '@angular/cdk/clipboard';
import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewContainerRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { Constants, ReadResource, ReadStillImageVectorFileValue } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  ReplaceFileDialogComponent,
  ReplaceFileDialogProps,
} from '../replace-file-dialog/replace-file-dialog.component';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { ResourceUtil } from '../resource.util';

@Component({
  standalone: true,
  selector: 'app-vector-image-toolbar',
  templateUrl: './vector-image-toolbar.component.html',
  styleUrls: ['./vector-image-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatMenuTrigger, MatTooltip, TranslatePipe, MatIcon, AsyncPipe, MatMenu, MatMenuItem, ClipboardModule],
})
export class VectorImageToolbarComponent {
  @Input({ required: true }) resource!: ReadResource;
  @Output() zoomIn = new EventEmitter<void>();
  @Output() zoomOut = new EventEmitter<void>();
  @Output() resetZoom = new EventEmitter<void>();
  @Output() fullscreen = new EventEmitter<void>();
  @Output() backgroundChange = new EventEmitter<'default' | 'white' | 'transparent'>();

  readonly translateService = inject(TranslateService);

  get imageFileValue(): ReadStillImageVectorFileValue | null {
    const imageValues = this.resource.properties[Constants.HasStillImageFileValue];
    if (!imageValues?.length) {
      return null;
    }
    const image = imageValues[0];
    if (image.type === Constants.StillImageVectorFileValue) {
      return image as ReadStillImageVectorFileValue;
    }
    return null;
  }

  get userCanView() {
    return this.imageFileValue && ResourceUtil.userCanView(this.imageFileValue);
  }

  constructor(
    public notification: NotificationService,
    public resourceFetcherService: ResourceFetcherService,
    private _rs: RepresentationService,
    private _dialog: MatDialog,
    private _viewContainerRef: ViewContainerRef
  ) {}

  download() {
    if (!this.imageFileValue) return;
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

  setBackground(bg: 'default' | 'white' | 'transparent') {
    this.backgroundChange.emit(bg);
  }
}
