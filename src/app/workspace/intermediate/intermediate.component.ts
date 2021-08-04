import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FilteredResouces } from '@dasch-swiss/dsp-ui';

@Component({
    selector: 'app-intermediate',
    templateUrl: './intermediate.component.html',
    styleUrls: ['./intermediate.component.scss']
})
export class IntermediateComponent implements OnInit {

    @Input() resources: FilteredResouces;

    @Output() action: EventEmitter<string> = new EventEmitter<string>();

    // i18n plural mapping
    itemPluralMapping = {
        resource: {
            '=1': 'Resource',
            other: 'Resources'
        }
    };

    constructor() { }

    ngOnInit(): void { }

}
