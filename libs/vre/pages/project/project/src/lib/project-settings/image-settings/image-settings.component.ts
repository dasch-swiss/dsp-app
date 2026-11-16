import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { ActivatedRoute } from '@angular/router';
import {
  AdminAPIApiService,
  ProjectRestrictedViewSettingsGetResponseADM,
  SetRestrictedViewRequest,
} from '@dasch-swiss/vre/3rd-party-services/open-api';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ReplaceAnimation } from '@dasch-swiss/vre/shared/app-common';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IMask, IMaskDirective } from 'angular-imask';
import { ImageDisplayAbsoluteComponent } from './image-display-absolute.component';
import { ImageDisplayRatioComponent } from './image-display-ratio.component';

export enum ImageSettingsEnum {
  Default = 'Default',
  Watermark = 'Watermark',
  RestrictImageSize = 'RestrictImageSize',
}

/** The radio selection plus the size it implies, which is all that decides whether Submit has work to do. */
interface ImageSettingsState {
  mode: ImageSettingsEnum;
  size?: string;
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

  imageSettings: ImageSettingsEnum = ImageSettingsEnum.Default;
  projectUuid = this._route.parent?.parent?.snapshot.paramMap.get(RouteConstants.uuidParameter);
  percentage: string | null = '99';
  fixedWidth: string | null = null;

  /** The size the platform applies when the project stores nothing, shown under the Default radio. */
  inheritedSize?: string;

  private _loadedState?: ImageSettingsState;

  minMaxInputMask(min: number, max: number) {
    return {
      mask: IMask.MaskedNumber,
      min,
      max,
      autofix: true,
    };
  }

  get hasChanges(): boolean {
    if (!this._loadedState) {
      return false;
    }

    const current = this._currentState;
    return this._loadedState.mode !== current.mode || this._loadedState.size !== current.size;
  }

  get ratio(): number {
    // imask can leave the cleared field as `''`, which is not null, so `isPercentageSize` stays
    // true. `parseInt('')` is NaN and `NaN <= 0` is false, which let the Submit guard pass and
    // posted `size: "pct:"`. Anything non-numeric has to read as 0 so that guard bites.
    const percentage = Number(this.percentage);
    return Number.isFinite(percentage) && this.percentage !== '' ? percentage / 100 : 0;
  }

  get isPercentageSize(): boolean {
    return this.percentage !== null;
  }

  /** The percentage an inherited `pct:n` limit expresses, or null when the limit is absolute. */
  get inheritedPercentage(): string | null {
    return this.inheritedSize?.startsWith('pct:') ? this.inheritedSize.split(':')[1] : null;
  }

  /** The dimensions an inherited `!w,h` limit expresses, or null when the limit is a percentage. */
  get inheritedDimensions(): { width: string; height: string } | null {
    if (!this.inheritedSize || this.inheritedSize.startsWith('pct:')) {
      return null;
    }

    const [width, height] = this.inheritedSize.replace('!', '').split(',');
    return width && height ? { width, height } : null;
  }

  private get _currentState(): ImageSettingsState {
    return this.imageSettings === ImageSettingsEnum.RestrictImageSize
      ? { mode: this.imageSettings, size: this.getSizeForRequest() }
      : { mode: this.imageSettings };
  }

  constructor(
    private readonly _adminApiService: AdminAPIApiService,
    private readonly _cd: ChangeDetectorRef,
    private readonly _notification: NotificationService,
    private readonly _projectService: ProjectService,
    private readonly _route: ActivatedRoute,
    private readonly _translateService: TranslateService
  ) {}

  ngOnInit() {
    this.getImageSettings();
  }

  onSubmit() {
    const projectIri = this._projectService.uuidToIri(this.projectUuid!);

    const request$ =
      this.imageSettings === ImageSettingsEnum.Default
        ? this._adminApiService.deleteAdminProjectsIriProjectiriRestrictedviewsettings(projectIri)
        : this._adminApiService.postAdminProjectsIriProjectiriRestrictedviewsettings(projectIri, this.getRequest());

    // No error callback on purpose: an unhandled error reaches AppErrorHandler, which turns the
    // status into a specific message (403 no permission, 409 conflict reason, …). Handling it here
    // would swallow all of that and leave one flat sentence.
    request$.subscribe(response => {
      this.applyResponse(response);
      this._notification.openSnackBar(this._translateService.instant('pages.project.imageSettings.updateConfirmation'));
    });
  }

  onPercentageInputChange() {
    this.fixedWidth = null;
  }

  onFixedWidthInputChange() {
    this.percentage = null;
  }

  /**
   * DEV-7292: the generated `SetRestrictedViewRequest` types `size` as `{ value: string }`, but
   * dsp-api only accepts a bare string — its Tapir schema disagrees with its own codec. Typing this
   * against the generated model makes the compiler demand the wrapped shape, which the server
   * answers with 400. Keep the bare shape until the server fix ships.
   */
  private getRequest(): SetRestrictedViewRequest {
    const request =
      this.imageSettings === ImageSettingsEnum.Watermark ? { watermark: true } : { size: this.getSizeForRequest() };

    return request as unknown as SetRestrictedViewRequest;
  }

  private getImageSettings() {
    // No error callback: see onSubmit.
    this._adminApiService
      .getAdminProjectsIriProjectiriRestrictedviewsettings(this._projectService.uuidToIri(this.projectUuid!))
      .subscribe(response => {
        this.applyResponse(response);
        this._cd.detectChanges();
      });
  }

  /** All three verbs answer with the same shape, so load and save share this. */
  private applyResponse(response: ProjectRestrictedViewSettingsGetResponseADM) {
    this.inheritedSize = response.isDefault ? response.settings.size : undefined;

    if (response.isDefault) {
      this.imageSettings = ImageSettingsEnum.Default;
    } else if (response.settings.watermark) {
      this.imageSettings = ImageSettingsEnum.Watermark;
    } else if (response.settings.size) {
      this.setRestrictedSize(response.settings.size);
    } else {
      // `size` is optional on the wire, so a stored setting that is neither a watermark nor a size
      // is expressible. Fall back to Default rather than assert past it: the alternative throws
      // inside the subscribe callback, where a synchronous throw bypasses error handling entirely.
      this.imageSettings = ImageSettingsEnum.Default;
    }

    this._loadedState = this._currentState;
  }

  private setRestrictedSize(size: string) {
    this.imageSettings = ImageSettingsEnum.RestrictImageSize;

    if (size.startsWith('pct')) {
      this.percentage = size.split(':')[1];
      this.fixedWidth = null;
    } else {
      this.fixedWidth = size.split(',')[1];
      this.percentage = null;
    }
  }

  private getSizeForRequest() {
    return this.isPercentageSize ? `pct:${this.percentage}` : `!${this.fixedWidth},${this.fixedWidth}`;
  }
}
