import { Component, Input, OnChanges } from '@angular/core';
import { Constants, ReadLinkValue } from '@dasch-swiss/dsp-js';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { TranslatePipe } from '@ngx-translate/core';
import { PropertyRowComponent } from '../resource-properties/property-row.component';
import { sortByKeys } from '../resource-properties/sortByKeys';
import { IncomingOrStandoffLink } from './incoming-link.interface';
import { IncomingStandoffLinkValueComponent } from './incoming-standoff-link-value.component';

@Component({
  selector: 'app-standoff-links-property',
  template: ` <app-property-row
    [tooltip]="'resourceEditor.propertiesDisplay.standoffLinkTooltip' | translate"
    [label]="'resourceEditor.propertiesDisplay.standoffLinkLabel' | translate"
    [isEmptyRow]="standoffLinks.length === 0"
    [borderBottom]="true">
    <app-incoming-standoff-link-value [links]="standoffLinks" />
  </app-property-row>`,
  imports: [PropertyRowComponent, IncomingStandoffLinkValueComponent, TranslatePipe],
})
export class StandoffLinksPropertyComponent implements OnChanges {
  @Input({ required: true }) resource!: DspResource;

  standoffLinks: IncomingOrStandoffLink[] = [];

  ngOnChanges() {
    this.standoffLinks = (
      (this.resource.resProps.find(prop => prop.propDef.id === Constants.HasStandoffLinkToValue)
        ?.values as ReadLinkValue[]) ?? []
    ).map(link => {
      const parts = link.linkedResourceIri.split('/');
      if (parts.length < 2) {
        throw new AppError('Linked resource IRI is not in the expected format');
      }

      const resourceIdPathOnly = parts.slice(-2).join('/');

      return {
        label: link.strval ?? '',
        uri: `/resource/${resourceIdPathOnly}`,
        iri: link.linkedResourceIri,
        project: link.linkedResource?.resourceClassLabel ?? '',
      };
    });
    this.standoffLinks = sortByKeys(this.standoffLinks, ['project', 'label']);
  }
}
