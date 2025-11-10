import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-menu-item',
  template: `
    <button
      [attr.data-cy]="dataCy"
      mat-menu-item
      [matTooltip]="tooltipKey | translate"
      matTooltipPosition="above"
      disabled>
      <span style="display: inline-flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; width: 32px; height: 24px;">
          <app-progress-spinner />
        </span>
        {{ labelKey | translate }}
      </span>
    </button>
  `,
  standalone: false,
})
export class LoadingMenuItemComponent {
  @Input({ required: true }) dataCy!: string;
  @Input({ required: true }) tooltipKey!: string;
  @Input({ required: true }) labelKey!: string;
}
