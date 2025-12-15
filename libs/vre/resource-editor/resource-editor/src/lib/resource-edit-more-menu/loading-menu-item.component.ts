import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProgressSpinnerComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { TranslatePipe } from '@ngx-translate/core';

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
  imports: [MatButtonModule, MatMenuModule, MatTooltipModule, TranslatePipe, ProgressSpinnerComponent],
})
export class LoadingMenuItemComponent {
  @Input({ required: true }) dataCy!: string;
  @Input({ required: true }) tooltipKey!: string;
  @Input({ required: true }) labelKey!: string;
}
