import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

/**
 * Chip-based editor for a data-side authorship list bound to a nonNullable `FormControl<string[]>`.
 *
 * Kept small and focused: no autocomplete, no seeded defaults — the caller wires the control shape,
 * label and placeholder. Add/remove operations mutate the bound control and mark it dirty so
 * `[disabled]="form.pristine"` on Save behaves naturally.
 */
@Component({
  selector: 'app-authorship-chip-editor',
  template: `
    <mat-form-field style="width: 100%">
      @if (label) {
        <mat-label>{{ label }}</mat-label>
      }
      <mat-chip-grid #chipGrid [attr.aria-label]="ariaLabel">
        @for (author of control.value; track $index) {
          <mat-chip-row (removed)="remove($index)">
            {{ author }}
            <button type="button" matChipRemove [attr.aria-label]="removeAuthorLabel(author)">
              <mat-icon>cancel</mat-icon>
            </button>
          </mat-chip-row>
        }
        <input
          autocomplete="off"
          [attr.aria-label]="ariaLabel"
          [attr.data-cy]="dataCy"
          [placeholder]="placeholder"
          [matChipInputFor]="chipGrid"
          (matChipInputTokenEnd)="add($event)" />
      </mat-chip-grid>
    </mat-form-field>
  `,
  imports: [MatChipsModule, MatFormFieldModule, MatIconModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorshipChipEditorComponent {
  /** The bound authorship list. Must be nonNullable so the component can safely spread `.value`. */
  @Input({ required: true }) control!: FormControl<string[]>;
  /** Accessible name for the chip grid + input (also used as the visible mat-label if `label` is unset). */
  @Input({ required: true }) ariaLabel = '';
  /** Optional visible label shown above the chip input. Omit to render an unlabeled field. */
  @Input() label?: string;
  /** Placeholder rendered inside the input when the chip list is empty. */
  @Input() placeholder = '';
  /** Optional data-cy hook for E2E tests. */
  @Input() dataCy?: string;

  /** Builder for the per-chip remove-button aria-label. Interpolates the author name in a plain string. */
  @Input() removeAuthorLabel: (name: string) => string = name => `Remove ${name}`;

  add(event: MatChipInputEvent): void {
    const trimmed = (event.value || '').trim();
    event.chipInput?.clear();
    if (!trimmed) {
      return;
    }
    this.control.setValue([...this.control.value, trimmed]);
    this.control.markAsDirty();
  }

  remove(index: number): void {
    this.control.setValue(this.control.value.filter((_, i) => i !== index));
    this.control.markAsDirty();
  }
}
