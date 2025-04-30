import { Component, Input, OnChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Constants } from '@dasch-swiss/dsp-js';
import { FileRepresentationType } from '@dasch-swiss/vre/resource-editor/representations';

@Component({
  selector: 'app-create-resource-form-representation',
  template: `
    <app-upload-control
      *ngIf="fileRepresentation !== Constants.HasStillImageFileValue; else stillImageTpl"
      [formControl]="control"
      [representation]="fileRepresentation"
      style="display: block; margin-bottom: 16px" />

    <ng-template #stillImageTpl>
      <mat-tab-group preserveContent data-cy="stillimage-tab-group">
        <mat-tab label="Upload Image">
          <app-upload-control [formControl]="control" [representation]="fileRepresentation" data-cy="upload-control" />
        </mat-tab>

        <mat-tab label="External IIIF URL">
          <app-third-part-iiif [formControl]="control" />
        </mat-tab>
      </mat-tab-group>
    </ng-template>
  `,
})
export class CreateResourceFormRepresentationComponent implements OnChanges {
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input({ required: true }) fileRepresentation!: FileRepresentationType;
  protected readonly Constants = Constants;

  ngOnChanges() {
    console.log('representation', this);
  }
}
