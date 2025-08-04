import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ProjectLicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { FileForm } from '@dasch-swiss/vre/resource-editor/representations';

@Component({
  selector: 'app-create-resource-form-file',
  template: ` <app-create-resource-form-representation
      [control]="form.controls.link"
      [fileRepresentation]="fileRepresentation"
      [projectShortcode]="projectShortcode"
      (externalImageSelected)="externalImageSelected.emit($event)" />

    <app-create-resource-form-legal [formGroup]="form.controls.legal" [projectShortcode]="projectShortcode" />`,
})
export class CreateResourceFormFileComponent implements OnInit {
  @Input({ required: true }) projectShortcode!: string;
  @Input({ required: true }) fileRepresentation!: string;
  @Output() externalImageSelected = new EventEmitter<boolean>();
  @Output() afterFormCreated = new EventEmitter<FileForm>();

  form = this._fb.group({
    link: [null as string | null, [Validators.required]],
    legal: this._fb.group({
      copyrightHolder: null as string | null,
      license: null as ProjectLicenseDto | null,
      authorship: null as string[] | null,
    }),
  }) as unknown as FileForm;

  constructor(private _fb: FormBuilder) {}

  ngOnInit() {
    this.afterFormCreated.emit(this.form);
  }
}
