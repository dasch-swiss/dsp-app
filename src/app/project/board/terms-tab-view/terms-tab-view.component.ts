import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-terms-tab-view',
    templateUrl: './terms-tab-view.component.html',
    styleUrls: ['./terms-tab-view.component.scss']
})
export class TermsTabViewComponent {

    // conditions input from parent component to display it in template
    @Input() conditions: string;

    // license from parent component to display it in template
    @Input() license: object;

}
