import { Component, Input } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { TranslatePipe } from '@ngx-translate/core';
import { PropertiesDisplayComponent } from './properties-display/properties-display.component';
import { PropertiesToggleComponent } from './properties-display/properties-toggle.component';
import { PropertiesDisplayService } from './properties-display/property-value/properties-display.service';

@Component({
  selector: 'app-resource-default-tabs',
  template: `
    <mat-tab-group animationDuration="0ms">
      <mat-tab [label]="'resourceEditor.properties' | translate">
        <app-properties-toggle [properties]="resource.resProps" />
        <app-properties-display [resource]="resource" />
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [
    `
      :host ::ng-deep {
        .mat-mdc-tab-body,
        .mat-mdc-tab-body-content {
          height: auto !important;
          overflow: visible !important;
        }
      }
    `,
  ],
  imports: [MatTabsModule, TranslatePipe, PropertiesDisplayComponent, PropertiesToggleComponent],
})
export class ResourceDefaultTabsComponent {
  @Input({ required: true }) resource!: DspResource;

  constructor(public readonly propertiesDisplayService: PropertiesDisplayService) {}
}
