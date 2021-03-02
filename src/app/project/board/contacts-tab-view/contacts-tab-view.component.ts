import { Component, Input, OnInit } from '@angular/core';
import { IId, Organization, Person } from '@dasch-swiss/dsp-js';
import { MetadataService } from '../dataset-metadata.service';

@Component({
    selector: 'app-contacts-tab-view',
    templateUrl: './contacts-tab-view.component.html',
    styleUrls: ['./contacts-tab-view.component.scss']
})
export class ContactsTabViewComponent implements OnInit {
    // contact details
    @Input() contactDetails: Person[] | Organization[] | IId[];

    @Input() subProperties: Object;

    contactsList = [];
    contactType: string;

    constructor(private _metadataService: MetadataService) {
    }

    ngOnInit() {

        if (this.contactDetails) {
            // check which type of array is present
            this.contactType = this._metadataService.getContactType(this.contactDetails[0]);

            // if contactType is person or organization
            if (this.contactType) {
                this.contactsList = this.contactDetails;
                return;
            }

            // if contactType is undefined, it means it contains the array of IId objects
            for (const contact of this.contactDetails) {
                this.contactsList.push(this.subProperties[contact.id]);
            }
            this.contactType = this._metadataService.getContactType(this.contactsList[0]);
        }
    }
}
