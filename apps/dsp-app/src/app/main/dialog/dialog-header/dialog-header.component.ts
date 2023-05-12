import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-dialog-header',
    templateUrl: './dialog-header.component.html',
    styleUrls: ['./dialog-header.component.scss'],
})
export class DialogHeaderComponent {
    @Input() title: string;
    @Input() subtitle: string;

    @Output() close: EventEmitter<any> = new EventEmitter<any>();
}
