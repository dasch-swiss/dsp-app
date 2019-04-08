import { Component, OnInit } from '@angular/core';
import { MenuItem } from '../main/declarations/menu-item';
import { AppGlobal } from '../app-global';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-system',
  templateUrl: './system.component.html',
  styleUrls: ['./system.component.scss']
})
export class SystemComponent implements OnInit {

  loading: boolean = true;
  error: boolean;

  navigation: MenuItem[] = AppGlobal.systemNav;

  constructor(private _titleService: Title) {
      // set the page title
      this._titleService.setTitle('System administration');
   }

  ngOnInit() {
  }

}
