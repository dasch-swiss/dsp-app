import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Canonical, read-only display of a resource's data-side legal information
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
              <a [href]="licenseUrl" target="_blank" rel="noopener">{{ licenseLabel }}</a>
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

        <div
          class="row authorship-row"
          (mouseenter)="showAuthorshipActions = true"
          (mouseleave)="showAuthorshipActions = false">
          <span class="label mat-subtitle-2">{{ 'legal.dataSide.authorship' | translate }}</span>
          <span class="value">
            @if (displayedAuthorship.length > 0) {
              {{ displayedAuthorship.join(', ') }}
            } @else if (perResource) {
              <em>{{ 'legal.dataSide.noAuthorshipFallback' | translate: { default: authorship.join(', ') } }}</em>
            }
          </span>
          @if (canEditAuthorship && showAuthorshipActions) {
            <!-- Same hover-revealed action pill as property value rows (global .action-bubble styling), edit only. -->
            <div class="action-bubble">
              <div class="button-container d-flex">
                <span [matTooltip]="'legal.dataSide.edit' | translate">
                  <button
                    mat-button
                    class="edit"
                    [attr.aria-label]="'legal.dataSide.edit' | translate"
                    (click)="editAuthorship.emit()">
                    <mat-icon>edit</mat-icon>
                  </button>
                </span>
              </div>
            </div>
          }
        </div>
      </section>
    } @else if (isAdmin) {
      <section class="rights-statement uncategorized">
        <mat-icon color="warn">warning</mat-icon>
        <span>{{ 'legal.dataSide.uncategorized' | translate }}</span>
        <button mat-button color="primary" (click)="editLegalInfo.emit()">
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
        width: 150px;
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
        width: 130px;
      }
      .authorship-row {
        position: relative;
      }
      /* Pill look comes from the global .action-bubble styles; nudge it to the row's right edge
         to line up with the property-row action pills (the global default sits further left). */
      .authorship-row .action-bubble {
        right: 16px;
        top: 8px;
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
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe],
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
  /** Whether this is a per-resource display (viewer/create) vs. a project-level display. */
  @Input() perResource = false;
  /** Whether the current user is a project/system admin (controls the unconfigured callout). */
  @Input() isAdmin = false;
  /** Whether the current user may edit the per-resource authorship (Modify rights). */
  @Input() canEditAuthorship = false;
  /** Label alignment: 'end' (right — matches property rows in the viewer) or 'start' (left — for the project card). */
  @Input() labelAlign: 'start' | 'end' = 'end';

  /** Emitted when an admin clicks "Edit legal info" on the unconfigured callout (routes to Settings → Legal). */
  @Output() editLegalInfo = new EventEmitter<void>();
  /** Emitted when a Modify user clicks the inline authorship edit affordance. */
  @Output() editAuthorship = new EventEmitter<void>();

  /** Reveals the authorship action pill on row hover (mirrors property value rows). */
  showAuthorshipActions = false;

  get configured(): boolean {
    return !!this.licenseLabel;
  }

  /** Authorship actually shown: the resource's own when present, otherwise the project default in a project-level context. */
  get displayedAuthorship(): string[] {
    if (this.perResource) {
      return this.resourceAuthorship ?? [];
    }
    return this.authorship;
  }
}
