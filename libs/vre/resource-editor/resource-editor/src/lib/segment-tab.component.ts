import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { Segment, SegmentsService } from '@dasch-swiss/vre/resource-editor/segment-support';
import { delay, Subscription } from 'rxjs';

@Component({
  selector: 'app-segment-tab',
  template: `@for (segment of segmentsService.segments; track segment) {
    <div [id]="segment.resource.res.id" [class.active]="segment === selectedSegment">
      <app-properties-display [resource]="segment.resource" [parentResourceId]="resource.id" />
    </div>
  }`,
  styles: ['.active {border: 1px solid}'],
})
export class SegmentTabComponent implements OnInit, OnDestroy {
  @Input({ required: true }) resource!: ReadResource;

  selectedSegment: Segment | null = null;
  subscription!: Subscription;

  constructor(
    public segmentsService: SegmentsService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscription = this.segmentsService.highlightSegment$
      .pipe(
        delay(100) // delay in order to let time to change tab and then scroll
      )
      .subscribe(segment => {
        this.selectedSegment = segment;
        if (segment !== null) {
          this._openSegment(segment.resource.res.id);
        }
        this._cdr.detectChanges();
      });
  }

  private _openSegment(iri: string) {
    document.getElementById(iri)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
