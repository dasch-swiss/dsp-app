import { AfterViewInit, Component, ElementRef, Input, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { RegionService } from '@dasch-swiss/vre/resource-editor/representations';
import { DspResource, ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-annotation-tab',
  template: ` <div
    *ngFor="let annotation of regionService.regions$ | async; trackBy: trackAnnotationByFn"
    [attr.data-annotation-resource]="annotation.res.id"
    [class.active]="annotation.res.id === selectedRegion"
    #annotationElement
    data-cy="annotation-border">
    <app-properties-display
      [resource]="annotation"
      [properties]="annotation.resProps"
      [displayLabel]="true"
      [linkToNewTab]="
        resourceService.getResourcePath(resource.res.id) +
        '?' +
        RouteConstants.annotationQueryParam +
        '=' +
        annotation.res.id
      "
      (afterResourceDeleted)="afterResourceDeleted()" />
  </div>`,
  styles: ['.active {border: 1px solid}'],
})
export class AnnotationTabComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) resource!: DspResource;
  @ViewChildren('annotationElement') annotationElements!: QueryList<ElementRef>;
  selectedRegion: string | null = null;

  private _subscription!: Subscription;

  constructor(
    public regionService: RegionService,
    public resourceService: ResourceService
  ) {}

  ngAfterViewInit() {
    this._subscription = this.regionService.selectedRegion$.subscribe(region => {
      this.selectedRegion = region;
      if (region !== null) {
        this._scrollToRegion(region);
      }
    });
  }

  afterResourceDeleted() {
    this.regionService.updateRegions$().pipe(take(1)).subscribe();
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  trackAnnotationByFn = (index: number, item: DspResource) => `${index}-${item.res.id}`;
  protected readonly RouteConstants = RouteConstants;

  private _scrollToRegion(iri: string) {
    const region = this.annotationElements.find(
      element => element.nativeElement.getAttribute('data-annotation-resource') === iri
    );

    if (!region) {
      throw new AppError('An overlay does not have corresponding resource');
    }

    region.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }
}
