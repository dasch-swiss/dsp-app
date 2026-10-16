import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { ResourceAuthorshipComponent } from './resource-authorship.component';

/**
 * Canonical display of a resource's data-side legal information
 * (license, copyright holder, authorship) — the "Resource Rights Statement".
 *
 * Used on the resource viewer, the create-resource form (preview) and the project description.
 *
 * Behaviour (per spec §1b):
 * - Renders as soon as any field is set (license, copyright holder, or — in a per-resource context —
 *   authorship). When NOTHING is set: renders the admins-only "uncategorized — please review" callout
 *   for admins, and renders nothing for everyone else (including logged-out visitors).
 * - When configured: shows whichever of the license (linked to its Creative Commons deed) and the
 *   copyright holder are set — each independently — and, unless `showAuthorship` is false, the
 *   authorship. Project-level displays pass `showAuthorship=false`, since authorship is per-resource.
 * - In a per-resource context, when the resource has no own authorship, shows a labeled fallback
 *   ("No authorship recorded for this resource. Project default: …") rather than asserting the default.
 * - For users with edit rights (`canEditAuthorship`), the authorship row behaves like a property
 *   value: marked on hover with an Edit button at the end of its line, and edited in place (a chip
 *   editor with Cancel and Save where Edit was) — no dialog — emitting the new list via
 *   `saveAuthorship`.
 */
@Component({
  selector: 'app-resource-rights-statement',
  template: `
    @if (configured) {
      <section class="rights-statement" [class.label-start]="labelAlign === 'start'">
        <h3 class="mat-subtitle-2">{{ 'legal.dataSide.heading' | translate }}</h3>

        @if (licenseLabel || isPlaceholderLicense) {
          <div class="row">
            <span class="label mat-subtitle-2">{{ 'legal.dataSide.license' | translate }}</span>
            <span class="value">
              @if (isPlaceholderLicense) {
                <!-- The sentinel's own label is a 96-character sentence and its uri is not
                     dereferenceable, so show the readable marker as plain text. See DEV-6994. -->
                {{ 'legal.dataSide.placeholder' | translate }}
              } @else if (licenseUrl) {
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
        }

        @if (copyrightHolder) {
          <div class="row">
            <span class="label mat-subtitle-2">{{ 'legal.dataSide.copyrightHolder' | translate }}</span>
            <span class="value">
              @if (isPlaceholderCopyrightHolder) {
                {{ 'legal.dataSide.placeholder' | translate }}
              } @else {
                {{ copyrightHolder }}
              }
            </span>
          </div>
        }

        @if (showAuthorship) {
          <div class="row">
            <span class="label mat-subtitle-2">{{ 'legal.dataSide.authorship' | translate }}</span>
            <app-resource-authorship
              class="authorship"
              [defaultResourceAuthorship]="defaultResourceAuthorship"
              [resourceAuthorship]="resourceAuthorship"
              [canEditAuthorship]="canEditAuthorship"
              (saveAuthorship)="saveAuthorship.emit($event)" />
          </div>
        }
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
      .authorship {
        flex: 1;
        min-width: 0;
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
  imports: [MatButtonModule, MatIconModule, ResourceAuthorshipComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceRightsStatementComponent {
  /** The human-readable license label, e.g. "CC BY 4.0". Rendered only when set (see `configured`). */
  @Input() licenseLabel?: string;
  /** The license deed URL (Creative Commons), rendered as a link. */
  @Input() licenseUrl?: string;
  /** The project-wide copyright holder. */
  @Input() copyrightHolder?: string;
  /** The project default authorship. */
  @Input() defaultResourceAuthorship: string[] = [];
  /** The per-resource authorship (only in a per-resource context); empty/absent ⇒ labeled fallback. */
  @Input() resourceAuthorship: string[] | null = null;
  /** Whether the current user is a project/system admin (controls the unconfigured callout). */
  @Input() isAdmin = false;
  /** Whether the current user may edit the per-resource authorship (Modify rights). */
  @Input() canEditAuthorship = false;
  /** Label alignment: 'end' (right — matches property rows in the viewer) or 'start' (left — for the project card). */
  @Input() labelAlign: 'start' | 'end' = 'end';
  /** Whether to render the authorship row. Authorship is per-resource; project-level displays pass `false`. */
  @Input() showAuthorship = true;
  /** True when the project's license is the placeholder sentinel; renders the marker instead of a link. */
  @Input() isPlaceholderLicense = false;
  /** True when `copyrightHolder` is the placeholder sentinel; renders the marker instead of the URN. */
  @Input() isPlaceholderCopyrightHolder = false;

  /** Emitted when an admin clicks "Edit legal info" on the unconfigured callout (routes to Settings → Legal). */
  @Output() editLegalInfo = new EventEmitter<void>();
  /** Emitted with the new authorship list when a Modify user saves the inline editor. */
  @Output() saveAuthorship = new EventEmitter<string[]>();

  get configured(): boolean {
    return !!this.licenseLabel || this.isPlaceholderLicense || !!this.copyrightHolder || this._hasDisplayableAuthorship;
  }

  /** Per-resource authorship worth showing: only in an authorship context (`showAuthorship`), and
   *  only when there are actual authors (own or project default). Lets a resource that has only
   *  authorship set still render the statement. */
  private get _hasDisplayableAuthorship(): boolean {
    return (
      this.showAuthorship && ((this.resourceAuthorship?.length ?? 0) > 0 || this.defaultResourceAuthorship.length > 0)
    );
  }
}
