import { Component, Input } from '@angular/core';
import { IAttribution, IOrganisation, IPerson } from '../dataset-metadata';

@Component({
    selector: 'app-attribution-tab-view',
    templateUrl: './attribution-tab-view.component.html',
    styleUrls: ['./attribution-tab-view.component.scss']
})
export class AttributionTabViewComponent {
    // attribution input
    @Input() attributions: IAttribution[];

    // return the type of agent to use correct template to display it
    getAgentType(agent: IPerson | IOrganisation) {
        if (agent.hasOwnProperty('familyName')) {
            return 'person';
        }
        if (agent.hasOwnProperty('url')) {
            return 'organisation';
        }
    }
}
