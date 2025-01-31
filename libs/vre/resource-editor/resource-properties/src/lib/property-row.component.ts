import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { of, Subject } from 'rxjs';
import { takeUntil, takeWhile } from 'rxjs/operators';
import { FootnoteService } from './footnote.service';

@Component({
  selector: 'app-property-row',
  template: ` <div [class.border-bottom]="borderBottom" #rowElement style="display: flex; padding: 8px 0;">
    <h3 class="label mat-subtitle-2" [matTooltip]="tooltip ?? ''" matTooltipPosition="above">{{ label }}</h3>
    <div style="flex: 1">
      <ng-content />
      <app-footnotes *ngIf="footnoteService.footnotes.length > 0" />
    </div>
  </div>`,
  providers: [FootnoteService],
  styleUrls: ['./property-row.component.scss'],
})
export class PropertyRowComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) borderBottom!: boolean;
  @Input() tooltip: string | undefined;
  @Input() prop: PropertyInfoValues | undefined;

  @ViewChild('rowElement', { static: false }) rowElement!: ElementRef;

  destroyed: Subject<void> = new Subject<void>();

  get valueId() {
    return this.prop && this.prop.values.length > 0 ? this.prop.values[0]?.id.split('/').pop() : undefined;
  }

  constructor(
    private _route: ActivatedRoute,
    public footnoteService: FootnoteService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['prop']) {
      this.footnoteService.reset();
    }
  }

  ngAfterViewInit() {
    this.highlightArkValue();
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  highlightArkValue(): void {
    of(this.valueId)
      .pipe(
        takeUntil(this.destroyed),
        takeWhile(
          value =>
            value !== undefined &&
            this._route.snapshot.paramMap.get(RouteConstants.valueParameter) === value &&
            this.rowElement !== undefined
        )
      )
      .subscribe(() => {
        this.rowElement.nativeElement.scrollIntoView({ behavior: 'smooth' });
        this.rowElement.nativeElement.classList.add('currentValue');
      });
  }
}
