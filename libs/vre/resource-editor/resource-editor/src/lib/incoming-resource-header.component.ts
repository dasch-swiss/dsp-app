import { Component, Input } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { GenerateProperty } from '@dasch-swiss/vre/shared/app-common';

@Component({
  selector: 'app-incoming-resource-header',
  template: `
    <div class="incoming-resource-header">
      <h4 data-cy="resource-header-label">{{ resource.label }}</h4>
      <div class="incoming-resource-actions">
        <app-properties-toggle [properties]="resourceProperties" [displayIconsOnly]="true" />
        <app-incoming-resource-toolbar [resource]="resource" />
      </div>
    </div>
    <app-resource-info-bar [resource]="resource" />
  `,
  styles: [
    `
      .incoming-resource-header {
        background: #eaeff3;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .incoming-resource-header h4 {
        margin: 0 16px;
      }

      .incoming-resource-actions {
        display: flex;
        flex-direction: row;
        gap: 8px;
        align-items: center;
      }

      app-resource-info-bar {
        display: flex;
        flex-direction: row-reverse;
      }
    `,
  ],
  standalone: false,
})
export class IncomingResourceHeaderComponent {
  @Input({ required: true }) resource!: ReadResource;

  get resourceProperties() {
    return GenerateProperty.incomingRessourceProperty(this.resource);
  }
}
