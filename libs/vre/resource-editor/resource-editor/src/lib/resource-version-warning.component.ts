import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';

@Component({
  selector: 'app-resource-version-warning',
  template: `
    <app-alert-info>
      <div style="display: flex; justify-content: center">
        <div style="display: flex; align-items: center">
          {{ 'resourceEditor.versioned' | translate }} {{ resourceVersion }}.
          <button mat-button color="primary" (click)="navigateToCurrentVersion()">
            {{ 'resourceEditor.seeCurrentVersion' | translate }}
          </button>
        </div>
      </div>
    </app-alert-info>
  `,
})
export class ResourceVersionWarningComponent {
  @Input({ required: true }) resourceVersion!: string;

  constructor(
    private _router: Router,
    private _resourceFetcherService: ResourceFetcherService
  ) {}

  navigateToCurrentVersion() {
    this._removeQueryParam().then(() => {
      this._resourceFetcherService.reload();
    });
  }

  private _removeQueryParam() {
    return this._router.navigate([], {
      queryParams: { version: null }, // Set parameter to null to remove it
      queryParamsHandling: 'merge',
    });
  }
}
