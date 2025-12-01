import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { GlobalSearchComponent } from './global-search.component';
import { HeaderLogoComponent } from './header-logo.component';
import { HeaderUserActionsComponent } from './header-user-actions.component';

@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, HeaderLogoComponent, GlobalSearchComponent, HeaderUserActionsComponent],
  template: `
    <mat-toolbar style="background: inherit; height: 56px; justify-content: space-between">
      <span style="display: flex; align-items: center">
        <app-header-logo />
        <h1 class="title" (click)="goToHomePage()">DaSCH Service Platform</h1>
      </span>
      <app-global-search />

      <app-header-user-actions />
    </mat-toolbar>
  `,
  styles: [
    `
      :host {
        display: block;
        border-bottom: 1px solid #ebebeb;
        background-color: #fcfdff;
      }
      .title {
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
        border-radius: 8px;

        &:hover {
          background-color: #e8e9eb;
        }
      }
    `,
  ],
  standalone: true,
})
export class HeaderComponent {
  constructor(private readonly _router: Router) {}

  goToHomePage() {
    this._router.navigate(['/']);
  }
}
