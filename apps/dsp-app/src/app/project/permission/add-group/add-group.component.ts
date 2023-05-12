import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-add-group',
    templateUrl: './add-group.component.html',
    styleUrls: ['./add-group.component.scss'],
})
export class AddGroupComponent {
    @Input() projectUuid: string;

    @Output() refreshParent: EventEmitter<any> = new EventEmitter<any>();

    constructor() {}

    buildForm(): void {}
}
