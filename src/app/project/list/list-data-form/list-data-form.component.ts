import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-list-data-form',
    templateUrl: './list-data-form.component.html',
    styleUrls: ['./list-data-form.component.scss']
})
export class ListDataFormComponent implements OnInit {

    @Input() iri?: string;

    constructor () { }

    ngOnInit() {
    }

}
