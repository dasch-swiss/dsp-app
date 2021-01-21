import { Component, Input } from '@angular/core';
import { IPerson } from '../dataset-metadata';

@Component({
    selector: 'app-person-template',
    templateUrl: './person-template.component.html',
    styleUrls: ['./person-template.component.scss']
})
export class PersonTemplateComponent {
    // input parameter
    @Input() person: IPerson;
}
