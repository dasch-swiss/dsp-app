import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnChanges,
  output,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { DspResource, filterUndefined } from '@dasch-swiss/vre/shared/app-common';
import { TranslatePipe } from '@ngx-translate/core';
import { ResourceFetcherService } from '../representation/resource-fetcher.service';
import { ResourceUtil } from '../representation/resource.util';
import { EditResourceLabelDialogComponent } from './more-menu/edit-resource-label-dialog.component';

/**
 * A resource's label shown among values, with the values' hover: the line is marked and an Edit
 * button sits at its end (DEV-7494). Edit opens the same dialog the resource viewer's menu does.
 *
 * Carries its own `ResourceFetcherService`, primed with the resource, because the dialog reloads
 * the resource through one after saving; the reload is what this component reports back.
 */
@Component({
  selector: 'app-editable-resource-label',
  imports: [MatIconButton, MatIcon, MatTooltip, TranslatePipe],
  template: `
    <div
      class="row"
      data-cy="resource-label"
      [class.is-hovered]="hovered() && canEdit()"
      (mouseenter)="hovered.set(true)"
      (mouseleave)="hovered.set(false)">
      <span class="label-text">{{ dspResource().res.label }}</span>
      @if (hovered() && canEdit()) {
        <div class="value-actions label-actions">
          <button
            mat-icon-button
            type="button"
            class="value-action"
            data-cy="edit-label-button"
            [attr.aria-label]="'resourceEditor.moreMenu.editLabel' | translate"
            [matTooltip]="'resourceEditor.moreMenu.editLabel' | translate"
            (click)="$event.stopPropagation(); openDialog()">
            <mat-icon>edit</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
  styleUrls: ['../properties/properties-display/property-value/property-value-actions.scss'],
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
      /* The same line as a shown value's: text, then the actions, marked on hover. */
      .row {
        display: flex;
        align-items: flex-start;
        gap: 4px;
        border-radius: 4px;
      }
      .row.is-hovered {
        background: rgba(51, 103, 144, 0.06);
      }
      /* One line, ellipsised: the label names the row and should not make it taller. */
      .label-text {
        flex: 1;
        min-width: 0;
        padding: var(--property-value-padding-block, 16px) 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .label-actions {
        padding-top: calc(var(--property-value-padding-block, 16px) - 4px);
      }
    `,
  ],
  providers: [ResourceFetcherService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditableResourceLabelComponent implements OnChanges {
  readonly dspResource = input.required<DspResource>();

  /** The resource as dsp-api holds it after the label was changed. */
  readonly resourceUpdated = output<ReadResource>();

  protected readonly canEdit = computed(() => ResourceUtil.userCanEdit(this.dspResource().res));
  protected readonly hovered = signal(false);

  private readonly _fetcher = inject(ResourceFetcherService);
  private readonly _dialog = inject(MatDialog);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private _primed?: ReadResource;

  constructor() {
    // Anything but our own prime is the dialog's reload after a save.
    this._fetcher.resource$.pipe(filterUndefined(), takeUntilDestroyed()).subscribe(resource => {
      if (resource.res !== this._primed) {
        this.resourceUpdated.emit(resource.res);
      }
    });
  }

  ngOnChanges() {
    this._primed = this.dspResource().res;
    this._fetcher.prime(this.dspResource());
  }

  protected openDialog(): void {
    this.hovered.set(false);
    this._dialog.open<EditResourceLabelDialogComponent, ReadResource, boolean>(EditResourceLabelDialogComponent, {
      data: this.dspResource().res,
      // So the dialog finds this component's fetcher, which is the one primed with this resource.
      viewContainerRef: this._viewContainerRef,
    });
  }
}
