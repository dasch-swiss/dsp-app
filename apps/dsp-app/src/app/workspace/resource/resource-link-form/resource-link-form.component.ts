import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Constants,
  CreateLinkValue,
  CreateResource,
  CreateTextValueAsString,
  KnoraApiConnection,
  ReadResource,
  StoredProject,
} from '@dasch-swiss/dsp-js';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { FilteredResources, ShortResInfo } from '@dasch-swiss/vre/shared/app-common-to-move';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { ProjectsSelectors, UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Select, Store } from '@ngxs/store';
import { combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resource-link-form',
  templateUrl: './resource-link-form.component.html',
  styleUrls: ['./resource-link-form.component.scss'],
})
export class ResourceLinkFormComponent implements OnInit, OnDestroy {
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  @Input() resources: FilteredResources;

  @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

  /**
   * form group, errors and validation messages
   */
  form: UntypedFormGroup;

  formErrors = {
    label: '',
  };

  validationMessages = {
    label: {
      required: 'A label is required.',
    },
  };

  selectedProject: string;

  usersProjects$: Observable<StoredProject[]> = combineLatest([
    this._store.select(ProjectsSelectors.currentProject),
    this._store.select(UserSelectors.userProjects),
    this._store.select(UserSelectors.isSysAdmin),
  ]).pipe(
    takeUntil(this.ngUnsubscribe),
    map(([currentProject, currentUserProjects, isSysAdmin]) => {
      const projects = currentProject
        ? isSysAdmin
          ? [currentProject]
          : currentUserProjects.find(x => x.id === currentProject.id)
        : currentUserProjects;
      return projects as StoredProject[];
    })
  );

  @Select(UserSelectors.isSysAdmin) isSysAdmin$: Observable<boolean>;
  @Select(ProjectsSelectors.isCurrentProjectAdminOrSysAdmin) isCurrentProjectAdminOrSysAdmin$: Observable<boolean>;
  @Select(ProjectsSelectors.isProjectsLoading) isLoading$: Observable<boolean>;
  @Select(ProjectsSelectors.hasLoadingErrors) hasLoadingErrors$: Observable<boolean>;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _fb: UntypedFormBuilder,
    private _resourceService: ResourceService,
    private _router: Router,
    private _store: Store
  ) {}

  ngOnInit(): void {
    this.form = this._fb.group({
      label: new UntypedFormControl(
        {
          value: '',
          disabled: false,
        },
        [Validators.required]
      ),
      comment: new UntypedFormControl(),
      project: new UntypedFormControl(),
    });

    this.form.valueChanges.subscribe(() => this.onValueChanged());
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * this method is for the form error handling
   */
  onValueChanged() {
    if (!this.form) {
      return;
    }

    const form = this.form;

    Object.keys(this.formErrors).forEach(field => {
      this.formErrors[field] = '';
      const control = form.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.validationMessages[field];
        Object.keys(control.errors).forEach(key => {
          this.formErrors[field] += `${messages[key]} `;
        });
      }
    });
  }

  trackByFn = (index: number, item: ShortResInfo) => `${index}-${item.id}`;

  /**
   * submits the data
   */
  submitData() {
    // build link resource as type CreateResource
    const linkObj = new CreateResource();

    linkObj.label = this.form.controls['label'].value;

    linkObj.type = Constants.LinkObj;

    linkObj.attachedToProject = this.selectedProject;

    const hasLinkToValue = [];

    this.resources.resInfo.forEach(res => {
      const linkVal = new CreateLinkValue();
      linkVal.type = Constants.LinkValue;
      linkVal.linkedResourceIri = res.id;
      hasLinkToValue.push(linkVal);
    });

    const comment = this.form.controls['comment'].value;
    if (comment) {
      const commentVal = new CreateTextValueAsString();
      commentVal.type = Constants.TextValue;
      commentVal.text = comment;
      linkObj.properties = {
        [Constants.HasLinkToValue]: hasLinkToValue,
        [Constants.HasComment]: [commentVal],
      };
    } else {
      linkObj.properties = {
        [Constants.HasLinkToValue]: hasLinkToValue,
      };
    }

    this._dspApiConnection.v2.res.createResource(linkObj).subscribe((res: ReadResource) => {
      const path = this._resourceService.getResourcePath(res.id);
      const goto = `/resource${path}`;
      this._router.navigate([]).then(() => window.open(goto, '_blank'));
      this.closeDialog.emit();
    });
  }
}
