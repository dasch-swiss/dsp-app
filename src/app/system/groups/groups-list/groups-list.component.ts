import { Component, OnInit } from '@angular/core';
import { KuiMessageData } from '@knora/action';

@Component({
  selector: 'app-groups-list',
  templateUrl: './groups-list.component.html',
  styleUrls: ['./groups-list.component.scss']
})
export class GroupsListComponent implements OnInit {

  message: KuiMessageData = {
    status: 200,
    statusText: 'The list of permission groups is not yet implemented. But we are working on it.'
  };

  constructor () { }

  ngOnInit() {
  }

}
