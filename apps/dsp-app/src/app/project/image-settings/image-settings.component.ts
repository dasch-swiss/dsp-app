import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProjectRestrictedViewSettings } from '@dasch-swiss/dsp-js';
import { SetRestrictedViewRequest } from '@dasch-swiss/vre/open-api';
import { ProjectApiService } from '@dasch-swiss/vre/shared/app-api';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import {
  LoadProjectRestrictedViewSettingsAction,
  ProjectsSelectors,
  UpdateProjectRestrictedViewSettingsAction,
} from '@dasch-swiss/vre/shared/app-state';
import { Actions, Select, Store, ofActionSuccessful } from '@ngxs/store';
import { Observable, combineLatest } from 'rxjs';
import { map, switchMap, take, takeWhile } from 'rxjs/operators';
import { ReplaceAnimation } from '../../main/animations/replace-animation';
import { ProjectImageSettings } from './project-image-settings';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-image-settings',
  styleUrls: ['./image-settings.component.scss'],
  templateUrl: './image-settings.component.html',
  animations: [ReplaceAnimation.animation],
})
export class ImageSettingsComponent implements OnInit {
  readonly absoluteWidthSteps: number[] = [64, 128, 256, 512, 1024];

  projectImageSettings = new ProjectImageSettings();
  form: FormGroup;
  projectUuid: string;
  project$ = this.route.parent.parent.paramMap.pipe(
    map(params => params.get(RouteConstants.uuidParameter)),
    map(uuid => this._projectService.uuidToIri(uuid)),
    switchMap(iri => this._projectApiService.get(iri)),
    map(project => project.project)
  );

  @Output() formValueChange = new EventEmitter<FormGroup>();

  @Select(ProjectsSelectors.isProjectsLoading) isProjectsLoading$: Observable<boolean>;
  @Select(ProjectsSelectors.projectRestrictedViewSettings)
  projectRestrictedViewSettings$: Observable<ProjectRestrictedViewSettings>;

  constructor(
    private _projectApiService: ProjectApiService,
    private _projectService: ProjectService,
    private route: ActivatedRoute,
    private _store: Store,
    private _notification: NotificationService,
    private _actions: Actions,
    private _fb: FormBuilder
  ) {}

  ngOnInit() {
    this._buildForm();
    this.setFormData();
  }

  formatPercentageLabel = (value: number): string => `${value}%`;

  formatAbsoluteLabel = (value: number): string => `${this.absoluteWidthSteps[value]}px`;

  setFormData() {
    this.projectUuid = this.route.parent.parent.snapshot.paramMap.get(RouteConstants.uuidParameter);
    this._store.dispatch(new LoadProjectRestrictedViewSettingsAction(this._projectService.uuidToIri(this.projectUuid)));
    combineLatest([
      this._actions.pipe(ofActionSuccessful(LoadProjectRestrictedViewSettingsAction), take(1)),
      this.projectRestrictedViewSettings$.pipe(takeWhile(settings => settings?.watermark === true)),
    ])
      .pipe(
        take(1),
        map(([action, settings]) => {
          this.projectImageSettings = ProjectImageSettings.GetProjectImageSettings(settings.size);
          this.form.patchValue({
            aspect: this.projectImageSettings.aspect,
            percentage: this.projectImageSettings.percentage,
            absoluteWidthIndex: this.absoluteWidthSteps[this.projectImageSettings.absoluteWidth],
          });
        })
      )
      .subscribe();
  }

  absoluteWidthIndex = (value: number): number => this.absoluteWidthSteps.findIndex(step => step == value);

  absoluteSliderChange(value: number) {
    this.projectImageSettings.absoluteWidth = this.absoluteWidthSteps[value];
  }

  onSubmit() {
    const request: SetRestrictedViewRequest = {
      size: ProjectImageSettings.FormatToIiifSize(
        this.form.value.aspect,
        this.form.value.percentage,
        this.absoluteWidthSteps[this.form.value.absoluteWidthIndex]
      ),
      watermark: true,
    };

    this._store.dispatch(new UpdateProjectRestrictedViewSettingsAction(this.projectUuid, request));
    this._actions.pipe(ofActionSuccessful(UpdateProjectRestrictedViewSettingsAction), take(1)).subscribe(() => {
      this._notification.openSnackBar('You have successfully updated the project image settings.');
    });
  }

  private _buildForm() {
    this.form = this._fb.group({
      aspect: ['', []],
      absoluteWidthIndex: ['', []],
      percentage: ['', []],
    });
  }
}
