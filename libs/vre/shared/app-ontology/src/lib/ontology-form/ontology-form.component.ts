import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  CreateOntology,
  KnoraApiConnection,
  OntologyMetadata,
  ReadOntology,
  ReadProject,
  UpdateOntologyMetadata,
} from '@dasch-swiss/dsp-js';
import { CustomRegex } from '@dasch-swiss/vre/shared/app-common';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { OntologyService, ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import {
  ClearProjectOntologiesAction,
  OntologiesSelectors,
  ProjectsSelectors,
} from '@dasch-swiss/vre/shared/app-state';
import { existingNamesValidator } from '@dasch-swiss/vre/shared/app-user';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { take, takeUntil, tap } from 'rxjs/operators';
import { OntologyForm, OntologyFormProps } from './ontology-form.type';

export interface NewOntology {
  projectIri: string;
  name: string;
  label: string;
}

@Component({
  selector: 'app-ontology-form',
  templateUrl: './ontology-form.component.html',
})
export class OntologyFormComponent implements OnInit, OnDestroy {
  private _destroy$: Subject<void> = new Subject<void>();

  @Select(OntologiesSelectors.currentOntology)
  private _currentOntology$: Observable<ReadOntology>;

  private _lastModificationDate: string;

  ontologyForm: OntologyForm;

  loading = false;

  project: ReadProject;

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

  get ontologyName(): string {
    return this.data.ontologyIri ? OntologyService.getOntologyName(this.data.ontologyIri) : '';
  }

  get existingOntologyNames(): string[] {
    return this._store
      .selectSnapshot(OntologiesSelectors.currentProjectOntologies)
      .map(onto => OntologyService.getOntologyName(onto.id));
  }

  get blackListedNames(): RegExp[] {
    const forbiddenRegex = this.forbiddenNames.map(name => new RegExp(name));
    const existingOntologyRegex = this.existingOntologyNames.map(name => new RegExp(`(?:^|\\W)${name}(?:$|\\W)`));
    return [...forbiddenRegex, ...existingOntologyRegex];
  }

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _fb: FormBuilder,
    private _router: Router,
    private _store: Store,
    @Inject(MAT_DIALOG_DATA) public data: OntologyFormProps,
    public dialogRef: MatDialogRef<OntologyFormComponent>
  ) {}

  ngOnInit() {
    this.project = this._store.selectSnapshot(ProjectsSelectors.currentProject);

    if (this.data.ontologyIri) {
      this._currentOntology$.pipe(take(1)).subscribe((response: ReadOntology) => {
        this._buildForm(response);
        this._lastModificationDate = response.lastModificationDate;
      });
    } else {
      this._buildForm();
    }

    this.ontologyForm.controls.name.valueChanges.pipe(takeUntil(this._destroy$)).subscribe(() => {
      if (this.ontologyForm.controls.label.pristine) {
        this.ontologyForm.controls.label.patchValue(this._proposeLabel(this.ontologyForm.controls.name.value));
      }
    });
  }

  private _proposeLabel(ontoName = '') {
    return ontoName ? `${ontoName.charAt(0).toUpperCase()}${ontoName.slice(1)}` : '';
  }

  private _buildForm(ontology: ReadOntology = null): void {
    this.ontologyForm = this._fb.group({
      name: [
        { value: this.ontologyName, disabled: !!ontology },
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(16),
          Validators.pattern(CustomRegex.ID_NAME_REGEX),
          existingNamesValidator(this.blackListedNames),
        ],
      ],
      label: [
        ontology?.label?.includes(':') ? ontology.label.split(':')[1] : ontology?.label || '',
        [Validators.required, Validators.minLength(3)],
      ],
      comment: [ontology ? ontology.comment : ''],
    });
  }

  submitData() {
    this.loading = true;
    if (this.data.ontologyIri) {
      this._updateOntology();
    } else {
      this._createOntology();
    }
  }

  private _updateOntology() {
    const ontologyData = new UpdateOntologyMetadata();
    ontologyData.id = this.data.ontologyIri;
    ontologyData.lastModificationDate = this._lastModificationDate;
    ontologyData.label = `${this.project.shortname}:${this.ontologyForm.controls.label.value}`;
    ontologyData.comment = this.ontologyForm.controls.comment.value;

    const update = this._dspApiConnection.v2.onto
      .updateOntology(ontologyData)
      .pipe(
        take(1),
        tap({
          error: () => {
            this.loading = false;
          },
        })
      )
      .subscribe((response: OntologyMetadata) => {
        this.dialogRef.close(true);
      });
  }

  private _createOntology() {
    const ontologyData = new CreateOntology();
    ontologyData.label = `${this.project.shortname}:${this.ontologyForm.controls.label.value}`;
    ontologyData.name = this.ontologyForm.controls.name.value;
    if (this.ontologyForm.controls.comment.value) {
      ontologyData.comment = this.ontologyForm.controls.comment.value;
    }
    ontologyData.attachedToProject = this.project.id;

    this._dspApiConnection.v2.onto
      .createOntology(ontologyData)
      .pipe(take(1))
      .subscribe((response: OntologyMetadata) => {
        this._store.dispatch([new ClearProjectOntologiesAction(this.project.shortcode)]);
        // go to the new ontology page
        this._router.navigate([
          RouteConstants.project,
          ProjectService.IriToUuid(this.project.id),
          RouteConstants.ontology,
          OntologyService.getOntologyName(response.id),
          RouteConstants.editor,
          RouteConstants.classes,
        ]);
        this.dialogRef.close();
      });
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
