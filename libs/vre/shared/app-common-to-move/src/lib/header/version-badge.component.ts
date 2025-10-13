import { Component } from '@angular/core';
import { AppConfigService } from '@dasch-swiss/vre/core/config';

@Component({
  selector: 'app-version-badge',
  template: ` @if (!dsp.production) {
    <span class="badge">
      <span class="environment">{{ dsp.environment }}</span>
      <span class="release" [ngClass]="dsp.color">{{ dsp.release }}</span>
    </span>
  }`,
  styleUrls: ['version-badge.component.scss'],
  standalone: false,
})
export class VersionBadgeComponent {
  dsp = this._appConfigService.dspConfig;
  constructor(private _appConfigService: AppConfigService) {}
}
