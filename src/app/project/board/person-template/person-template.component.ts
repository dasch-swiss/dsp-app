import {Component, Input} from '@angular/core';

@Component({
    selector: 'app-person-template',
    templateUrl: './person-template.component.html',
    styleUrls: ['./person-template.component.scss']
})
export class PersonTemplateComponent {

    /*
    Format for person object:
    person = {
        jobTitle: '',
        givenName: '',
        familyName: '',
        email: ''.
        sameAs: '',
        address: '<address>',
        organisation: '<organisation>'
    }
     */
    // input parameter
    @Input() person: object;

}
