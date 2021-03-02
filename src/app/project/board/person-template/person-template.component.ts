import { Component, Input, OnInit } from '@angular/core';
import { Organization, Person } from '@dasch-swiss/dsp-js';


@Component({
    selector: 'app-person-template',
    templateUrl: './person-template.component.html',
    styleUrls: ['./person-template.component.scss']
})
export class PersonTemplateComponent implements OnInit {
    // input parameter
    @Input() person: Person;

    @Input() subProperties: Object;

    organizationList = [];

    ngOnInit() {
        // check if members list is the list of [Organization] or [Iid]
        let isOrganizationType = false;

        // if it is [Organization]
        if (this.person.memberOf[0] instanceof Organization) {
            isOrganizationType = true;
            this.organizationList = this.person.memberOf;
        }

        // if it is [Iid], get data for every organization
        if (!isOrganizationType) {
            for (const entry of this.person.memberOf) {
                this.organizationList.push(this.subProperties[entry.id]);
            }
        }
    }
}
