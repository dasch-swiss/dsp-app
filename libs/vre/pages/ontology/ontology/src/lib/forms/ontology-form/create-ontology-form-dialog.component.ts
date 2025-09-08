import { Component, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { KnoraApiConnection, OntologyMetadata } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { existingNamesAsyncValidator } from '@dasch-swiss/vre/pages/user-settings/user';
import { CustomRegex } from '@dasch-swiss/vre/shared/app-common';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { finalize, map, Subject, switchMap, takeUntil } from 'rxjs';
import { MakeOntologyFor } from '../../services/make-ontology-for';
import { OntologyForm } from './ontology-form.type';

@Component({
  selector: 'app-create-ontology-form-dialog',
  template: ` <app-dialog-header [title]="'pages.ontology.ontologyForm.create' | translate" />

    <form>
      @if (form) {
        <app-common-input
          [control]="form.controls.name"
          [validatorErrors]="[ontoNamePatternErrorMsg, ontoNameExistsErrorMsg]"
          [label]="'pages.ontology.ontologyForm.name' | translate"
          data-cy="name-input" />
      }

      <app-ontology-form mode="create" (afterFormInit)="afterFormInit($event)" />
    </form>
    <div mat-dialog-actions align="end">
      <button color="primary" mat-button mat-dialog-close>{{ 'ui.form.action.cancel' | translate }}</button>
      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="loading"
        data-cy="submit-button"
        (click)="onSubmit()">
        {{ 'ui.form.action.submit' | translate }}
      </button>
    </div>`,
})
export class CreateOntologyFormDialogComponent implements OnDestroy {
  private _destroy$ = new Subject<void>();

  loading = false;
  form: any;
  readonly forbiddenNames = ['knora', 'salsah', 'standoff', 'ontology', 'simple', 'shared'] as const;

  readonly ontoNamePatternErrorMsg = {
    errorKey: 'pattern',
    message:
      "Name shouldn't start with a number or v + number and spaces or special characters (except dash, dot and underscore) are not allowed.",
  };

  readonly ontoNameExistsErrorMsg = {
    errorKey: 'pattern',
    message: 'This name is not allowed or exists already.',
  };

  get blackListedNames() {
    return this._projectPageService.ontologies$.pipe(
      map(ontos => {
        const existingOntologyNames = ontos.map(onto => OntologyService.getOntologyNameFromIri(onto.id));
        return [...this.forbiddenNames, ...existingOntologyNames];
      })
    );
  }

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    public dialogRef: MatDialogRef<CreateOntologyFormDialogComponent, OntologyMetadata>,
    private _projectPageService: ProjectPageService,
    private _fb: FormBuilder
  ) {}

  afterFormInit(form: OntologyForm) {
    this.form = form;
    this.form.addControl(
      'name',
      this._fb.control('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(16),
          Validators.pattern(CustomRegex.ID_NAME_REGEX),
        ],
        asyncValidators: [existingNamesAsyncValidator(this.blackListedNames)],
      })
    );

    this.form.controls.name.valueChanges.pipe(takeUntil(this._destroy$)).subscribe(() => {
      if (this.form.controls.label.pristine) {
        this.form.controls.label.patchValue(this._proposeLabel(this.form.controls.name.value));
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;

    this._projectPageService.currentProject$
      .pipe(
        switchMap(project => {
          const createOntology = MakeOntologyFor.createOntology(
            { projectId: project.id, projectShort: '' },
            this.form.controls.name.value,
            this.form.controls.label.value,
            this.form.controls.comment.value
          );

          return this._dspApiConnection.v2.onto.createOntology(createOntology);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(ontology => {
        this.dialogRef.close(ontology);
      });
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _proposeLabel(ontoName = '') {
    return ontoName ? `${ontoName.charAt(0).toUpperCase()}${ontoName.slice(1)}` : '';
  }
}
