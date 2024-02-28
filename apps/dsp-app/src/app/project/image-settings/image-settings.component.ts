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
import { switchMap, take, takeWhile } from 'rxjs/operators';
import { ReplaceAnimation } from '../../main/animations/replace-animation';

@Component({
  selector: 'app-image-settings',
  styleUrls: ['./image-settings.component.scss'],
  templateUrl: './image-settings.component.html',
  animations: [ReplaceAnimation.animation],
})
export class ImageSettingsComponent implements OnInit {
  projectUuid = this.route.parent.parent.snapshot.paramMap.get(RouteConstants.uuidParameter);

  @Select(ProjectsSelectors.isProjectsLoading) isProjectsLoading$: Observable<boolean>;
  @Select(ProjectsSelectors.projectRestrictedViewSettings)
  projectRestrictedViewSettings$: Observable<ProjectRestrictedViewSettings>;

  percentage = 80;
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
        switchMap(() =>
          this.projectRestrictedViewSettings$.pipe(
            take(1),
            takeWhile(settings => settings?.watermark !== null)
          )
        )
      )
      .subscribe(settings => {
        this.isWatermark = (<unknown>settings.watermark) as boolean;

        if (settings.size === 'pct:100') {
          this.allowRestriction = false;
          return;
        }

        this.allowRestriction = true;
        this.isPercentageSize = settings.size?.startsWith('pct');
        if (this.isPercentageSize) {
          this.percentage = parseInt(settings.size.split(':')[1], 0);
        }

        this._cd.detectChanges();
      });
  }

  formatPercentageLabel = (value: number): string => `${value}%`;

  onSubmit() {
    const request: SetRestrictedViewRequest = {
      size: this.allowRestriction ? `pct:${this.percentage}` : 'pct:100',
      watermark: this.isWatermark,
    };

    this._store.dispatch(new UpdateProjectRestrictedViewSettingsAction(this.projectUuid, request)).subscribe(() => {
      this._notification.openSnackBar(
        this.translateService.instant('appLabels.form.project.imageSettings.updateConfirmation')
      );
    });
  }
}
