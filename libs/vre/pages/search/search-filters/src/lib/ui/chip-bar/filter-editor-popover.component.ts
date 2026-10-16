import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { StatementElement } from '../../model';
import { StatementDraftStore } from '../../service/statement-draft.store';
import { StatementFieldsComponent } from '../statement-builder/statement-fields.component';

@Component({
  selector: 'app-filter-editor-popover',
  standalone: true,
  imports: [MatButtonModule, StatementFieldsComponent, TranslateModule],
  template: `
    <div class="filter-editor-popover mat-elevation-z4" (keydown.enter)="onEnter($event)">
      <app-statement-fields [statement]="statement" [showErrors]="showErrors()" />

      <div class="filter-editor-popover__actions">
        <button mat-raised-button color="primary" (click)="onConfirmClick()">
          {{ 'pages.search.advancedSearch.add' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .filter-editor-popover {
        background: white;
        padding: 8px 12px;
        border-radius: 4px;
        min-width: 480px;
      }
      .filter-editor-popover__actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;
      }
      /* Collapse the reserved hint/error subscript under the inputs — but ONLY inside this popover.
         The .filter-editor-popover prefix scopes these rules to fields rendered here (encapsulation is
         None on the field components), leaving the same shared field components untouched elsewhere. */
      .filter-editor-popover .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterEditorPopoverComponent {
  @Input({ required: true }) statement!: StatementElement;
  @Input() isPristine = false;
  @Output() filterConfirm = new EventEmitter<void>();
  @Output() filterCancel = new EventEmitter<void>();

  readonly draftStore = inject(StatementDraftStore);
  readonly showErrors = signal(false);

  onEnter(event: Event): void {
    // Submit on Enter, like a form. When a mat-autocomplete panel is open (link/resource value), the
    // autocomplete swallows Enter to pick the highlighted option, so this handler never fires — Enter
    // selects the option instead of submitting, which is the desired behaviour. Guarding on the target
    // being a textarea would also let multi-line values keep Enter, but no value input here is multi-line.
    event.preventDefault();
    this.onConfirmClick();
  }

  onConfirmClick(): void {
    // The whole filter — the top row and every subcriterion at any depth — must be complete before it
    // can be committed. `subtreeComplete` also requires a sub-query to have at least one subcriterion.
    if (!this.draftStore.subtreeComplete(this.statement)) {
      this.showErrors.set(true);
      return;
    }
    this.filterConfirm.emit();
  }
}
