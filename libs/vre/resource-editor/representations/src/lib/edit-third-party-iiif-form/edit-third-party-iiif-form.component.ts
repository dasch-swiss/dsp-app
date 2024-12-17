import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ThirdPartyIiifProps, ThirdPartyIiiifForm } from './edit-third-party-iiif-types';

@Component({
  selector: 'app-edit-third-party-iiif-form',
  templateUrl: './edit-third-party-iiif-form.component.html',
})
export class EditThirdPartyIiifFormComponent {
  thirdPartyIiifForm: ThirdPartyIiiifForm;
  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ThirdPartyIiifProps,
    public dialogRef: MatDialogRef<ThirdPartyIiifProps>
  ) {
    this.thirdPartyIiifForm = new FormGroup({
      fileValue: new FormControl(data.fileValue, [Validators.required]),
    });
  }

  submitData() {
    this.loading = true;
    delete (this.thirdPartyIiifForm.value.fileValue as any)?.filename;
    this.dialogRef.close(this.thirdPartyIiifForm.value.fileValue);
  }
}
