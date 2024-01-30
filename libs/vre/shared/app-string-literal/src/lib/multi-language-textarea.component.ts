import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { NgxsStoreModule } from '@dasch-swiss/vre/shared/app-state';
import { HumanReadableErrorPipe } from './human-readable-error.pipe';
import { MultiLanguageFormService } from './multi-language-form.service';

@Component({
  selector: 'dasch-swiss-multi-language-textarea',
  standalone: true,
  providers: [MultiLanguageFormService],
  imports: [
    CommonModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    FormsModule,
    ReactiveFormsModule,
    NgxsStoreModule,
    HumanReadableErrorPipe,
  ],
  template: `
    <div style="display: flex; flex-direction: row-reverse">
      <mat-form-field style="flex: 1" subscriptSizing="dynamic" class="formfield">
        <textarea
          matInput
          rows="9"
          [placeholder]="placeholder"
          #textInput
          [readonly]="!editable"
          [ngModel]="formService.inputValue"
          (ngModelChange)="formService.onInputChange($event)"></textarea>
      </mat-form-field>
      <mat-button-toggle-group matPrefix #group="matButtonToggleGroup" vertical>
        <mat-button-toggle
          *ngFor="let lang of formService.availableLanguages; let index = index"
          (click)="formService.changeLanguage(index); textInput.focus()"
          [checked]="index === formService.selectedLanguageIndex"
          [class.bold]="formService.getFormControlWithLanguage(lang) !== undefined">
          <span>{{ lang }}</span>
        </mat-button-toggle>
      </mat-button-toggle-group>
    </div>
    <mat-error *ngIf="formService.formArray.invalid && formService.formArray.touched">
      <ng-container *ngIf="formService.invalidErrors?.language"
        >Language {{ formService.invalidErrors.language }}:
        {{ formService.invalidErrors.error | humanReadableError }}</ng-container
      >
      <ng-container *ngIf="!formService.invalidErrors?.language">{{
        formService.invalidErrors.error | humanReadableError
      }}</ng-container>
    </mat-error>
  `,
  styles: [
    `
      :host {
        display: block;
        padding-bottom: 22px;
      }

      .bold {
        font-weight: bold;
      }
    `,
  ],
})
export class MultiLanguageTextareaComponent implements OnInit {
  @Input() formGroup: FormGroup;
  @Input() controlName: string;
  @Input() editable = true;
  @Input() placeholder: string;
  @Input() validators: ValidatorFn[];

  constructor(public formService: MultiLanguageFormService) {}

  ngOnInit() {
    this.formService.onInit(this.formGroup, this.controlName, this.validators);
  }
}
