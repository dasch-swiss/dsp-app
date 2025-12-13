import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ListNodeInfo } from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { atLeastOneStringRequired } from '@dasch-swiss/vre/shared/app-common';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { DEFAULT_MULTILANGUAGE_FORM, MultiLanguageInputComponent } from '@dasch-swiss/vre/ui/string-literal';
import { TranslateService } from '@ngx-translate/core';
import { ListItemService } from '../list-item/list-item.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-list-item-form',
  template: `
    <form [formGroup]="form" style="display: flex" (ngSubmit)="createChildNode()">
      <app-multi-language-input
        style="flex: 1"
        [formArray]="form.controls.labels"
        [placeholder]="placeholder"
        [validators]="labelsValidators"
        [isRequired]="false" />
      <button color="primary" mat-icon-button matSuffix [disabled]="form.invalid" type="submit">
        <mat-icon> add</mat-icon>
      </button>
    </form>
  `,
  styles: [
    `
      :host ::ng-deep mat-error {
        display: none;
      }
    `,
  ],
  imports: [ReactiveFormsModule, MatIconButton, MatIcon, MultiLanguageInputComponent],
})
export class ListItemFormComponent {
  @Input({ required: true }) parentNode!: ListNodeInfo;
  loading = false;
  form = this._fb.group({ labels: DEFAULT_MULTILANGUAGE_FORM([], [], [atLeastOneStringRequired('value')]) });

  private readonly _translate = inject(TranslateService);
  readonly labelsValidators = [Validators.maxLength(2000)];

  get placeholder() {
    return this._translate.instant('pages.ontology.list.listItemForm.appendItem', {
      parent: this.parentNode.labels[0].value,
    });
  }

  constructor(
    private readonly _listApiService: ListApiService,
    private readonly _listItemService: ListItemService,
    private readonly _fb: FormBuilder
  ) {}

  createChildNode() {
    this.loading = true;
    const data = {
      parentNodeIri: this.parentNode.id,
      projectIri: this._listItemService.projectInfos.projectIri,
      labels: this.form.controls.labels.getRawValue(),
      name: `${ProjectService.IriToUuid(this._listItemService.projectInfos.projectIri)}-${Math.random()
        .toString(36)
        .substring(2)}${Math.random().toString(36).substring(2)}`,
    };

    this._listApiService.createChildNode(data.parentNodeIri, data).subscribe(() => {
      this.loading = false;
      this.form.controls.labels.clear();
      this._listItemService.onUpdate$.next();
    });
  }
}
