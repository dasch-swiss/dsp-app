import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { joinPlaceholderLegalValues } from '@dasch-swiss/vre/shared/app-common';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * A resource's authorship as the Resource Rights Statement shows it — its own, else the project's
 * default with a labelled fallback — and, for users with edit rights, edited in place like a
 * property value: Edit at the end of the line on hover or focus, then a chip editor with Cancel and
 * Save where Edit was (DEV-7494).
 *
 * Its own component so the rights statement and the Data tab's table show and edit it the same way.
 */
@Component({
  selector: 'app-resource-authorship',
  template: `
    @if (editing) {
      <!-- In place, like a property value being edited: the editor, then Cancel and Save at
           the end of the same line, where Edit was (DEV-7494). -->
      <div class="value-line edit-line">
        <mat-form-field class="authorship-edit-field" subscriptSizing="dynamic">
          <mat-chip-grid #chipGrid [attr.aria-label]="'legal.dataSide.authorship' | translate">
            @for (author of editAuthorshipList; track $index) {
              <mat-chip-row (removed)="removeEditAuthor($index)">
                {{ author }}
                <button
                  type="button"
                  matChipRemove
                  [attr.aria-label]="'legal.dataSide.removeAuthor' | translate: { name: author }">
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip-row>
            }
            <input
              #chipInput
              autocomplete="off"
              [matChipInputFor]="chipGrid"
              [matChipInputAddOnBlur]="true"
              (matChipInputTokenEnd)="addEditAuthor($event)" />
          </mat-chip-grid>
          <mat-hint>{{ 'legal.dataSide.authorshipHint' | translate }}</mat-hint>
        </mat-form-field>
        <div class="value-actions edit-actions">
          <button
            mat-icon-button
            type="button"
            class="value-action muted"
            data-cy="authorship-cancel"
            [matTooltip]="'legal.dataSide.settings.cancel' | translate"
            [attr.aria-label]="'legal.dataSide.settings.cancel' | translate"
            (click)="cancelEdit()">
            <mat-icon>close</mat-icon>
          </button>
          <button
            mat-icon-button
            type="button"
            class="value-action"
            data-cy="authorship-save"
            [matTooltip]="'legal.dataSide.settings.save' | translate"
            [attr.aria-label]="'legal.dataSide.settings.save' | translate"
            (click)="saveEdit()">
            <mat-icon>check_circle</mat-icon>
          </button>
        </div>
      </div>
    } @else {
      <!-- Like a property value: marked on hover, with Edit at the end of its line. Shown on
           keyboard focus too, so the button stays reachable without a pointer (DEV-7494). -->
      <div class="value-line" [class.editable]="canEditAuthorship" data-cy="authorship-value">
        <span class="value-text">
          @if (resourceAuthorship && !resourceAuthorship.length) {
            @if (defaultResourceAuthorship.length) {
              <em>{{
                'legal.dataSide.noAuthorshipFallback'
                  | translate
                    : {
                        default: authorshipWith(defaultResourceAuthorship, 'legal.dataSide.placeholder' | translate),
                      }
              }}</em>
            } @else {
              <em>{{ 'legal.dataSide.noAuthorshipFallbackNoDefault' | translate }}</em>
            }
          } @else if (resourceAuthorship) {
            {{ authorshipWith(resourceAuthorship, 'legal.dataSide.placeholder' | translate) }}
          } @else if (defaultResourceAuthorship.length) {
            {{ authorshipWith(defaultResourceAuthorship, 'legal.dataSide.placeholder' | translate) }}
          } @else {
            <em>{{ 'legal.dataSide.noAuthorshipFallbackNoDefault' | translate }}</em>
          }
        </span>
        @if (canEditAuthorship) {
          <div class="value-actions">
            <button
              #editButton
              mat-icon-button
              type="button"
              class="value-action edit-authorship"
              data-cy="authorship-edit"
              [matTooltip]="'legal.dataSide.edit' | translate"
              [attr.aria-label]="'legal.dataSide.edit' | translate"
              (click)="startEdit()">
              <mat-icon>edit</mat-icon>
            </button>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      /* The authorship line, styled as a property value's (property-value-display and
         property-value-actions in the resource editor, which this library cannot import):
         marked on hover, with its actions at the end of the line (DEV-7494). */
      :host {
        display: block;
        min-width: 0;
      }
      .value-line {
        display: flex;
        align-items: flex-start;
        gap: 4px;
        border-radius: 4px;
        /* 8px in the rights statement, where the value column is padded; a host that lines values
           up flush, such as the Data tab's table, sets 0. */
        padding: 0 0 0 var(--authorship-line-padding-inline-start, 8px);
      }
      .value-line.editable:hover,
      .value-line.editable:focus-within {
        background: rgba(51, 103, 144, 0.06);
      }
      .value-text {
        flex: 1;
        min-width: 0;
        padding: var(--property-value-padding-block, 6px) 0;
        overflow-wrap: anywhere;
      }
      .value-actions {
        display: flex;
        align-items: center;
        gap: 2px;
        flex: none;
        padding-right: 4px;
      }
      /* Hidden, not removed, until the line is hovered or focused: a removed button could not be
         reached from the keyboard, nor take focus back after the editor closes (WCAG 2.4.3). */
      .value-line:not(.edit-line) .value-actions {
        opacity: 0;
      }
      .value-line:hover .value-actions,
      .value-line:focus-within .value-actions {
        opacity: 1;
      }
      .value-action {
        --mat-icon-button-state-layer-size: 28px;
        flex: none;
        width: 28px;
        height: 28px;
        padding: 0;
        color: var(--primary, #336790);
      }
      .value-action.muted {
        color: rgba(0, 0, 0, 0.6);
      }
      .value-action mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        line-height: 18px;
      }
      .value-line.edit-line {
        padding: 4px 0 4px var(--authorship-line-padding-inline-start, 8px);
        background: var(--property-value-edit-background, none);
      }
      .authorship-edit-field {
        flex: 1;
        min-width: 0;
      }
      .edit-actions {
        padding-top: 14px;
      }
    `,
  ],
  imports: [MatButtonModule, MatChipsModule, MatFormFieldModule, MatIconModule, MatTooltipModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceAuthorshipComponent {
  /** The project default authorship. */
  @Input() defaultResourceAuthorship: string[] = [];
  /** The resource's own authorship; empty or absent ⇒ labelled fallback. */
  @Input() resourceAuthorship: string[] | null = null;
  /** Whether the current user may edit the authorship (Modify rights). */
  @Input() canEditAuthorship = false;

  /** Emitted with the new authorship list when the inline editor is saved. */
  @Output() saveAuthorship = new EventEmitter<string[]>();

  /** Whether the inline authorship editor is open. */
  editing = false;
  /** Working copy of the authorship list while editing (committed only on save). */
  editAuthorshipList: string[] = [];

  @ViewChild('chipInput') private _chipInput?: ElementRef<HTMLInputElement>;
  @ViewChild('editButton') private _editButton?: ElementRef<HTMLButtonElement>;

  /**
   * Joins authorship entries, substituting `placeholderLabel` for any placeholder sentinel. The label
   * arrives already translated from the `| translate` pipe in the template, so this component needs no
   * `TranslateService`. See DEV-6994.
   */
  authorshipWith(values: string[], placeholderLabel: string): string {
    return joinPlaceholderLegalValues(values, placeholderLabel);
  }

  /** Open the inline editor, seeded with the currently displayed authorship. */
  startEdit(): void {
    const valueToEdit = this.resourceAuthorship?.length ? this.resourceAuthorship : this.defaultResourceAuthorship;
    this.editAuthorshipList = [...valueToEdit];
    this.editing = true;
    // Move focus into the chip input once Angular has rendered the editor branch (WCAG 2.4.3).
    queueMicrotask(() => this._chipInput?.nativeElement.focus());
  }

  addEditAuthor(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.editAuthorshipList = [...this.editAuthorshipList, value];
    }
    event.chipInput?.clear();
  }

  removeEditAuthor(index: number): void {
    this.editAuthorshipList = this.editAuthorshipList.filter((_, i) => i !== index);
  }

  /** Discard edits and close the editor. */
  cancelEdit(): void {
    this.editing = false;
    this._restoreFocusToEditButton();
  }

  /** Commit the edited list to the parent and close the editor. */
  saveEdit(): void {
    this.saveAuthorship.emit([...this.editAuthorshipList]);
    this.editing = false;
    this._restoreFocusToEditButton();
  }

  private _restoreFocusToEditButton(): void {
    // Restore focus once Angular has rendered the read-only branch (WCAG 2.4.3).
    queueMicrotask(() => this._editButton?.nativeElement.focus());
  }
}
