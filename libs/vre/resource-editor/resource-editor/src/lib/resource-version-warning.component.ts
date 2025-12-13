import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { AlertInfoComponent } from './alert-info.component';

@Component({
  selector: 'app-resource-version-warning',
  template: `
    <app-alert-info>
      <div style="display: flex; justify-content: center">
        <div style="display: flex; align-items: center">
          {{ 'resourceEditor.versioned' | translate }} {{ resourceVersion }}.
          <button mat-button color="primary" (click)="navigateToCurrentVersion.emit()">
            {{ 'resourceEditor.seeCurrentVersion' | translate }}
          </button>
        </div>
      </div>
    </app-alert-info>
  `,
  imports: [MatButtonModule, TranslateModule, AlertInfoComponent],
})
export class ResourceVersionWarningComponent {
  @Input({ required: true }) resourceVersion!: string;
  @Output() navigateToCurrentVersion = new EventEmitter<void>();
}
