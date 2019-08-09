import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-list-info-form',
    templateUrl: './list-info-form.component.html',
    styleUrls: ['./list-info-form.component.scss']
})
export class ListInfoFormComponent implements OnInit {

    @Input() iri?: string;

    constructor () { }

    ngOnInit() {
    }

}
