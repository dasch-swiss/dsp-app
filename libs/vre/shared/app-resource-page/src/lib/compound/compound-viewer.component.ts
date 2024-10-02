import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FileRepresentation, StillImageComponent, getFileValue } from '@dasch-swiss/vre/shared/app-representations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CompoundService } from './compound.service';

@Component({
  selector: 'app-compound-viewer',
  template: `
    <ng-container *ngIf="compoundService.compoundPosition">
      <ng-container *ngIf="compoundService.incomingResource as incomingResource">
        <app-still-image
          #stillImageComponent
          class="dsp-representation stillimage"
          *ngIf="imageIsAccessible"
          [resource]="incomingResource.res">
          <div navigationArrows class="arrows">
            <app-compound-arrow-navigation [forwardNavigation]="false" class="arrow" />
            <app-compound-arrow-navigation [forwardNavigation]="true" class="arrow" />
          </div>
          <app-compound-navigation navigation />
          <app-compound-slider slider />
        </app-still-image>
      </ng-container>
    </ng-container>
  `,
  styles: [
    `
      .arrow {
        position: absolute;
        z-index: 1;
        height: 100%;

        &:first-child {
          left: 0;
        }

        &:nth-child(2) {
          right: 0;
        }
      }
    `,
  ],
})
export class CompoundViewerComponent implements OnInit, OnDestroy {
  destroyed$: Subject<void> = new Subject<void>();

  @ViewChild('stillImageComponent') stillImageComponent: StillImageComponent | undefined;

  get fileRepresentation() {
    return new FileRepresentation(getFileValue(this.compoundService.incomingResource!)!);
  }

  get imageIsAccessible() {
    return this.fileRepresentation.fileValue;
  }

  constructor(public compoundService: CompoundService) {}

  ngOnInit() {
    this.compoundService.onOpenNotLoadedIncomingResourcePage$.pipe(takeUntil(this.destroyed$)).subscribe(() => {
      this.stillImageComponent?.setForbiddenStatus();
    });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
