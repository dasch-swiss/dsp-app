import { Component, Input } from '@angular/core';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { PropertiesDisplayService } from './properties-display.service';

@Component({
  selector: 'app-property-row',
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
  standalone: false,
})
export class PropertyRowComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) borderBottom!: boolean;
  @Input({ required: true }) isEmptyRow!: boolean;
  @Input() tooltip: string | undefined;
  @Input() prop: PropertyInfoValues | undefined;
  @Input() singleRow = true;

  showAllProperties = this._propertiesDisplayService.showAllProperties$;

  constructor(private _propertiesDisplayService: PropertiesDisplayService) {}
}
