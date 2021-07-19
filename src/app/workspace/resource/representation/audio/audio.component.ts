import { Component, Input, OnInit } from '@angular/core';
import { FileRepresentation } from '../file-representation';

@Component({
    selector: 'app-audio',
    templateUrl: './audio.component.html',
    styleUrls: ['./audio.component.scss']
})
export class AudioComponent implements OnInit {

    @Input() src: FileRepresentation;


    constructor() { }

    ngOnInit(): void {

    }

}
