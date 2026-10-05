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
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
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
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  // Collapse the reserved hint/error space under the inputs, but only inside this popover: a dynamic
  // subscript takes no room until a field has something to say. Hiding the subscript wrapper instead
  // also hid every validation error here, so an invalid value could not be added and nothing said why
  // (DEV-7441).
  providers: [{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }],
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
