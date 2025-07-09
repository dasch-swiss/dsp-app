import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ClassDefinition, PropertyDefinition } from '@dasch-swiss/dsp-js';
import { getAllEntityDefinitionsAsArray } from '@dasch-swiss/vre/3rd-party-services/api';
import { existingNamesValidator } from '@dasch-swiss/vre/pages/user-settings/user';
import { atLeastOneStringRequired, CustomRegex } from '@dasch-swiss/vre/shared/app-common';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { DEFAULT_MULTILANGUAGE_FORM, MultiLanguages } from '@dasch-swiss/vre/ui/string-literal';
import { take } from 'rxjs/operators';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { ResourceClassForm } from './resource-class-form.type';

@Component({
  selector: 'app-resource-class-form',
  template: `
    <form [formGroup]="form">
      <app-common-input
        class="name-input"
        data-cy="name-input"
        [control]="form.controls.name"
        label="Class name"
        [validatorErrors]="[{ errorKey: 'pattern', message: 'This pattern is not supported' }]"
        prefixIcon="fingerprint" />

      <app-multi-language-input
        data-cy="label-input"
        placeholder="Label"
        [formArray]="form.controls.labels"
        [validators]="labelsValidators"
        [isRequired]="true" />

      <app-multi-language-textarea
        data-cy="comment-textarea"
        placeholder="Comment"
        [formArray]="form.controls.comments"
        [editable]="true"
        [validators]="commentsValidators"
        [isRequired]="true" />
    </form>
  `,
  styles: [':host ::ng-deep .name-input .mat-icon { padding-right: 24px; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    private _oes: OntologyEditService,
    private _os: OntologyService
  ) {}

  ngOnInit() {
    this._oes.currentOntology$.pipe(take(1)).subscribe(ontology => {
      if (!ontology) {
        return;
      }

      const resourceClasses = getAllEntityDefinitionsAsArray(ontology.classes);
      const resourceProperties = getAllEntityDefinitionsAsArray(ontology.properties);

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
    });
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
