import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '@dasch-swiss/vre/shared/app-common-to-move';

@Component({
  selector: 'app-global-page',
  template: ` <app-header /> <router-outlet />`,
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
})
export class GlobalPageComponent {}
