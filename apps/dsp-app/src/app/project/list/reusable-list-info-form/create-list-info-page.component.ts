import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ListApiService } from '@dasch-swiss/vre/shared/app-api';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { LoadListsInProjectAction } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';

@Component({
  selector: 'app-create-list-info-page',
  template: `
    <dasch-swiss-centered-layout>
      <app-reusable-list-info-form
        [formData]="{
          labels: [],
          comments: []
        }"
        (formValueChange)="form = $event"></app-reusable-list-info-form>

      <div style="display: flex; justify-content: flex-end">
        <button
          mat-raised-button
          type="submit"
          color="primary"
          [disabled]="form.invalid"
          (click)="submitForm()"
          appLoadingButton
          [isLoading]="loading">
          {{ 'appLabels.form.action.submit' | translate }}
        </button>
      </div>
    </dasch-swiss-centered-layout>
  `,
})
export class CreateListInfoPageComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private _listApiService: ListApiService,
    private _route: ActivatedRoute,
    private _store: Store,
    private _projectService: ProjectService,
    private _router: Router
  ) {}

  submitForm() {
    this.loading = true;
    const projectIri = this._projectService.uuidToIri(this._route.parent.snapshot.paramMap.get('uuid'));

    this._listApiService
      .create({
        projectIri,
        labels: this.form.value.labels,
        comments: this.form.value.comments,
      })
      .subscribe(response => {
        this._store.dispatch(new LoadListsInProjectAction(projectIri));
        this.loading = false;

        const array = response.list.listinfo.id.split('/');
        const name = array[array.length - 1];
        this._router.navigate([RouteConstants.list, name], {
          relativeTo: this._route.parent,
        });
      });
  }
}
