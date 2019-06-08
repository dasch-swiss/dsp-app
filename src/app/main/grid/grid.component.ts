import { Component, OnInit, Input } from '@angular/core';

export interface GridItem {
    icon?: string;
    title: string;
    url?: string;
    text: string;
}

@Component({
    selector: 'app-grid',
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.scss']
})
export class GridComponent implements OnInit {
    @Input() list: GridItem[];

    constructor () { }

    ngOnInit() { }
}
