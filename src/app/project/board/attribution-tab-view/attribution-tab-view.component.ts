import { Component, Input } from '@angular/core';
import { Attribution, IId, Organization, Person } from '@dasch-swiss/dsp-js';
import { MetadataService } from '../dataset-metadata.service';

@Component({
    selector: 'app-attribution-tab-view',
    templateUrl: './attribution-tab-view.component.html',
    styleUrls: ['./attribution-tab-view.component.scss']
})
export class AttributionTabViewComponent {
    // attribution input
    @Input() attributions: Attribution[];

    @Input() subProperties: Object;

    currentAgent: Person | Organization | IId;

    constructor(private _metadataService: MetadataService) {
    }

    // return the type of agent to use correct template to display it
    setAgent (agent: Person | Organization | IId): string {
        let atype = this._metadataService.getContactType(agent);
        if (atype) {
            this.currentAgent = agent;
        } else {
            this.currentAgent = this.subProperties[agent.id];
            atype = this._metadataService.getContactType(this.currentAgent);
        }
        return atype;
    }
}
