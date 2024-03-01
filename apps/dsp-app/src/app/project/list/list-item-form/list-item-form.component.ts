import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ListInfoResponse, ListNodeInfoResponse } from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/shared/app-api';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { DEFAULT_MULTILANGUAGE_FORM } from '@dasch-swiss/vre/shared/app-string-literal';
import { atLeastOneStringRequired } from '../../../main/form-validators/at-least-one-string-required.validator';
import { ListItemService } from '../list-item/list-item.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-list-item-form',
  template: `
    <form [formGroup]="form" style="display: flex" (ngSubmit)="createChildNode()">
      <dasch-swiss-multi-language-input
        style="flex: 1"
        [formArray]="form.controls.labels"
        [placeholder]="placeholder"
        [validators]="labelsValidators">
      </dasch-swiss-multi-language-input>
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
export class ListItemFormComponent implements OnInit {
  loading = false;
  placeholder: string;
  form = this._fb.group({ labels: DEFAULT_MULTILANGUAGE_FORM([], [], [atLeastOneStringRequired('value')]) });

  readonly labelsValidators = [Validators.maxLength(2000)];

  constructor(
    private _listApiService: ListApiService,
    private _cd: ChangeDetectorRef,
    private _listItemService: ListItemService,
    private _fb: FormBuilder
  ) {}

  ngOnInit() {
    this._listApiService.getNodeInfo(this._listItemService.projectInfos.rootNodeIri).subscribe(response => {
      if (response['listinfo']) {
        // root node
        this.placeholder = `Append item to ${(response as ListInfoResponse).listinfo.labels[0].value}`;
      } else {
        // child node
        this.placeholder = `Append item to ${(response as ListNodeInfoResponse).nodeinfo.labels[0].value}`;
      }

      this._cd.markForCheck();
    });
  }

  createChildNode() {
    this.loading = true;

    const data = {
      parentNodeIri: this._listItemService.projectInfos.rootNodeIri,
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
