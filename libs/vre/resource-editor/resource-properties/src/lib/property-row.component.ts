import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { TranslateService } from '@ngx-translate/core';
import { Subject, of } from 'rxjs';
import { takeUntil, takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-property-row',
  template: ` <div [class.border-bottom]="borderBottom" #rowElement style="display: flex; padding: 8px 0;">
    <h3 class="label mat-subtitle-2" [matTooltip]="tooltip ?? ''" matTooltipPosition="above">{{ propLabel }}</h3>
    <div style="flex: 1">
      <ng-content></ng-content>
    </div>
  </div>`,
  styles: [
    `
      @use '../../../../../../apps/dsp-app/src/styles/config' as *;

      .currentValue {
        background-color: $yellow_100;
      }

      .label {
        color: rgb(107, 114, 128);
        align-self: start;
        cursor: help;
        width: 150px;
        margin-top: 0px;
        text-align: right;
        padding-right: 24px;
        flex-shrink: 0;
      }
    `,
  ],
})
export class PropertyRowComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) borderBottom!: boolean;
  @Input() tooltip: string | undefined;
  @Input() prop: PropertyInfoValues | undefined;

  @ViewChild('rowElement', { static: false }) rowElement!: ElementRef;

  destroyed: Subject<void> = new Subject<void>();

  get valueId() {
    return this.prop && this.prop.values.length > 0 ? this.prop.values[0]?.id.split('/').pop() : undefined;
  }

  get isLinkValueProperty(): boolean {
    return (
      (this.prop?.propDef as any)?.isLinkValueProperty === true &&
      (this.prop?.values[0] as any)?.linkedResource !== undefined
    );
  }

  get propLabel(): string {
    const label = this._translateService.instant('resource.propertyLabels.linkedProperty');
    return this.isLinkValueProperty ? label : this.label;
  }

  constructor(
    private route: ActivatedRoute,
    private _translateService: TranslateService
  ) {}

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
            this.route.snapshot.paramMap.get(RouteConstants.valueParameter) === value &&
            this.rowElement !== undefined
        )
      )
      .subscribe(() => {
        this.rowElement.nativeElement.scrollIntoView({ behavior: 'smooth' });
        this.rowElement.nativeElement.classList.add('currentValue');
      });
  }
}
