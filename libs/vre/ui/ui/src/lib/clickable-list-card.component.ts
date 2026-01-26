import { Component, ViewEncapsulation } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MatList } from '@angular/material/list';

@Component({
  selector: 'app-clickable-list-card',
  encapsulation: ViewEncapsulation.None,
  template: `
    <mat-card appearance="outlined" style="margin: 16px 0">
      <mat-list style="padding: 0">
        <ng-content />
      </mat-list>
    </mat-card>
  `,
  styles: [
    `
      app-clickable-list-card .mat-mdc-list-item {
        border-radius: 8px;
        transition: background-color 0.2s;
        &:hover {
          cursor: pointer;
          background-color: rgba(0, 0, 0, 0.04);
        }
      }
    `,
  ],
  imports: [MatCard, MatList],
})
export class ClickableListCardComponent {}
