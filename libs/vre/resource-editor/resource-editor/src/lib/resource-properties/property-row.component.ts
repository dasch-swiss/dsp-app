import { AsyncPipe, NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { PropertiesDisplayService } from './properties-display.service';

@Component({
  selector: 'app-property-row',
  imports: [AsyncPipe, NgClass, MatTooltip],
  template: ` <div
    class="property-row"
    [class.border-bottom]="borderBottom"
    [ngClass]="{ hidden: (showAllProperties | async) === false && isEmptyRow }">
    <div class="label mat-subtitle-2" [matTooltip]="tooltip ?? ''" matTooltipPosition="above">{{ label }}</div>
    <div style="flex: 1" class="value" [ngClass]="{ 'with-styling': singleRow }">
      <ng-content />
    </div>
  </div>`,
  styleUrls: ['./property-row.component.scss'],
})
export class PropertyRowComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) borderBottom!: boolean;
  @Input({ required: true }) isEmptyRow!: boolean;
  @Input() tooltip: string | undefined;
  @Input() prop: PropertyInfoValues | undefined;
  @Input() singleRow = true;

  showAllProperties = this._propertiesDisplayService.showAllProperties$;

  constructor(private readonly _propertiesDisplayService: PropertiesDisplayService) {}
}
