import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-create-resource-form-row',
  template: `
    <div style="display: flex">
      <h3 class="mat-subtitle-2 grid-h3" [matTooltip]="tooltip" matTooltipPosition="above">
        {{ label }}
      </h3>
      <div style="flex: 1">
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      .grid-h3 {
        width: 140px;
        margin-right: 10px;
        text-align: right;
        margin-top: 16px;
        color: rgb(107, 114, 128);
        cursor: help;
      }
    `,
  ],
})
export class CreateResourceFormRowComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) tooltip!: string;
}
