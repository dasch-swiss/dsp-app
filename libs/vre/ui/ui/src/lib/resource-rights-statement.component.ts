import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Canonical display of a resource's data-side legal information
 * (license, copyright holder, authorship) — the "Resource Rights Statement".
 *
 * Used on the resource viewer, the create-resource form (preview) and the project description.
 *
 * Behaviour (per spec §1b):
 * - When NOT configured (no `licenseLabel`): renders the admins-only "uncategorized — please
 *   review" callout for admins, and renders nothing for everyone else (no public regression).
 * - When configured: shows the license (linked to its Creative Commons deed), the copyright
 *   holder and the authorship.
 * - In a per-resource context, when the resource has no own authorship, shows a labeled fallback
 *   ("No authorship recorded for this resource. Project default: …") rather than asserting the default.
 * - For users with edit rights (`canEditAuthorship`), the authorship row edits inline in place
 *   (a chip editor with save/undo) — no dialog — and emits the new list via `saveAuthorship`.
 */
@Component({
  selector: 'app-resource-rights-statement',
  template: `
    @if (configured) {
      <section class="rights-statement" [class.label-start]="labelAlign === 'start'">
        <h3 class="mat-subtitle-2">{{ 'legal.dataSide.heading' | translate }}</h3>

        <div class="row">
          <span class="label mat-subtitle-2">{{ 'legal.dataSide.license' | translate }}</span>
          <span class="value">
            @if (licenseUrl) {
              <a
                [href]="licenseUrl"
                target="_blank"
                rel="noopener noreferrer"
                [attr.aria-label]="licenseLabel + ', ' + ('legal.dataSide.opensInNewTab' | translate)">
                {{ licenseLabel }}
              </a>
            } @else {
              {{ licenseLabel }}
            }
          </span>
        </div>

        @if (copyrightHolder) {
          <div class="row">
            <span class="label mat-subtitle-2">{{ 'legal.dataSide.copyrightHolder' | translate }}</span>
            <span class="value">{{ copyrightHolder }}</span>
          </div>
        }

        <div class="row">
          <span class="label mat-subtitle-2">{{ 'legal.dataSide.authorship' | translate }}</span>
          @if (editing) {
            <!-- Inline editor: opens in place (no dialog) with a chip input and save/undo, like a property row. -->
            <span class="value value-editing">
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
                    (matChipInputTokenEnd)="addEditAuthor($event)" />
                </mat-chip-grid>
              </mat-form-field>
              <button
                type="button"
                class="edit-action"
                [matTooltip]="'legal.dataSide.settings.cancel' | translate"
                [attr.aria-label]="'legal.dataSide.settings.cancel' | translate"
                (click)="cancelEdit()">
                <mat-icon>undo</mat-icon>
              </button>
              <button
                type="button"
                class="edit-action save"
                [matTooltip]="'legal.dataSide.settings.save' | translate"
                [attr.aria-label]="'legal.dataSide.settings.save' | translate"
                (click)="saveEdit()">
                <mat-icon>save</mat-icon>
              </button>
            </span>
          } @else {
            <span class="value">
              @if (resourceAuthorship && !resourceAuthorship.length) {
                <em>{{ 'legal.dataSide.noAuthorshipFallback' | translate: { default: authorship.join(', ') } }}</em>
              } @else if (resourceAuthorship) {
                {{ resourceAuthorship.join(', ') }}
              } @else {
                {{ authorship.join(', ') }}
              }
              @if (canEditAuthorship) {
                <!-- Inline, always-visible edit affordance, right after the value (discoverable, close to the text). -->
                <button
                  #editButton
                  type="button"
                  class="edit-authorship"
                  [matTooltip]="'legal.dataSide.edit' | translate"
                  [attr.aria-label]="'legal.dataSide.edit' | translate"
                  (click)="startEdit()">
                  <mat-icon>edit</mat-icon>
                </button>
              }
            </span>
          }
        </div>
      </section>
    } @else if (isAdmin) {
      <section class="rights-statement uncategorized" role="status">
        <mat-icon aria-hidden="true" color="warn">warning</mat-icon>
        <span>{{ 'legal.dataSide.uncategorized' | translate }}</span>
        <button type="button" mat-button color="primary" (click)="editLegalInfo.emit()">
          {{ 'legal.dataSide.editLegalInfo' | translate }}
        </button>
      </section>
    }
  `,
  styles: [
    `
      .rights-statement {
        margin: 16px 0;
      }
      /* Mirror the property value rows (property-row.component) so the rights statement
         reads as one block with the properties above it — same label typography, column
         width and value offset. */
      .row {
        display: flex;
        align-items: baseline;
      }
      .label {
        color: rgb(107, 114, 128);
        /* rem so the column scales with user font-size settings (WCAG 1.4.4, 1.4.10). */
        width: 9.375rem;
        text-align: right;
        padding: 6px 16px;
        line-height: normal;
        flex-shrink: 0;
        overflow-wrap: break-word;
      }
      .value {
        flex: 1;
        padding: 6px 8px;
      }
      /* Project-level (card) variant: left-align the labels, drop the left padding so they line up
         flush with the heading, and use a tighter label column. */
      .label-start .label {
        text-align: left;
        padding-left: 0;
        width: 8.125rem;
      }
      /* Inline, always-visible authorship edit affordance, sitting right after the value
         (not a hover pill — discoverable and close to the text). */
      .edit-authorship {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        vertical-align: middle;
        margin-left: 6px;
        /* Hit-area ≥ 24×24 CSS px (WCAG 2.5.8): 18px icon + 4px padding each side = 26px. */
        min-width: 24px;
        min-height: 24px;
        padding: 4px;
        border: none;
        background: none;
        color: rgb(107, 114, 128);
        cursor: pointer;
        border-radius: 4px;
      }
      .edit-authorship:hover {
        color: var(--primary);
        background: rgba(0, 0, 0, 0.04);
      }
      .edit-authorship mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        line-height: 18px;
      }
      /* Inline edit mode: the chip field grows to fill the value cell, with the save/undo
         actions sitting right after it (mirrors the property-row inline edit). */
      .value-editing {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .authorship-edit-field {
        flex: 1;
      }
      .edit-action {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        padding: 4px;
        border: none;
        background: none;
        color: rgb(107, 114, 128);
        cursor: pointer;
        border-radius: 4px;
      }
      .edit-action:hover {
        background: rgba(0, 0, 0, 0.04);
      }
      .edit-action.save:hover {
        color: var(--primary);
      }
      .edit-action mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        line-height: 20px;
      }
      .uncategorized {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border: 1px solid;
        border-radius: 4px;
      }
    `,
  ],
  imports: [MatButtonModule, MatChipsModule, MatFormFieldModule, MatIconModule, MatTooltipModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceRightsStatementComponent {
  /** The human-readable license label, e.g. "CC BY 4.0". Its presence means the project is "configured". */
  @Input() licenseLabel?: string;
  /** The license deed URL (Creative Commons), rendered as a link. */
  @Input() licenseUrl?: string;
  /** The project-wide copyright holder. */
  @Input() copyrightHolder?: string;
  /** The project default authorship. */
  @Input() authorship: string[] = [];
  /** The per-resource authorship (only in a per-resource context); empty/absent ⇒ labeled fallback. */
  @Input() resourceAuthorship: string[] | null = null;
  /** Whether the current user is a project/system admin (controls the unconfigured callout). */
  @Input() isAdmin = false;
  /** Whether the current user may edit the per-resource authorship (Modify rights). */
  @Input() canEditAuthorship = false;
  /** Label alignment: 'end' (right — matches property rows in the viewer) or 'start' (left — for the project card). */
  @Input() labelAlign: 'start' | 'end' = 'end';

  /** Emitted when an admin clicks "Edit legal info" on the unconfigured callout (routes to Settings → Legal). */
  @Output() editLegalInfo = new EventEmitter<void>();
  /** Emitted with the new authorship list when a Modify user saves the inline editor. */
  @Output() saveAuthorship = new EventEmitter<string[]>();

  /** Whether the inline authorship editor is open. */
  editing = false;
  /** Working copy of the authorship list while editing (committed only on save). */
  editAuthorshipList: string[] = [];

  @ViewChild('chipInput') private _chipInput?: ElementRef<HTMLInputElement>;
  @ViewChild('editButton') private _editButton?: ElementRef<HTMLButtonElement>;

  get configured(): boolean {
    return !!this.licenseLabel;
  }

  /** Open the inline editor, seeded with the currently displayed authorship. */
  startEdit(): void {
    const valueToEdit = this.resourceAuthorship?.length ? this.resourceAuthorship : this.authorship;
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
