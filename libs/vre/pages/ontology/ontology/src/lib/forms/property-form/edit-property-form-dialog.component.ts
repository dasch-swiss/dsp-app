import { Component, inject, Inject, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { StringLiteralV2 } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { LoadingButtonDirective } from '@dasch-swiss/vre/ui/progress-indicator';
import { DialogHeaderComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { PropertyFormComponent } from './property-form.component';
import {
  CreatePropertyData,
  CreatePropertyDialogData,
  EditPropertyDialogData,
  PropertyForm,
  UpdatePropertyData,
} from './property-form.type';

@Component({
  selector: 'app-edit-property-form-dialog',
  template: ` <app-dialog-header [title]="title" [subtitle]="data.propType.group + ': ' + data.propType.label || ''" />
    <!-- A property is shared: editing it from one class changes it in every class that has it. -->
    @if (sharedWith(); as classes) {
      <p class="shared" data-cy="property-shared-note">
        <mat-icon>info</mat-icon>
        <span>{{ 'pages.dataModels.propertyShared' | translate: classes }}</span>
      </p>
    }
    <app-property-form mat-dialog-content (afterFormInit)="form = $event" [propertyData]="data" />
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'ui.common.actions.cancel' | translate }}</button>
      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        data-cy="submit-button"
        [isLoading]="loading"
        [disabled]="form.invalid"
        (click)="onSubmit()">
        {{ 'ui.common.actions.submit' | translate }}
      </button>
    </div>`,
  imports: [
    DialogHeaderComponent,
    LoadingButtonDirective,
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatIcon,
    PropertyFormComponent,
    TranslatePipe,
  ],
  styleUrl: './edit-property-form-dialog.component.css',
})
export class EditPropertyFormDialogComponent implements OnInit {
  loading = false;
  form!: PropertyForm;

  protected readonly _translate = inject(TranslateService);

  isPropertyEditData(data: EditPropertyDialogData | CreatePropertyDialogData): data is EditPropertyDialogData {
    return 'id' in data;
  }

  /** The classes that share the property, named up to three, for the note; nothing when only one class has it. */
  sharedWith(): { classes: string; count: number } | undefined {
    const usedBy = this.isPropertyEditData(this.data) ? (this.data.usedBy ?? []) : [];
    if (usedBy.length < 2) return undefined;
    const named = usedBy.slice(0, 3);
    const more = usedBy.length - named.length;
    return {
      classes: more
        ? this._translate.instant('pages.dataModels.andMore', { names: named.join(', '), count: more })
        : named.join(', '),
      count: usedBy.length,
    };
  }

  get title(): string {
    return this.isPropertyEditData(this.data)
      ? this._translate.instant('pages.ontology.propertyForm.editTitle')
      : this._translate.instant('pages.ontology.propertyForm.createTitle');
  }

  constructor(
    private readonly _dialogRef: MatDialogRef<EditPropertyFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreatePropertyDialogData | EditPropertyDialogData,
    private _oes: OntologyEditService
  ) {}

  ngOnInit() {
    this._dialogRef.updateSize('800px', '');
  }

  onSubmit() {
    this.loading = true;
    let propertyData: CreatePropertyData | UpdatePropertyData;
    if (this.isPropertyEditData(this.data)) {
      propertyData = {
        id: this.data.id,
        labels: this.form.controls.labels.touched ? (this.form.controls.labels.value as StringLiteralV2[]) : undefined,
        comment: this.form.controls.comments.touched
          ? (this.form.controls.comments.value as StringLiteralV2[])
          : undefined,
      } as UpdatePropertyData;
      this._oes
        .updateProperty$(propertyData)
        .pipe(take(1))
        .subscribe(_ => {
          // Closing with the update tells whoever opened the dialog that the property was saved.
          this._dialogRef.close(propertyData);
        });
    } else {
      propertyData = {
        name: this.form.controls.name.value,
        labels: this.form.controls.labels.value as StringLiteralV2[],
        comment: this.form.controls.comments.value as StringLiteralV2[],
        propType: this.data.propType,
        guiAttribute: this.form.controls.guiAttr.value,
        objectType: this.form.controls.objectType.value,
      } as CreatePropertyData;
      this._oes
        .createProperty$(propertyData, this.data.assignToClass)
        .pipe(take(1))
        .subscribe(_ => {
          // Closing with its name tells whoever opened the dialog which property was made.
          this._dialogRef.close((propertyData as CreatePropertyData).name);
        });
    }
  }
}
