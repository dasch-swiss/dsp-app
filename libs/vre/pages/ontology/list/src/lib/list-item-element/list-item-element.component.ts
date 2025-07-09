import { Component, Input, OnChanges } from '@angular/core';
import { ListNode } from '@dasch-swiss/dsp-js';
import { DEFAULT_MULTILANGUAGE_FORM, MultiLanguageFormArray } from '@dasch-swiss/vre/ui/string-literal';

@Component({
  selector: 'app-list-item-element',
  template: `
    <div style="display: flex">
      <button type="button" color="primary" mat-icon-button (click)="showChildren = !showChildren">
        <mat-icon>{{ showChildren ? 'expand_more' : 'chevron_right' }}</mat-icon>
      </button>

      <div style="flex: 1">
        <div (mouseenter)="mouseEnter()" (mouseleave)="mouseLeave()" style="position: relative">
          <app-multi-language-input
            [placeholder]="node.labels | appStringifyStringLiteral: 'all' | appTruncate: 128"
            [editable]="false"
            [formArray]="readOnlyFormArray"
            [validators]="[]"
            [isRequired]="true" />

          <app-action-bubble *ngIf="showActionBubble" [position]="position" [length]="length" [node]="node" />
        </div>

        <app-list-item *ngIf="showChildren" [node]="node" [isAdmin]="isAdmin" />
      </div>
    </div>
  `,
  styles: [':host ::ng-deep app-multi-language-input .mat-mdc-form-field-bottom-align { display: none;}'],
})
export class ListItemElementComponent implements OnChanges {
  @Input({ required: true }) node!: ListNode;
  @Input({ required: true }) position!: number;
  @Input({ required: true }) length!: number;

  @Input() isAdmin = false;
  showChildren = false;
  showActionBubble = false;

  readOnlyFormArray: MultiLanguageFormArray = DEFAULT_MULTILANGUAGE_FORM([]);

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
