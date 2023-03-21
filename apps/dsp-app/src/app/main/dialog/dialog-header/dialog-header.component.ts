import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-dialog-header',
    templateUrl: './dialog-header.component.html',
    styleUrls: ['./dialog-header.component.scss'],
})
export class DialogHeaderComponent implements OnInit {
    @Input() title: string;
    @Input() subtitle: string;

    @Output() close: EventEmitter<any> = new EventEmitter<any>();

    constructor() {}

    ngOnInit() {}
}
