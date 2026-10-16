import {
  CDK_DRAG_PARENT,
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  DestroyRef,
  EventEmitter,
  inject,
  Injector,
  Input,
  Output,
  TemplateRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReadValue } from '@dasch-swiss/dsp-js';
import { APIV2ApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import { ResourceFetcherService } from '../../../representation/resource-fetcher.service';

@Component({
  selector: 'app-draggable-value-list',
  standalone: true,
  imports: [CdkDropList, CdkDrag, CdkDragHandle, NgTemplateOutlet],
  template: `
    <div
      cdkDropList
      cdkDropListLockAxis="y"
      [cdkDropListData]="values"
      [cdkDropListDisabled]="disabled || reorderLoading"
      [class.has-multiple]="values.length > 1"
      (cdkDropListDropped)="onDrop($event)">
      @for (value of values; track value.id; let index = $index) {
        <div
          cdkDrag
          #drag="cdkDrag"
          cdkDragLockAxis="y"
          [cdkDragDisabled]="disabled || reorderLoading || values.length < 2"
          class="value-row">
          <!-- The visible handle is the item's to place — the value's actions put it between Edit
               and Delete (DEV-7494) — and it only exists while the value is hovered. This one is
               never seen: it only keeps the row from becoming its own handle in between, which is
               what CDK does to a drag with no handle, and would swallow text selection. -->
          @if (!drag.disabled) {
            <span cdkDragHandle hidden></span>
          }

          <ng-container
            [ngTemplateOutlet]="itemTemplate"
            [ngTemplateOutletContext]="{
              $implicit: value,
              index: index,
            }"
            [ngTemplateOutletInjector]="rowInjector(drag)" />

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

      .has-multiple .value-row:not(:last-child) {
        border-bottom: 1px solid rgba(51, 103, 144, 0.1); /* rgba($primary, 0.1) */
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
  @Output() valuesChange = new EventEmitter<ReadValue[]>();

  @ContentChild(TemplateRef) itemTemplate!: TemplateRef<{ $implicit: ReadValue; index: number }>;

  reorderLoading = false;

  private readonly _apiService = inject(APIV2ApiService);
  private readonly _resourceFetcherService = inject(ResourceFetcherService);
  private readonly _notification = inject(NotificationService);
  private readonly _translateService = inject(TranslateService);
  private readonly _cd = inject(ChangeDetectorRef);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _injector = inject(Injector);
  private readonly _rowInjectors = new WeakMap<CdkDrag, Injector>();

  /**
   * Gives the item the row's drag, so a `cdkDragHandle` inside it moves the row. Without it the
   * item's view resolves from where its template was declared, outside the row, and finds none.
   * One per row and kept: a new injector would make the outlet rebuild the item on every check.
   */
  rowInjector(drag: CdkDrag): Injector {
    let injector = this._rowInjectors.get(drag);
    if (!injector) {
      injector = Injector.create({ providers: [{ provide: CDK_DRAG_PARENT, useValue: drag }], parent: this._injector });
      this._rowInjectors.set(drag, injector);
    }
    return injector;
  }

  onDrop(event: CdkDragDrop<ReadValue[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    if (this.reorderLoading) return;
    if (this.disabled) return;

    const originalOrder = [...this.values];
    const reordered = [...originalOrder];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);

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
