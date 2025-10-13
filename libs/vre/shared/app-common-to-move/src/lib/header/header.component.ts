import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
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
  standalone: false,
})
export class HeaderComponent {
  constructor(private _router: Router) {}

  goToHomePage() {
    this._router.navigate(['/']);
  }
}
