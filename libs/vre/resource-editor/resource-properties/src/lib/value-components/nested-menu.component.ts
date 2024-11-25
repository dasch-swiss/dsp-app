import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { ListNodeV2 } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-nested-menu',
  template: `
    <mat-form-field *ngIf="data.isRootNode" [matMenuTriggerFor]="menu" data-cy="select-list-button" style="width: 100%">
      <mat-label>{{ selection ?? data.label }}</mat-label>
      <mat-select></mat-select>
    </mat-form-field>
    <div
      *ngIf="!data.isRootNode"
      mat-menu-item
      [matMenuTriggerFor]="menu"
      style="width: 100%"
      (click)="selectMenuWithChildren(data)"
      (mouseenter)="openSubMenu()">
      {{ data.label }}
    </div>
    <mat-menu #menu="matMenu">
      <ng-container *ngFor="let node of data.children; let i = index">
        <button mat-menu-item style="padding: 0" *ngIf="node.children.length > 0; else menuItem">
          <app-nested-menu [data]="node" (selectedNode)="selectedNode.emit($event)"></app-nested-menu>
        </button>
        <ng-template #menuItem>
          <button
            mat-menu-item
            (click)="selectedNode.emit(node)"
            style="padding: 0 16px; width: 400px"
            data-cy="list-item-button">
            {{ node.label }}
          </button>
        </ng-template>
      </ng-container>
    </mat-menu>
  `,
  styles: [
    `
      ::ng-deep span.mat-mdc-menu-item-text {
        width: 100%;
      }
    `,
  ],
})
export class NestedMenuComponent {
  @Input() data!: ListNodeV2;
  @Input() selection!: string;
  @Output() selectedNode = new EventEmitter<ListNodeV2>();

  @ViewChild(MatMenu) menu!: MatMenu;
  @ViewChild(MatMenuTrigger) trigger!: MatMenuTrigger;

  selectMenuWithChildren(node: ListNodeV2) {
    this.menu.closed.emit('click');
    this.selectedNode.emit(node);
  }

  openSubMenu() {
    this.trigger.openMenu();
  }
}
