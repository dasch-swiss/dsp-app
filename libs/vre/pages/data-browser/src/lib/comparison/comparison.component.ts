import { NgTemplateOutlet } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, QueryList, ViewChildren } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ResourceFetcherComponent } from '@dasch-swiss/vre/resource-editor/resource-editor';
import { AngularSplitModule } from 'angular-split';
import { first } from 'rxjs';
import { MultipleViewerService } from './multiple-viewer.service';

@Component({
  selector: 'app-comparison',
  template: ` <as-split direction="vertical">
      <as-split-area>
        <!-- note: This part is repeating twice (not added as component) because angular-split
          library does not support addition div inside as-split -->
        <as-split direction="horizontal">
          @for (res of topRow; track res) {
            <as-split-area>
              <ng-container *ngTemplateOutlet="resourceTemplate; context: { res: res }" />
            </as-split-area>
          }
        </as-split>
      </as-split-area>
      @if (resourcesNumber > 3) {
        <as-split-area>
          <as-split direction="horizontal">
            @for (res of bottomRow; track res) {
              <as-split-area>
                <ng-container *ngTemplateOutlet="resourceTemplate; context: { res: res }" />
              </as-split-area>
            }
          </as-split>
        </as-split-area>
      }
    </as-split>

    <ng-template #resourceTemplate let-res="res">
      <div style="max-width: 960px; margin: auto; margin-top: 32px; margin-bottom: 32px; padding: 0 16px">
        @if (multipleViewerService.selectMode) {
          <div style="display: flex; justify-content: end">
            <button mat-icon-button (click)="close(res)">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        }
        <app-resource-fetcher [resourceIri]="res" (afterResourceDeleted)="afterResourceDeleted.emit()" />
      </div>
    </ng-template>`,
  imports: [NgTemplateOutlet, MatIconButton, MatIcon, AngularSplitModule, ResourceFetcherComponent],
})
export class ComparisonComponent implements OnChanges {
  @Input({ required: true }) resourceIds!: string[];
  @Output() afterResourceDeleted = new EventEmitter<void>();

  /**
   * Every mounted viewer, so one of them can be refreshed by IRI.
   *
   * The resources here are rendered through an `ngTemplateOutlet` used twice, so there is no input
   * binding that could carry a refresh down to the right one — and re-keying the `@for` would
   * destroy and rebuild the whole viewer, losing its scroll position and anything open inside it.
   */
  @ViewChildren(ResourceFetcherComponent) private _viewers!: QueryList<ResourceFetcherComponent>;

  topRow: string[] = [];
  bottomRow: string[] = [];

  get resourcesNumber() {
    return this.resourceIds.length;
  }

  constructor(public multipleViewerService: MultipleViewerService) {
    // A resource changed somewhere else — today, a value saved in a Data tab table cell, which
    // runs under a fetcher scoped to that row rather than the one this viewer owns. Without this
    // the viewer would go on showing the value the user had just replaced (DEV-7466).
    this.multipleViewerService.resourceChanged$
      .pipe(takeUntilDestroyed())
      .subscribe(resourceIri => this._reloadViewerOf(resourceIri));
  }

  private _reloadViewerOf(resourceIri: string): void {
    this._viewers?.forEach(viewer => {
      if (viewer.resourceIri === resourceIri) {
        viewer.reload();
      }
    });
  }

  ngOnChanges(): void {
    const resourceIds = this.resourceIds;

    if (this.resourcesNumber < 4) {
      this.topRow = resourceIds;
    } else {
      this.topRow = resourceIds.slice(0, this.resourcesNumber / 2);
      this.bottomRow = resourceIds.slice(this.resourcesNumber / 2);
    }
  }

  close(resourceIri: string) {
    this.multipleViewerService.selectedResources$.pipe(first()).subscribe(resources => {
      const resource = resources.find(r => r.id === resourceIri);
      if (resource) {
        this.multipleViewerService.removeResources([resource]);
      }
    });
  }
}
