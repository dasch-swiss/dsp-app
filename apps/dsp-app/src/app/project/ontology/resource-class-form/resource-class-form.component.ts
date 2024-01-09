import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClassDefinition, PropertyDefinition } from '@dasch-swiss/dsp-js';
import { getAllEntityDefinitionsAsArray } from '@dasch-swiss/vre/shared/app-config';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { OntologiesSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { Subscription } from 'rxjs';
import { existingNamesValidator } from '../../../main/directive/existing-name/existing-name.directive';
import { CustomRegex } from '../../../workspace/resource/values/custom-regex';
import { atLeastOneStringRequired } from '../../reusable-project-form/at-least-one-string-required.validator';

@Component({
  selector: 'app-resource-class-form',
  template: `
    <form [formGroup]="form">
      <app-common-input
        class="name-input"
        [formGroup]="form"
        controlName="name"
        placeholder="Class name *"
        prefixIcon="fingerprint"></app-common-input>

      <dasch-swiss-multi-language-input placeholder="Label *" [formGroup]="form" controlName="labels">
      </dasch-swiss-multi-language-input>

      <dasch-swiss-multi-language-textarea
        placeholder="Comment *"
        [formGroup]="form"
        controlName="comments"
        [editable]="true">
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
      this.existingNames.push(new RegExp(`(?:^|W)${name.toLowerCase()}(?:$|W)`));
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
          existingNamesValidator(this.existingNames),
          Validators.pattern(CustomRegex.ID_NAME_REGEX),
        ],
      ],
      labels: this._fb.array(
        this.formData.labels.map(({ language, value }) =>
          this._fb.group({
            language,
            value: [value, [Validators.maxLength(2000)]],
          })
        ),
        atLeastOneStringRequired('value')
      ),
      comments: this._fb.array(
        this.formData.comments.map(({ language, value }) =>
          this._fb.group({
            language,
            value: [value, [Validators.maxLength(2000)]],
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
