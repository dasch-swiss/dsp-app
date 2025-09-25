import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { RegionService } from '@dasch-swiss/vre/resource-editor/representations';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-annotation-tab',
  template: `
    <mat-accordion>
      @for (annotation of regionService.regions$ | async; track $index) {
        <mat-expansion-panel
          #panel
          [attr.data-annotation-resource]="annotation.res.id"
          [class.active]="annotation.res.id === selectedRegion"
          [expanded]="annotation.res.id === expandedRegion"
          (closed)="onPanelClosed(annotation.res.id)"
          (opened)="onPanelOpened(annotation.res.id)"
          data-cy="annotation-border">
          <mat-expansion-panel-header>
            <div style="width: 100%; display: flex; align-items: center; justify-content: space-between">
              <div>
                <h3 class="label" data-cy="property-header">
                  {{ annotation.res.label }}
                </h3>
              </div>
              <div style="display: flex; align-items: center;">
                <app-annotation-toolbar
                  style="width: 100%"
                  [resource]="annotation.res"
                  [parentResourceId]="resource.id"
                  [toolBarActive]="annotation.res.id === selectedRegion"
                  (click)="$event.stopPropagation()" />
              </div>
            </div>
          </mat-expansion-panel-header>

          @if (panel.expanded) {
            <app-properties-display [resource]="annotation" [hideToolbar]="true"></app-properties-display>
          }
        </mat-expansion-panel>
      }
    </mat-accordion>
  `,
  styles: ['.active {border: 1px solid}'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AnnotationTabComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) resource!: ReadResource;
  selectedRegion: string | null = null;
  expandedRegion: string | null = null;

  private _destroy$ = new Subject<void>();

  constructor(
    private _cdr: ChangeDetectorRef,
    public regionService: RegionService
  ) {}

  ngAfterViewInit() {
    this.regionService.selectedRegion$.pipe(takeUntil(this._destroy$)).subscribe(region => {
      this.selectedRegion = region;
      if (this.selectedRegion !== this.expandedRegion) {
        this.expandedRegion = null;
      }
      this._cdr.detectChanges();
    });

    this.regionService.highlightedRegionClicked$.pipe(takeUntil(this._destroy$)).subscribe(iri => {
      this.expandedRegion = iri;
      this._cdr.detectChanges();
      this._scrollToRegion(iri);
    });
  }

  onPanelOpened(iri: string) {
    this.regionService.selectRegion(iri);
  }

  onPanelClosed(iri: string) {
    if (this.selectedRegion === iri) {
      this.regionService.selectRegion(null);
    }
  }

  private _scrollToRegion(iri: string | null) {
    const element = iri ? (document.querySelector(`[data-annotation-resource="${iri}"]`) as HTMLElement) : null;
    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
