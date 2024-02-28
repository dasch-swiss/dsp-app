import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClassDefinition, PropertyDefinition } from '@dasch-swiss/dsp-js';
import { getAllEntityDefinitionsAsArray } from '@dasch-swiss/vre/shared/app-api';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { OntologiesSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { Subscription } from 'rxjs';
import { existingNamesValidator } from '../../../main/directive/existing-name/existing-names.validator';
import { atLeastOneStringRequired } from '../../../main/form-validators/at-least-one-string-required.validator';
import { CustomRegex } from '../../../workspace/resource/values/custom-regex';

@Component({
  selector: 'app-resource-class-form',
  template: `
    <form [formGroup]="form">
      <app-common-input
        class="name-input"
        data-cy="name-input"
        [formGroup]="form"
        controlName="name"
        placeholder="Class name *"
        prefixIcon="fingerprint"></app-common-input>

      <dasch-swiss-multi-language-input
        data-cy="label-input"
        placeholder="Label *"
        [formGroup]="form"
        controlName="labels"
        [validators]="labelsValidators">
      </dasch-swiss-multi-language-input>

      <dasch-swiss-multi-language-textarea
        data-cy="comment-textarea"
        placeholder="Comment *"
        [formGroup]="form"
        controlName="comments"
        [editable]="true"
        [validators]="commentsValidators">
      </dasch-swiss-multi-language-textarea>
    </form>
  `,
  styles: [':host ::ng-deep .name-input .mat-icon { padding-right: 24px; }'],
})
export class ResourceClassFormComponent implements OnInit, OnDestroy {
  @Input() formData: {
    name: string;
    labels: { language: string; value: string }[];
    comments: { language: string; value: string }[];
  };
  @Output() formValueChange = new EventEmitter<FormGroup>();

  form: FormGroup;
  existingNames: [RegExp] = [new RegExp('anEmptyRegularExpressionWasntPossible')];
  ontology;
  subscription: Subscription;
  readonly labelsValidators = [Validators.maxLength(2000)];
  readonly commentsValidators = [Validators.maxLength(2000)];

  constructor(
    private _fb: FormBuilder,
    private _os: OntologyService,
    private _store: Store
  ) {}

  ngOnInit() {
    this.ontology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);
    const resourceClasses = getAllEntityDefinitionsAsArray(this.ontology.classes);
    const resourceProperties = getAllEntityDefinitionsAsArray(this.ontology.properties);

    // set list of all existing resource class names to avoid same name twice
    resourceClasses.forEach((resClass: ClassDefinition) => {
      const name = this._os.getNameFromIri(resClass.id);
      this.existingNames.push(new RegExp(`(?:^|W)${name.toLowerCase()}(?:$|W)`));
    });

    // add all resource properties to the same list
    resourceProperties.forEach((resProp: PropertyDefinition) => {
      const name = this._os.getNameFromIri(resProp.id);
      this.existingNames.push(new RegExp(`(?:^|W)${name}(?:$|W)`));
    });

    this.buildForm();

    this.subscription = this.form.valueChanges.subscribe(z => {
      this.formValueChange.emit(this.form);
    });
    this.formValueChange.emit(this.form);
  }

  buildForm() {
    this.form = this._fb.group({
      name: [
        this.formData.name,
        [
          Validators.required,
          existingNamesValidator(this.existingNames, true),
          Validators.pattern(CustomRegex.ID_NAME_REGEX),
        ],
      ],
      labels: this._fb.array(
        this.formData.labels.map(({ language, value }) =>
          this._fb.group({
            language,
            value: [value, this.labelsValidators],
          })
        ),
        atLeastOneStringRequired('value')
      ),
      comments: this._fb.array(
        this.formData.comments.map(({ language, value }) =>
          this._fb.group({
            language,
            value: [value, this.commentsValidators],
          })
        ),
        atLeastOneStringRequired('value')
      ),
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
