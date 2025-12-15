import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { ActivatedRoute } from '@angular/router';
import { ProjectRestrictedViewSettings } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService, RestrictedViewResponse, Size } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ReplaceAnimation } from '@dasch-swiss/vre/shared/app-common';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IMask, IMaskDirective } from 'angular-imask';
import { ImageDisplayAbsoluteComponent } from './image-display-absolute.component';
import { ImageDisplayRatioComponent } from './image-display-ratio.component';

enum ImageSettingsEnum {
  Off = 'Off',
  Watermark = 'Watermark',
  RestrictImageSize = 'RestrictImageSize',
}

@Component({
  selector: 'app-image-settings',
  styleUrls: ['./image-settings.component.scss'],
  templateUrl: './image-settings.component.html',
  animations: [ReplaceAnimation.animation],
  imports: [
    FormsModule,
    ImageDisplayAbsoluteComponent,
    ImageDisplayRatioComponent,
    IMaskDirective,
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    MatRadioButton,
    MatRadioGroup,
    TranslatePipe,
  ],
})
export class ImageSettingsComponent implements OnInit {
  readonly minWidth = 128;
  readonly maxWidth = 1024;
  readonly imageSettingsEnum = ImageSettingsEnum;

  currentSettings?: ProjectRestrictedViewSettings | RestrictedViewResponse;
  imageSettings: ImageSettingsEnum = ImageSettingsEnum.Off;
  projectUuid = this._route.parent?.parent?.snapshot.paramMap.get(RouteConstants.uuidParameter);
  percentage: string | null = '99';
  fixedWidth: string | null = null;

  minMaxInputMask(min: number, max: number) {
    return {
      mask: IMask.MaskedNumber,
      min,
      max,
      autofix: true,
    };
  }

  get hasChanges(): boolean {
    return JSON.stringify(this.currentSettings) !== JSON.stringify(this.getRequest());
  }

  get ratio(): number {
    return this.percentage ? parseInt(this.percentage, 0) / 100 : 0;
  }

  get isPercentageSize(): boolean {
    return this.percentage !== null;
  }

  constructor(
    private readonly _adminApiService: AdminAPIApiService,
    private readonly _cd: ChangeDetectorRef,
    private readonly _notification: NotificationService,
    private readonly _projectApiService: ProjectApiService,
    private readonly _projectService: ProjectService,
    private readonly _route: ActivatedRoute,
    private readonly _translateService: TranslateService
  ) {}

  ngOnInit() {
    this.getImageSettings();
  }

  onSubmit() {
    this._adminApiService
      .postAdminProjectsIriProjectiriRestrictedviewsettings(
        this._projectService.uuidToIri(this.projectUuid!),
        this.getRequest()
      )
      .subscribe(response => {
        this.currentSettings = response;
        this._notification.openSnackBar(
          this._translateService.instant('pages.project.imageSettings.updateConfirmation')
        );
      });
  }

  onPercentageInputChange() {
    this.fixedWidth = null;
  }

  onFixedWidthInputChange() {
    this.percentage = null;
  }

  private getRequest(): any {
    return this.imageSettings === ImageSettingsEnum.Watermark
      ? { watermark: true }
      : { size: this.getSizeForRequest() };
  }

  private getImageSettings() {
    this._projectApiService
      .getRestrictedViewSettingsForProject(this._projectService.uuidToIri(this.projectUuid!))
      .subscribe(response => {
        const settings = response.settings;

        if (settings && !settings.watermark && settings.size) {
          delete settings.watermark;
        } else if (!settings || !settings.watermark) {
          return;
        }

        this.currentSettings = settings;
        if ((settings.watermark === false && !settings.size) || (settings.size && settings.size === 'pct:100')) {
          this.imageSettings = this.imageSettingsEnum.Off;
          return;
        }

        if (settings.watermark) {
          this.imageSettings = ImageSettingsEnum.Watermark;
        } else {
          this.setRestrictedSize(settings.size!);
        }

        this._cd.detectChanges();
      });
  }

  private setRestrictedSize(size: string | Size) {
    const sizeAsString = typeof size === 'string' ? size : size.value;
    if (sizeAsString) {
      this.imageSettings = ImageSettingsEnum.RestrictImageSize;
    }

    if (sizeAsString.startsWith('pct')) {
      this.percentage = sizeAsString.split(':')[1];
      this.fixedWidth = null;
    } else {
      this.fixedWidth = sizeAsString.split(',')[1];
      this.percentage = null;
    }
  }

  private getSizeForRequest() {
    if (this.imageSettings === ImageSettingsEnum.RestrictImageSize) {
      return this.isPercentageSize ? `pct:${this.percentage}` : `!${this.fixedWidth},${this.fixedWidth}`;
    } else {
      return 'pct:100';
    }
  }
}
