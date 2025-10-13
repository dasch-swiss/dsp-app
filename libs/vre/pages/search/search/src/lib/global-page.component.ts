import { Component } from '@angular/core';

@Component({
  selector: 'app-global-page',
  template: ` <app-header /> <router-outlet />`,
  standalone: false,
})
export class GlobalPageComponent {}
