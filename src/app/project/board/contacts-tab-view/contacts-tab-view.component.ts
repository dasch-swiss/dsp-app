import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-contacts-tab-view',
    templateUrl: './contacts-tab-view.component.html',
    styleUrls: ['./contacts-tab-view.component.scss']
})
export class ContactsTabViewComponent implements OnInit {

    // contact details
    @Input() contactDetails: object;

    ngOnInit(): void {
        // reformat data
        if (this.contactDetails['sameAs']) {
            this.contactDetails['sameAs'] = this.contactDetails['sameAs']['value'];
        }

        if (this.contactDetails['organisation']) {
            if (this.contactDetails['organisation']['url']) {
                this.contactDetails['organisation']['url'] = this.contactDetails['organisation']['url']['value'];
            }
        }
    }

}
