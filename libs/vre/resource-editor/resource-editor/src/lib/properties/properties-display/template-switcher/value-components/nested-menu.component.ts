import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatSelect } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { ListNodeV2WithAllLanguages, StringLiteralV2 } from '@dasch-swiss/dsp-js';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';

@Component({
  selector: 'app-nested-menu',
  imports: [
    MatFormField,
    MatMenuTrigger,
    MatLabel,
    MatSelect,
    MatMenuItem,
    MatMenu,
    MatTooltip,
    StringifyStringLiteralPipe,
  ],
  template: `
    @if (data.isRootNode) {
      <mat-form-field [matMenuTriggerFor]="menu" data-cy="select-list-button" style="width: 100%">
        <mat-label>{{
          (selection | appStringifyStringLiteral) || (data.labels | appStringifyStringLiteral)
        }}</mat-label>
        <mat-select />
      </mat-form-field>
    }
    @if (!data.isRootNode) {
      <div
        mat-menu-item
        data-cy="list-item-button"
        [matMenuTriggerFor]="menu"
        [matTooltip]="data.comments | appStringifyStringLiteral"
        matTooltipPosition="above"
        style="width: 100%"
        (click)="selectMenuWithChildren(data)"
        (mouseenter)="openSubMenu()">
        {{ data.labels | appStringifyStringLiteral }}
      </div>
    }
    <mat-menu #menu="matMenu">
      @for (node of data.children; track node; let i = $index) {
        @if (node.children.length > 0) {
          <button mat-menu-item style="padding: 0">
            <app-nested-menu [data]="node" (selectedNode)="selectedNode.emit($event)" />
          </button>
        } @else {
          <button
            mat-menu-item
            [matTooltip]="node.comments | appStringifyStringLiteral"
            matTooltipPosition="above"
            (click)="selectedNode.emit(node)"
            class="list-item-button"
            data-cy="list-item-button">
            {{ node.labels | appStringifyStringLiteral }}
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
  @Input() data!: ListNodeV2WithAllLanguages;
  @Input() selection: StringLiteralV2[] = [];
  @Output() selectedNode = new EventEmitter<ListNodeV2WithAllLanguages>();

  @ViewChild(MatMenu) menu!: MatMenu;
  @ViewChild(MatMenuTrigger) trigger!: MatMenuTrigger;

  selectMenuWithChildren(node: ListNodeV2WithAllLanguages) {
    this.menu.closed.emit('click');
    this.selectedNode.emit(node);
  }

  openSubMenu() {
    this.trigger.openMenu();
  }
}
