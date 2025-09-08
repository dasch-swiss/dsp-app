import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { ListNodeV2 } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-nested-menu',
  template: `
    @if (data.isRootNode) {
      <mat-form-field [matMenuTriggerFor]="menu" data-cy="select-list-button" style="width: 100%">
        <mat-label>{{ selection ?? data.label }}</mat-label>
        <mat-select />
      </mat-form-field>
    }
    @if (!data.isRootNode) {
      <div
        mat-menu-item
        [matMenuTriggerFor]="menu"
        style="width: 100%"
        (click)="selectMenuWithChildren(data)"
        (mouseenter)="openSubMenu()">
        {{ data.label }}
      </div>
    }
    <mat-menu #menu="matMenu">
      @for (node of data.children; track node; let i = $index) {
        @if (node.children.length > 0) {
          <button mat-menu-item style="padding: 0">
            <app-nested-menu [data]="node" (selectedNode)="selectedNode.emit($event)" />
          </button>
        } @else {
          <button mat-menu-item (click)="selectedNode.emit(node)" class="list-item-button" data-cy="list-item-button">
            {{ node.label }}
          </button>
        }
      }
    </mat-menu>
  `,
  styles: [
    `
      .list-item-button {
        padding: 0 16px;
        width: 400px;
      }

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
