import { Component, Input } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { TranslatePipe } from '@ngx-translate/core';
import { PropertiesDisplayComponent } from './properties-display/properties-display.component';
import { PropertiesToggleComponent } from './properties-display/properties-toggle.component';
import { PropertiesDisplayService } from './properties-display/property-value/properties-display.service';
import { ResourceRightsStatementContainerComponent } from './resource-rights-statement-container.component';

@Component({
  selector: 'app-resource-default-tabs',
  template: `
    <mat-tab-group animationDuration="0ms">
      <mat-tab [label]="'resourceEditor.properties' | translate">
        <app-properties-toggle [properties]="resource.resProps" />
        <app-properties-display [resource]="resource" />
        <app-resource-rights-statement-container [resource]="resource" />
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

        /* A flex item, so by default never narrower than its content: a value that cannot wrap (a long URL) would
           widen the whole tab, and the tab wrapper's clipping would cut off every value's Edit and Delete. */
        .mat-mdc-tab-body {
          min-width: 0;
        }
      }
    `,
  ],
  imports: [
    MatTabsModule,
    TranslatePipe,
    PropertiesDisplayComponent,
    PropertiesToggleComponent,
    ResourceRightsStatementContainerComponent,
  ],
})
export class ResourceDefaultTabsComponent {
  @Input({ required: true }) resource!: DspResource;

  constructor(public readonly propertiesDisplayService: PropertiesDisplayService) {}
}
