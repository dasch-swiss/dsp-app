import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApiResponseError,
  CreateOntology,
  KnoraApiConnection,
  OntologyMetadata,
  ReadOntology,
  ReadProject,
  UpdateOntologyMetadata,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { OntologyService, ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import {
  ClearProjectOntologiesAction,
  CurrentOntologyCanBeDeletedAction,
  LoadListsInProjectAction,
  LoadProjectOntologiesAction,
  OntologiesSelectors,
  ProjectsSelectors,
  SetCurrentOntologyAction,
  SetCurrentProjectOntologyPropertiesAction,
} from '@dasch-swiss/vre/shared/app-state';
import { Actions, Select, Store, ofActionSuccessful } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { existingNamesValidator } from '../../../main/directive/existing-name/existing-name.directive';
import { CustomRegex } from '../../../workspace/resource/values/custom-regex';

export interface NewOntology {
  projectIri: string;
  name: string;
  label: string;
}

@Component({
  selector: 'app-ontology-form',
  templateUrl: './ontology-form.component.html',
  styleUrls: ['./ontology-form.component.scss'],
})
export class OntologyFormComponent implements OnInit, OnDestroy {
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  // project uuid
  @Input() projectUuid: string;

  // ontology iri in case of edit
  @Input() iri: string;

  @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

  @Output() updateParent: EventEmitter<string> = new EventEmitter<string>();

  // existing ontology names; name has to be unique
  existingOntologyNames: string[] = [];

  loading: boolean;

  project: ReadProject;

  ontologyForm: UntypedFormGroup;

  ontologyLabel: string;
  ontologyComment: string;

  lastModificationDate: string;

  // ontology name must not contain one of the following words
  forbiddenNames: string[] = ['knora', 'salsah', 'standoff', 'ontology', 'simple', 'shared'];

  existingNames: [RegExp];

  nameMinLength = 3;
  nameMaxLength = 16;

  formErrors = {
    name: '',
    label: '',
  };

  validationMessages = {
    name: {
      required: 'Name is required.',
      minlength: `Name must be at least ${this.nameMinLength} characters long.`,
      maxlength: `Name cannot be more than ${this.nameMaxLength} characters long.`,
      pattern:
        "Name shouldn't start with a number or v + number and spaces or special characters (except dash, dot and underscore) are not allowed.",
      existingName: 'This name is not allowed or exists already.',
    },
    label: {
      required: 'Label is required.',
      minlength: `Label must be at least ${this.nameMinLength} characters long.`,
    },
  };

  ontologyNameInfo = `
    The unique name
        - must be at least 3 characters long
        - shouldn't begin with a number
        - shouldn't begin with the letter v and a number
        - spaces or special characters (except dash, dot and underscore) are not allowed
        - may not contain these reserved words: knora, ontology, salsah, shared, simple or standoff
        - can't be changed afterwards
    `;

  error = false;

  @Select(OntologiesSelectors.currentProjectOntologies)
  currentProjectOntologies$: Observable<ReadOntology[]>;
  @Select(OntologiesSelectors.currentOntology)
  currentOntology$: Observable<ReadOntology>;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _errorHandler: AppErrorHandler,
    private _fb: UntypedFormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private _store: Store,
    private _actions$: Actions,
    private _projectService: ProjectService
  ) {}

  ngOnInit() {
    if (!this.projectUuid) {
      // if project shorcode is missing, get it from the url
      this.projectUuid = this._route.parent.snapshot.params.uuid;
    }

    if (!this.iri && !this.existingOntologyNames.length) {
      // if there is no iri, we are creating a new ontology
      const currentProjectOntologies = this._store.selectSnapshot(OntologiesSelectors.currentProjectOntologies);
      currentProjectOntologies.forEach(onto => {
        const name = OntologyService.getOntologyName(onto.id);
        this.existingOntologyNames.push(name);
      });
    }

    this.project = this._store.selectSnapshot(ProjectsSelectors.currentProject);
    this.buildForm();

    if (this.iri) {
      // edit mode: get current ontology
      this.currentOntology$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((response: ReadOntology) => {
        // add values to the ontology form
        this.ontologyForm.controls['name'].disable();
        const name = OntologyService.getOntologyName(this.iri);
        this.ontologyForm.controls['name'].setValue(name);
        this.ontologyForm.controls['label'].setValue(response.label);
        this.ontologyForm.controls['label'].setValidators([Validators.required]);
        this.ontologyForm.controls['comment'].setValue(response.comment);
        // disable name input

        this.lastModificationDate = response.lastModificationDate;
      });
    }
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  buildForm() {
    // reset existing names
    this.existingNames = [new RegExp('anEmptyRegularExpressionWasntPossible')];

    // get all project ontologies and read the name
    // name has to be unique; if it already exists
    // show an error message
    for (const name of this.existingOntologyNames) {
      this.existingNames.push(new RegExp(`(?:^|W)${name}(?:$|W)`));
    }

    for (const name of this.forbiddenNames) {
      this.existingNames.push(new RegExp(name));
    }

    this.ontologyLabel = '';

    this.ontologyForm = this._fb.group({
      name: new UntypedFormControl(
        {
          value: '',
          disabled: false,
        },
        [
          Validators.required,
          Validators.minLength(this.nameMinLength),
          Validators.maxLength(this.nameMaxLength),
          existingNamesValidator(this.existingNames),
          Validators.pattern(CustomRegex.ID_NAME_REGEX),
        ]
      ),
      label: new UntypedFormControl(
        {
          value: this.ontologyLabel,
          disabled: false,
        },
        [Validators.required, Validators.minLength(this.nameMinLength)]
      ),
      comment: new UntypedFormControl({
        value: this.ontologyComment,
        disabled: false,
      }),
    });

    this.ontologyForm.valueChanges.subscribe(() => this.onValueChanged());

    if (!this.iri) {
      this.ontologyForm.get('name').valueChanges.subscribe(val => {
        this.ontologyForm.controls.label.setValue(this.capitalizeFirstLetter(val));
      });
    }
  }

  onValueChanged() {
    if (!this.ontologyForm) {
      return;
    }

    Object.keys(this.formErrors).forEach(field => {
      this.formErrors[field] = '';
      const control = this.ontologyForm.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.validationMessages[field];
        Object.keys(control.errors).forEach(key => {
          this.formErrors[field] += `${messages[key]} `;
        });
      }
    });
  }

  submitData() {
    this.loading = true;

    if (this.iri) {
      // edit mode
      const ontologyData = new UpdateOntologyMetadata();
      ontologyData.id = this.iri;
      ontologyData.lastModificationDate = this.lastModificationDate;
      ontologyData.label = this.ontologyForm.controls['label'].value;
      ontologyData.comment = this.ontologyForm.controls['comment'].value;

      this._dspApiConnection.v2.onto
        .updateOntology(ontologyData)
        .pipe(take(1))
        .subscribe(
          (response: OntologyMetadata) => {
            this.loadOntologies(response.id);
            this.updateParent.emit(response.id);
            this.closeDialog.emit(response.id);
          },
          (error: ApiResponseError) => {
            // in case of an error
            this.loading = false;
            this.error = true;

            this._errorHandler.showMessage(error);
          }
        );
    } else {
      // create mode
      const ontologyData = new CreateOntology();
      ontologyData.label = `${this.project.shortname}: ${this.ontologyForm.controls['label'].value}`;
      ontologyData.name = this.ontologyForm.controls['name'].value;
      ontologyData.comment = this.ontologyForm.controls['comment'].value;
      ontologyData.attachedToProject = this.project.id;

      this._dspApiConnection.v2.onto
        .createOntology(ontologyData)
        .pipe(take(1))
        .subscribe(
          (response: OntologyMetadata) => {
            this.loadOntologies(response.id);
            this.updateParent.emit(response.id);
            // go to the new ontology page
            const name = OntologyService.getOntologyName(response.id);
            this._router.navigate([RouteConstants.ontology, name, RouteConstants.editor, RouteConstants.classes], {
              relativeTo: this._route.parent,
            });
          },
          (error: ApiResponseError) => {
            // in case of an error... e.g. because the ontolog iri is not unique, rebuild the form including the error message
            this.formErrors['name'] += `${this.validationMessages['name']['existingName']} `;
            this.loading = false;

            this._errorHandler.showMessage(error);
          }
        );
    }
  }

  capitalizeFirstLetter(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private loadOntologies(currentOntologyId: string) {
    const projectIri = this._projectService.uuidToIri(this.projectUuid);
    this._store.dispatch([
      new ClearProjectOntologiesAction(this.projectUuid),
      new LoadProjectOntologiesAction(projectIri),
    ]);
    this._actions$
      .pipe(ofActionSuccessful(LoadListsInProjectAction))
      .pipe(take(1))
      .subscribe(() => {
        const projectOntologies = this._store.selectSnapshot(OntologiesSelectors.projectOntologies);
        const currentOntology = projectOntologies[projectIri]?.readOntologies.find(o => o.id === currentOntologyId);
        this._store.dispatch([
          new SetCurrentOntologyAction(currentOntology),
          new SetCurrentProjectOntologyPropertiesAction(projectIri),
          new CurrentOntologyCanBeDeletedAction(),
        ]);
        this.loading = false;
      });
  }
}
