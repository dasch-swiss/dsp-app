import { Component, OnInit } from '@angular/core';
import { AppMessageData } from 'src/app/main/action/message/message.component';

@Component({
    selector: 'app-groups-list',
    templateUrl: './groups-list.component.html',
    styleUrls: ['./groups-list.component.scss']
})
export class GroupsListComponent implements OnInit {

    message: AppMessageData = {
        status: 200,
        statusText: 'The list of permission groups is not yet implemented. But we are working on it.'
    };

    constructor() { }

    ngOnInit() {
    }

}
