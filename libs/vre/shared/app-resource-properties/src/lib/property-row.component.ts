import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-property-row',
  template: ` <div [class.border-bottom]="borderBottom" style="display: flex; padding: 8px 0;">
    <h3 class="label mat-subtitle-2" [matTooltip]="tooltip ?? ''" matTooltipPosition="above">{{ label }}</h3>
    <div style="flex: 1">
      <ng-content></ng-content>
    </div>
  </div>`,
  styles: [
    `
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
export class PropertyRowComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) borderBottom!: boolean;
  @Input() tooltip: string | undefined;
}
