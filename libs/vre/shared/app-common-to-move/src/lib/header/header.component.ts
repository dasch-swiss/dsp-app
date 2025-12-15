import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { GlobalSearchComponent } from './global-search.component';
import { HeaderLogoComponent } from './header-logo.component';
import { HeaderUserActionsComponent } from './header-user-actions.component';

@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, RouterLink, HeaderLogoComponent, GlobalSearchComponent, HeaderUserActionsComponent],
  template: `
    <mat-toolbar style="background: inherit; height: 56px; justify-content: space-between">
      <span style="display: flex; align-items: center">
        <app-header-logo />
        <a class="title" routerLink="/">DaSCH Service Platform</a>
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
        text-decoration: none;
        color: inherit;
        display: inline-block;

        &:hover {
          background-color: #e8e9eb;
        }
      }
    `,
  ],
})
export class HeaderComponent {}
