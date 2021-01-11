import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-project-tab-view',
    templateUrl: './project-tab-view.component.html',
    styleUrls: ['./project-tab-view.component.scss']
})
export class ProjectTabViewComponent {

    // metadata object
    @Input() metadata: object;

    // metadata keys that we do not want to display in template
    excludeKeys = ['contactPoint'];

    // list of date keys from metadata object
    // used for formatting
    dateKeys = ['startDate', 'endDate'];

}
