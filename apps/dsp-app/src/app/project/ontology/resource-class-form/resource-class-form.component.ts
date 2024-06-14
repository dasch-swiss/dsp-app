import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ClassDefinition, PropertyDefinition } from '@dasch-swiss/dsp-js';
import { getAllEntityDefinitionsAsArray } from '@dasch-swiss/vre/shared/app-api';
import { CustomRegex, atLeastOneStringRequired } from '@dasch-swiss/vre/shared/app-common';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { OntologiesSelectors } from '@dasch-swiss/vre/shared/app-state';
import { DEFAULT_MULTILANGUAGE_FORM, MultiLanguages } from '@dasch-swiss/vre/shared/app-string-literal';
import { Store } from '@ngxs/store';
import { existingNamesValidator } from '../../../main/directive/existing-name/existing-names.validator';
import { ResourceClassForm } from './resource-class-form.type';

@Component({
  selector: 'app-resource-class-form',
  template: `
    <form [formGroup]="form">
      <app-common-input
        class="name-input"
        data-cy="name-input"
        [control]="form.controls.name"
        label="Class name *"
        [validatorErrors]="[{ errorKey: 'pattern', message: 'This pattern is not supported' }]"
        prefixIcon="fingerprint" />

      <dasch-swiss-multi-language-input
        data-cy="label-input"
        placeholder="Label *"
        [formArray]="form.controls.labels"
        [validators]="labelsValidators">
      </dasch-swiss-multi-language-input>

      <dasch-swiss-multi-language-textarea
        data-cy="comment-textarea"
        placeholder="Comment *"
        [formArray]="form.controls.comments"
        [editable]="true"
        [validators]="commentsValidators">
      </dasch-swiss-multi-language-textarea>
    </form>
  `,
  styles: [':host ::ng-deep .name-input .mat-icon { padding-right: 24px; }'],
})
export class ResourceClassFormComponent implements OnInit {
  @Input() formData: {
    name: string;
    labels: MultiLanguages;
    comments: MultiLanguages;
  };
  @Output() afterFormInit = new EventEmitter<ResourceClassForm>();

  form: ResourceClassForm;
  ontology;
  readonly existingNames: RegExp[] = [];
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

    this.afterFormInit.emit(this.form);
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
      labels: DEFAULT_MULTILANGUAGE_FORM(this.formData.labels, this.labelsValidators, [
        atLeastOneStringRequired('value'),
      ]),
      comments: DEFAULT_MULTILANGUAGE_FORM(this.formData.comments, this.commentsValidators, [
        atLeastOneStringRequired('value'),
      ]),
    });
  }
}
