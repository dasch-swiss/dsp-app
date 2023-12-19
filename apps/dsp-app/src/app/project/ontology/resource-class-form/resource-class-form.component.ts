import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import {
  ApiResponseError,
  ClassDefinition,
  CreateResourceClass,
  DeleteResourceClassComment,
  KnoraApiConnection,
  PropertyDefinition,
  ReadOntology,
  ResourceClassDefinitionWithAllLanguages,
  StringLiteral,
  UpdateOntology,
  UpdateResourceClassComment,
  UpdateResourceClassLabel,
} from '@dasch-swiss/dsp-js';
import { StringLiteralV2 } from '@dasch-swiss/dsp-js/src/models/v2/string-literal-v2';
import {
  DspApiConnectionToken,
  getAllEntityDefinitionsAsArray,
} from '@dasch-swiss/vre/shared/app-config';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { OntologiesSelectors } from '@dasch-swiss/vre/shared/app-state';
import { AppGlobal } from '@dsp-app/src/app/app-global';
import { DialogEvent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { existingNamesValidator } from '@dsp-app/src/app/main/directive/existing-name/existing-name.directive';
import { CustomRegex } from '@dsp-app/src/app/workspace/resource/values/custom-regex';
import { Store } from '@ngxs/store';

// nested form components; solution from:
// https://medium.com/@joshblf/dynamic-nested-reactive-forms-in-angular-654c1d4a769a

@Component({
  selector: 'app-resource-class-form',
  templateUrl: './resource-class-form.component.html',
  styleUrls: ['./resource-class-form.component.scss'],
})
export class ResourceClassFormComponent implements OnInit, AfterViewChecked {
  /**
   * current project uuid
   */
  @Input() projectUuid: string;

  /**
   * create mode: iri selected resource class is a subclass from knora base (baseClassIri)
   * edit mode: iri of resource class
   * e.g. knora-api:StillImageRepresentation
   */
  @Input() iri: string;

  /**
   * name of resource class type e.g. Still image
   * this will be used to update title of resource class form
   */
  @Input() name: string;

  /**
   * edit mode (true); otherwise create mode
   */
  @Input() edit: boolean;

  /**
   * emit event, when closing dialog
   */
  @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

  /**
   * update title and subtitle in dialog header (by switching from step 1 (resource class) to step 2 (properties))
   */
  @Output() updateParent: EventEmitter<{ title: string; subtitle: string }> =
    new EventEmitter<{ title: string; subtitle: string }>();

  // store name as resourceClassTitle on init; in this case it can't be overwritten in the next / prev navigation
  resourceClassTitle: string;

  // current ontology; will get it from application state service by key 'currentOntology'
  ontology: ReadOntology;

  // success of sending data
  success = false;

  // message after successful post
  successMessage: any = {
    status: 200,
    statusText:
      'You have successfully updated the resource class and all properties',
  };

  // progress
  loading: boolean;

  // in case of an error
  error: boolean;

  // form group, form array (for properties) errors and validation messages
  resourceClassForm: UntypedFormGroup;

  // label and comment are stringLiterals
  resourceClassLabels: StringLiteralV2[] = [];
  resourceClassLabelsTouched: boolean;
  resourceClassComments: StringLiteralV2[] = [];
  resourceClassCommentsTouched: boolean;

  // list of existing class names
  existingNames: [RegExp] = [
    new RegExp('anEmptyRegularExpressionWasntPossible'),
  ];

  // form errors on the following fields:
  formErrors = {
    name: '',
    label: '',
  };

  // in case of form error: show message
  validationMessages = {
    name: {
      required: 'Name is required.',
      existingName: 'This name is already taken. Please choose another one.',
      pattern:
        'Name cannot start with a number or a number prefixed with "v". Spaces or special characters (except dash, dot and underscore) are not allowed.',
    },
    label: {
      required: 'Label is required.',
    },
  };

  lastModificationDate: string;

  // for the language selector
  selectedLanguage = 'en';
  languages: StringLiteral[] = AppGlobal.languagesList;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _cdr: ChangeDetectorRef,
    private _errorHandler: AppErrorHandler,
    private _fb: UntypedFormBuilder,
    private _os: OntologyService,
    private _store: Store
  ) {}

  ngOnInit() {
    // set file representation or default resource class as title
    this.resourceClassTitle = this.name;

    this.ontology = this._store.selectSnapshot(
      OntologiesSelectors.currentOntology
    );
    this.lastModificationDate = this.ontology.lastModificationDate;

    const resourceClasses = getAllEntityDefinitionsAsArray(
      this.ontology.classes
    );
    const resourceProperties = getAllEntityDefinitionsAsArray(
      this.ontology.properties
    );

    // set list of all existing resource class names to avoid same name twice
    resourceClasses.forEach((resClass: ClassDefinition) => {
      const name = this._os.getNameFromIri(resClass.id);
      this.existingNames.push(
        new RegExp('(?:^|W)' + name.toLowerCase() + '(?:$|W)')
      );
    });

    // add all resource properties to the same list
    resourceProperties.forEach((resProp: PropertyDefinition) => {
      const name = this._os.getNameFromIri(resProp.id);
      this.existingNames.push(
        new RegExp('(?:^|W)' + name.toLowerCase() + '(?:$|W)')
      );
    });

    this.buildForm();

    this._cdr.detectChanges();
  }

  ngAfterViewChecked() {
    this._cdr.detectChanges();
  }

  onCancel() {
    // emit DialogCanceled event
    this.closeDialog.emit(DialogEvent.DialogCanceled);
  }

  //
  // form handling:

  buildForm() {
    if (this.edit) {
      // getClassDefinitionsByType is not accessible therefore following line was replaced from this:
      // const resourceClasses: ResourceClassDefinitionWithAllLanguages[] = this.ontology.getClassDefinitionsByType(ResourceClassDefinitionWithAllLanguages);
      const classDefinitions = getAllEntityDefinitionsAsArray(
        this.ontology.classes
      );
      // edit mode: res class info (label and comment)
      // get resource class info
      Object.keys(classDefinitions).forEach(key => {
        if (classDefinitions[key].id === this.iri) {
          this.resourceClassLabels = classDefinitions[key].labels;
          this.resourceClassComments = classDefinitions[key].comments;
        }
      });
    }

    this.resourceClassForm = this._fb.group({
      name: new UntypedFormControl(
        {
          value: this.edit ? this._os.getNameFromIri(this.iri) : '',
          disabled: this.edit,
        },
        [
          Validators.required,
          existingNamesValidator(this.existingNames),
          Validators.pattern(CustomRegex.ID_NAME_REGEX),
        ]
      ),
      label: new UntypedFormControl(
        {
          value: this.resourceClassLabels,
          disabled: false,
        },
        [Validators.required]
      ),
      comment: new UntypedFormControl({
        value: this.resourceClassComments,
        disabled: false,
      }),
    });

    this.resourceClassForm.valueChanges.subscribe(() => this.onValueChanged());
  }

  onValueChanged() {
    if (!this.resourceClassForm) {
      return;
    }

    Object.keys(this.formErrors).map(field => {
      this.formErrors[field] = '';
      const control = this.resourceClassForm.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.validationMessages[field];
        Object.keys(control.errors).map(key => {
          this.formErrors[field] += messages[key] + ' ';
        });
      }
    });
  }

  /**
   * set stringLiterals for label or comment from dsp-string-literal-input
   * @param  {StringLiteral[]} data
   * @param  {string} type
   */
  handleData(data: StringLiteral[], type: 'label' | 'comment') {
    switch (type) {
      case 'label':
        this.resourceClassLabels = data;
        this.resourceClassForm.controls['label'].setValue(data);
        this.handleError(this.resourceClassLabelsTouched, type);
        break;

      case 'comment':
        this.resourceClassComments = data;
        this.handleError(this.resourceClassCommentsTouched, type);
        break;
    }
  }

  /**
   * error handle for string literals input
   * @param touched
   * @param type
   */
  handleError(touched: boolean, type: 'label' | 'comment') {
    const checkValue =
      type === 'label' ? this.resourceClassLabels : this.resourceClassComments;
    const messages = this.validationMessages[type];

    this.formErrors[type] = '';
    if (touched && !checkValue.length) {
      this.formErrors[type] = messages['required'];
    }
  }

  //
  // submit

  /**
   * submit data to create resource class with properties and cardinalities
   */
  submitData() {
    this.loading = true;
    if (this.edit) {
      // edit mode: res class info (label and comment)
      // label
      const onto4Label = new UpdateOntology<UpdateResourceClassLabel>();
      onto4Label.id = this.ontology.id;
      onto4Label.lastModificationDate = this.lastModificationDate;

      const updateLabel = new UpdateResourceClassLabel();
      updateLabel.id = this.iri;
      updateLabel.labels = this.resourceClassLabels;
      onto4Label.entity = updateLabel;

      // comment
      const onto4Comment = new UpdateOntology<UpdateResourceClassComment>();
      onto4Comment.id = this.ontology.id;

      const updateComment = new UpdateResourceClassComment();
      updateComment.id = this.iri;
      updateComment.comments = this.resourceClassComments;
      onto4Comment.entity = updateComment;

      this._dspApiConnection.v2.onto.updateResourceClass(onto4Label).subscribe(
        (classLabelResponse: ResourceClassDefinitionWithAllLanguages) => {
          this.lastModificationDate = classLabelResponse.lastModificationDate;
          onto4Comment.lastModificationDate = this.lastModificationDate;

          if (updateComment.comments.length) {
            // if the comments array is not empty, send a request to update the comments
            this._dspApiConnection.v2.onto
              .updateResourceClass(onto4Comment)
              .subscribe(
                (
                  classCommentResponse: ResourceClassDefinitionWithAllLanguages
                ) => {
                  this.lastModificationDate =
                    classCommentResponse.lastModificationDate;

                  // close the dialog box
                  this.loading = false;
                  this.closeDialog.emit();
                },
                (error: ApiResponseError) => {
                  this._errorHandler.showMessage(error);
                }
              );
          } else {
            // if the comments array is empty, send a request to remove the comments
            const deleteResourceClassComment = new DeleteResourceClassComment();
            deleteResourceClassComment.id = this.iri;
            deleteResourceClassComment.lastModificationDate =
              this.lastModificationDate;

            this._dspApiConnection.v2.onto
              .deleteResourceClassComment(deleteResourceClassComment)
              .subscribe(
                (
                  deleteCommentResponse: ResourceClassDefinitionWithAllLanguages
                ) => {
                  this.lastModificationDate =
                    deleteCommentResponse.lastModificationDate;

                  // close the dialog box
                  this.loading = false;
                  this.closeDialog.emit();
                },
                (error: ApiResponseError) => {
                  this._errorHandler.showMessage(error);
                }
              );
          }
        },
        (error: ApiResponseError) => {
          this._errorHandler.showMessage(error);
        }
      );
    } else {
      // create mode
      // submit resource class data to knora and create resource class incl. cardinality

      const onto = new UpdateOntology<CreateResourceClass>();

      onto.id = this.ontology.id;
      onto.lastModificationDate = this.lastModificationDate;

      const newResClass = new CreateResourceClass();

      newResClass.name = this.resourceClassForm.controls['name'].value;
      newResClass.label = this.resourceClassLabels;
      newResClass.comment = this.resourceClassComments;
      newResClass.subClassOf = [this.iri];

      onto.entity = newResClass;

      this._dspApiConnection.v2.onto.createResourceClass(onto).subscribe(
        (classResponse: ResourceClassDefinitionWithAllLanguages) => {
          // need lmd from classResponse
          this.lastModificationDate = classResponse.lastModificationDate;
          // close the dialog box
          this.loading = false;
          this.closeDialog.emit();
        },
        (error: ApiResponseError) => {
          this._errorHandler.showMessage(error);
        }
      );
    }
  }

  /**
   * close dialog box and reset all forms
   */
  closeMessage() {
    this.resourceClassForm.reset();
    this.closeDialog.emit();
  }
}
