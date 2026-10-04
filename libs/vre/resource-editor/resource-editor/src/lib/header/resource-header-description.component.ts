import { AsyncPipe } from '@angular/common';
import { Component, inject, Input, OnChanges, ViewContainerRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { Constants, ReadResource, ReadTextValue, ReadTextValueAsXml } from '@dasch-swiss/dsp-js';
import { DspDialogConfig, RESOURCE_DESCRIPTION_ENABLED } from '@dasch-swiss/vre/core/config';
import { TranslatePipe } from '@ngx-translate/core';
import { FootnoteService } from '../properties/properties-display/footnotes/footnote.service';
import { FootnotesComponent } from '../properties/properties-display/footnotes/footnotes.component';
import { RichTextViewerComponent } from '../properties/properties-display/template-switcher/viewer-components/rich-text-viewer.component';
import { ResourceFetcherService } from '../representation/resource-fetcher.service';
import { showsDescriptionInHeader } from '../resource-description';
import {
  EditResourceDescriptionDialogComponent,
  EditResourceDescriptionDialogData,
} from './edit-resource-description-dialog.component';

/**
 * The resource's description under its label, edited through a dialog like the label. Only the first
 * `hasDescription` value is shown; dsp-api allows several, which dsp-app does not surface.
 */
@Component({
  selector: 'app-resource-header-description',
  template: `
    @let canEdit = resourceFetcherService.userCanEdit$ | async;
    @if (shown && (value || canEdit)) {
      <div
        class="resource-description"
        role="group"
        data-cy="resource-header-description"
        [attr.aria-label]="'ui.common.fields.description' | translate">
        @if (value) {
          <app-rich-text-viewer class="text" [value]="value" />
        } @else {
          <span class="text placeholder">{{
            'resourceEditor.resourceProperties.editDescription.add' | translate
          }}</span>
        }
        @if (canEdit) {
          <button
            mat-icon-button
            data-cy="edit-description-button"
            color="primary"
            [matTooltip]="
              (value
                ? 'resourceEditor.resourceProperties.editDescription.edit'
                : 'resourceEditor.resourceProperties.editDescription.add'
              ) | translate
            "
            (click)="openEditDialog()">
            <mat-icon>edit</mat-icon>
          </button>
        }
      </div>
      @if (footnoteService.footnotes.length > 0) {
        <app-footnotes />
      }
    }
  `,
  styles: [
    `
      .resource-description {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .text {
        flex: 1;
        min-width: 0;
        padding-top: 12px;
      }

      .placeholder {
        color: rgba(0, 0, 0, 0.54);
      }
    `,
  ],
  providers: [FootnoteService],
  imports: [
    AsyncPipe,
    FootnotesComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RichTextViewerComponent,
    TranslatePipe,
  ],
})
export class ResourceHeaderDescriptionComponent implements OnChanges {
  @Input({ required: true }) resource!: ReadResource;

  shown = false;
  value?: ReadTextValueAsXml;

  readonly resourceFetcherService = inject(ResourceFetcherService);
  readonly footnoteService = inject(FootnoteService);
  private readonly _enabled = inject(RESOURCE_DESCRIPTION_ENABLED);
  private readonly _dialog = inject(MatDialog);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly _sanitizer = inject(DomSanitizer);

  ngOnChanges() {
    this.shown = this._enabled && showsDescriptionInHeader(this.resource);
    this.value = this.shown
      ? (this.resource.getValues(Constants.HasDescription)[0] as ReadTextValueAsXml | undefined)
      : undefined;
    this.footnoteService.reloadFootnotes(this.value ? [this.value] : [], this._sanitizer);
  }

  openEditDialog() {
    this._dialog.open<EditResourceDescriptionDialogComponent, EditResourceDescriptionDialogData, boolean>(
      EditResourceDescriptionDialogComponent,
      {
        ...DspDialogConfig.mediumDialog<EditResourceDescriptionDialogData>({
          resource: this.resource,
          value: this.value as ReadTextValue | undefined,
        }),
        viewContainerRef: this._viewContainerRef,
      }
    );
  }
}
