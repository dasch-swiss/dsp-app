import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-contacts-tab-view',
    templateUrl: './contacts-tab-view.component.html',
    styleUrls: ['./contacts-tab-view.component.scss']
})
export class ContactsTabViewComponent {
    // contact details
    @Input() contactDetails: object;
}
