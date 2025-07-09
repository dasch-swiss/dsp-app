import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ListNodeInfo } from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { atLeastOneStringRequired } from '@dasch-swiss/vre/shared/app-common';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { DEFAULT_MULTILANGUAGE_FORM } from '@dasch-swiss/vre/ui/string-literal';
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
        [isRequired]="true" />
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
})
export class ListItemFormComponent {
  @Input({ required: true }) parentNode!: ListNodeInfo;
  loading = false;
  form = this._fb.group({ labels: DEFAULT_MULTILANGUAGE_FORM([], [], [atLeastOneStringRequired('value')]) });

  readonly labelsValidators = [Validators.maxLength(2000)];

  get placeholder() {
    return `Append item to ${this.parentNode.labels[0].value}`;
  }

  constructor(
    private _listApiService: ListApiService,
    private _listItemService: ListItemService,
    private _fb: FormBuilder
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
