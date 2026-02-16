import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  Output,
  TemplateRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { ReadValue } from '@dasch-swiss/dsp-js';
import { APIV2ApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { FootnoteService } from './footnotes/footnote.service';

@Component({
  selector: 'app-draggable-value-list',
  standalone: true,
  imports: [CdkDropList, CdkDrag, CdkDragHandle, NgTemplateOutlet, MatIcon, TranslatePipe],
  template: `
    <div
      cdkDropList
      cdkDropListLockAxis="y"
      [cdkDropListData]="values"
      [cdkDropListDisabled]="disabled || reorderLoading"
      (cdkDropListDropped)="onDrop($event)">
      @for (value of values; track value.id; let index = $index) {
        <div cdkDrag cdkDragLockAxis="y" [cdkDragDisabled]="disabled || reorderLoading" class="value-row">
          @if (showHandle) {
            <span
              cdkDragHandle
              class="drag-handle"
              [attr.aria-label]="'resourceEditor.resourceProperties.actions.dragToReorder' | translate">
              <mat-icon>drag_indicator</mat-icon>
            </span>
          }

          <ng-container
            [ngTemplateOutlet]="itemTemplate"
            [ngTemplateOutletContext]="{ $implicit: value, index: index }" />

          <div cdkDragPlaceholder></div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .value-row {
        display: flex;
        align-items: center;
      }

      .drag-handle {
        cursor: grab;
        opacity: 0.3;
        display: flex;
        align-items: center;
        padding: 0 4px;
        transition: opacity 200ms ease-in-out;
      }
      .value-row:hover .drag-handle {
        opacity: 0.7;
      }
      .drag-handle:active {
        cursor: grabbing;
      }

      .cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }

      .cdk-drop-list-dragging .value-row:not(.cdk-drag-placeholder) {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }

      @media (prefers-reduced-motion: reduce) {
        .cdk-drag-animating,
        .cdk-drop-list-dragging .value-row:not(.cdk-drag-placeholder) {
          transition: none !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraggableValueListComponent {
  @Input({ required: true }) values!: ReadValue[];
  @Input({ required: true }) resourceIri!: string;
  @Input({ required: true }) propertyIri!: string;
  @Input() disabled = false;
  @Input() showHandle = false;
  @Output() valuesChange = new EventEmitter<ReadValue[]>();

  @ContentChild(TemplateRef) itemTemplate!: TemplateRef<{ $implicit: ReadValue; index: number }>;

  reorderLoading = false;

  private readonly _apiService = inject(APIV2ApiService);
  private readonly _resourceFetcherService = inject(ResourceFetcherService);
  private readonly _notification = inject(NotificationService);
  private readonly _translateService = inject(TranslateService);
  private readonly _footnoteService = inject(FootnoteService, { optional: true });
  private readonly _cd = inject(ChangeDetectorRef);
  private readonly _destroyRef = inject(DestroyRef);

  onDrop(event: CdkDragDrop<ReadValue[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    if (this.reorderLoading) return;
    if (this.disabled) return;

    const originalOrder = [...this.values];
    const reordered = [...originalOrder];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);

    this._footnoteService?.reset();
    this.values = reordered;
    this.valuesChange.emit(reordered);
    this.reorderLoading = true;
    this._cd.markForCheck();

    const orderedIris = reordered.map(v => v.id);
    this._apiService
      .putV2ValuesOrder({ resourceIri: this.resourceIri, propertyIri: this.propertyIri, orderedValueIris: orderedIris })
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => {
          this.reorderLoading = false;
          this._cd.markForCheck();
        })
      )
      .subscribe({
        next: () => this._resourceFetcherService.reload(),
        error: e => {
          this.values = originalOrder;
          this.valuesChange.emit(originalOrder);
          this._cd.markForCheck();
          const key = e.status === 400 ? 'reorderStale' : e.status === 403 ? 'reorderForbidden' : 'reorderFailed';
          this._notification.openSnackBar(
            this._translateService.instant(`resourceEditor.resourceProperties.actions.${key}`),
            'error'
          );
          if (e.status === 400) {
            this._resourceFetcherService.reload();
          }
        },
      });
  }
}
