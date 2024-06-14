import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { ListNode } from '@dasch-swiss/dsp-js';
import { DEFAULT_MULTILANGUAGE_FORM, MultiLanguageFormArray } from '@dasch-swiss/vre/shared/app-string-literal';
import { ListItemService } from '../list-item/list-item.service';

@Component({
  selector: 'app-list-item-element',
  template: `
    <div style="display: flex">
      <button type="button" color="primary" mat-icon-button (click)="showChildren = !showChildren">
        <mat-icon>{{ showChildren ? 'expand_more' : 'chevron_right' }}</mat-icon>
      </button>

      <div style="flex: 1">
        <div (mouseenter)="mouseEnter()" (mouseleave)="mouseLeave()" style="position: relative">
          <dasch-swiss-multi-language-input
            [placeholder]="node.labels | appStringifyStringLiteral: 'all' | appTruncate: 128"
            [editable]="false"
            [formArray]="readOnlyFormArray"
            [validators]="[]">
          </dasch-swiss-multi-language-input>

          <app-action-bubble
            *ngIf="showActionBubble"
            [position]="position"
            [length]="length"
            [node]="node"></app-action-bubble>
        </div>

        <app-list-item
          *ngIf="showChildren"
          [projectUuid]="listItemService.projectInfos.projectIri"
          [rootNodeIri]="node.id"
          [isAdmin]="isAdmin">
        </app-list-item>
      </div>
    </div>
  `,
  styles: [':host ::ng-deep dasch-swiss-multi-language-input .mat-mdc-form-field-bottom-align { display: none;}'],
})
export class ListItemElementComponent implements OnInit, OnChanges {
  @Input() node: ListNode;
  @Input() position: number;
  @Input() length: number;

  @Output() refreshChildren = new EventEmitter<ListNode[]>();
  @Output() updateView = new EventEmitter<unknown>();

  @Input() isAdmin = false;
  showChildren = false;
  showActionBubble = false;

  readOnlyFormArray: MultiLanguageFormArray;

  constructor(public listItemService: ListItemService) {}

  ngOnInit() {
    this.buildForm();
  }

  ngOnChanges() {
    this.buildForm();
  }

  private buildForm() {
    this.readOnlyFormArray = DEFAULT_MULTILANGUAGE_FORM(this.node.labels);
  }

  mouseEnter() {
    if (this.isAdmin) {
      this.showActionBubble = true;
    }
  }

  mouseLeave() {
    this.showActionBubble = false;
  }
}
