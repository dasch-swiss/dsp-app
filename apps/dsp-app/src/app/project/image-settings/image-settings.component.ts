import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectRestrictedViewSettings } from '@dasch-swiss/dsp-js';
import { SetRestrictedViewRequest } from '@dasch-swiss/vre/open-api';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import {
  LoadProjectRestrictedViewSettingsAction,
  ProjectsSelectors,
  UpdateProjectRestrictedViewSettingsAction,
} from '@dasch-swiss/vre/shared/app-state';
import { TranslateService } from '@ngx-translate/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { ReplaceAnimation } from '../../main/animations/replace-animation';

@Component({
  selector: 'app-image-settings',
  styleUrls: ['./image-settings.component.scss'],
  templateUrl: './image-settings.component.html',
  animations: [ReplaceAnimation.animation],
})
export class ImageSettingsComponent implements OnInit {
  readonly absoluteWidthSteps: number[] = [64, 128, 256, 512, 1024];
  projectUuid = this.route.parent.parent.snapshot.paramMap.get(RouteConstants.uuidParameter);

  @Select(ProjectsSelectors.isProjectsLoading) isProjectsLoading$: Observable<boolean>;
  @Select(ProjectsSelectors.projectRestrictedViewSettings)
  projectRestrictedViewSettings$: Observable<ProjectRestrictedViewSettings>;

  percentage = 80;
  fixedWidth = this.absoluteWidthSteps[3];
  isWatermark = false;
  allowRestriction = false;
  isPercentageSize = true;

  constructor(
    private _projectService: ProjectService,
    private route: ActivatedRoute,
    private _store: Store,
    private _notification: NotificationService,
    private translateService: TranslateService,
    private _cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this._store
      .dispatch(new LoadProjectRestrictedViewSettingsAction(this._projectService.uuidToIri(this.projectUuid)))
      .pipe(
        switchMap(() => this.projectRestrictedViewSettings$.pipe(takeWhile(settings => settings?.watermark !== null)))
      )
      .subscribe(settings => {
        this.isWatermark = settings.watermark as boolean;

        if (settings.size === 'pct:100') {
          this.allowRestriction = false;
          return;
        }

        this.allowRestriction = true;
        this.isPercentageSize = settings.size.startsWith('pct');
        if (this.isPercentageSize) {
          this.percentage = parseInt(settings.size.split(':')[1], 0);
        } else {
          this.fixedWidth = parseInt(settings.size.split(',')[1], 0);
        }
        this._cd.detectChanges();
      });
  }

  formatPercentageLabel = (value: number): string => `${value}%`;

  formatAbsoluteLabel = (value: number): string => `${this.absoluteWidthSteps[value]}px`;

  absoluteWidthIndex = (value: number): number => this.absoluteWidthSteps.findIndex(step => step == value);

  absoluteSliderChange(value: number) {
    this.fixedWidth = this.absoluteWidthSteps[value];
  }

  onSubmit() {
    const request: SetRestrictedViewRequest = {
      size: this.getSizeForRequest(),
      watermark: this.isWatermark,
    };

    this._store.dispatch(new UpdateProjectRestrictedViewSettingsAction(this.projectUuid, request)).subscribe(() => {
      this._notification.openSnackBar(
        this.translateService.instant('appLabels.form.project.imageSettings.updateConfirmation')
      );
    });
  }

  private getSizeForRequest() {
    if (this.allowRestriction) {
      return this.isPercentageSize ? `pct:${this.percentage}` : `!${this.fixedWidth},${this.fixedWidth}`;
    } else {
      return 'pct:100';
    }
  }
}
