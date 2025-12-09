import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-nullable-editor',
  imports: [MatIconButton, TranslateModule, MatTooltip, MatIcon],
  template: `
    @if (value !== null) {
      <div style="display: flex; align-items: center">
        <ng-content />
        <button
          mat-icon-button
          (click)="setValue(null)"
          [title]="'resourceEditor.templateSwitcher.nullableEditor.remove' | translate"
          data-cy="add-value-button"
          [matTooltip]="'resourceEditor.templateSwitcher.nullableEditor.removeTooltip' | translate">
          <mat-icon>cancel</mat-icon>
        </button>
      </div>
    } @else {
      <button
        mat-icon-button
        (click)="setValue(defaultValue)"
        [title]="'resourceEditor.templateSwitcher.nullableEditor.add' | translate"
        data-cy="add-value-button"
        [matTooltip]="'resourceEditor.templateSwitcher.nullableEditor.addTooltip' | translate">
        <mat-icon>add_box</mat-icon>
      </button>
    }
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NullableEditorComponent),
      multi: true,
    },
  ],
  standalone: true,
})
export class NullableEditorComponent implements ControlValueAccessor {
  @Input({ required: true }) defaultValue!: unknown;

  value: unknown = null;
  private onChange: (_: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(obj: unknown): void {
    this.value = obj;
  }

  registerOnChange(fn: (_: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setValue(val: unknown): void {
    this.value = val;
    this.onChange(val);
    this.onTouched();
  }
}
