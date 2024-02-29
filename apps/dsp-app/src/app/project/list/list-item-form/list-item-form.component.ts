import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ListInfoResponse, ListNode, ListNodeInfoResponse } from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/shared/app-api';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { MultiLanguageFormArray } from '@dasch-swiss/vre/shared/app-string-literal';
import { atLeastOneStringRequired } from '../../../main/form-validators/at-least-one-string-required.validator';
import { ListItemService } from '../list-item/list-item.service';

export class ListNodeOperation {
  operation: 'create' | 'insert' | 'update' | 'delete' | 'reposition';
  listNode: ListNode;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-list-item-form',
  template: `
    <form [formGroup]="form" (ngSubmit)="createChildNode()" style="display: flex">
      <dasch-swiss-multi-language-input
        style="flex: 1"
        [formArray]="labelsControl"
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
  form: FormGroup;

  // TODO remove with typed forms
  get labelsControl() {
    return this.form.get('labels') as MultiLanguageFormArray;
  }

  readonly labelsValidators = [Validators.maxLength(2000)];

  constructor(
    private _listApiService: ListApiService,
    private _fb: FormBuilder,
    private _cd: ChangeDetectorRef,
    private _listItemService: ListItemService
  ) {}

  ngOnInit() {
    this._buildForm();

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
      labels: this.form.value.labels,
      name: `${ProjectService.IriToUuid(this._listItemService.projectInfos.projectIri)}-${Math.random()
        .toString(36)
        .substring(2)}${Math.random().toString(36).substring(2)}`,
    };

    this._listApiService.createChildNode(data.parentNodeIri, data).subscribe(() => {
      this.loading = false;
      this._resetForm();
      this._listItemService.onUpdate$.next();
    });
  }

  private _buildForm() {
    this.form = this._fb.group({
      labels: this._fb.array([], atLeastOneStringRequired('value')),
    });
  }

  private _resetForm() {
    (this.form.get('labels') as FormArray).clear();
  }
}
