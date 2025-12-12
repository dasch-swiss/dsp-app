import { Component, forwardRef, Input, OnChanges } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ListNode } from '@dasch-swiss/dsp-js';
import { ensureWithDefaultLanguage } from '@dasch-swiss/vre/3rd-party-services/open-api';
import {
  DEFAULT_MULTILANGUAGE_FORM,
  MultiLanguageFormArray,
  MultiLanguageInputComponent,
  StringifyStringLiteralPipe,
} from '@dasch-swiss/vre/ui/string-literal';
import { TruncatePipe } from '@dasch-swiss/vre/ui/ui';
import { TranslateService } from '@ngx-translate/core';
import { ActionBubbleComponent } from '../action-bubble/action-bubble.component';
import { ListItemComponent } from '../list-item/list-item.component';

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
            [placeholder]="node.labels | appStringifyStringLiteral: true | appTruncate: 128"
            [editable]="false"
            [formArray]="readOnlyFormArray"
            [validators]="[]"
            [isRequired]="true" />

          @if (showActionBubble) {
            <app-action-bubble [position]="position" [length]="length" [node]="node" [parentNodeIri]="parentNodeIri" />
          }
        </div>

        @if (showChildren) {
          <app-list-item [node]="node" [parentNodeIri]="node.id" [isAdmin]="isAdmin" />
        }
      </div>
    </div>
  `,
  styles: [':host ::ng-deep app-multi-language-input .mat-mdc-form-field-bottom-align { display: none;}'],
  standalone: true,
  imports: [
    MatIconButton,
    MatIcon,
    MultiLanguageInputComponent,
    ActionBubbleComponent,
    forwardRef(() => ListItemComponent),
    StringifyStringLiteralPipe,
    TruncatePipe,
  ],
})
export class ListItemElementComponent implements OnChanges {
  @Input({ required: true }) node!: ListNode;
  @Input({ required: true }) position!: number;
  @Input({ required: true }) length!: number;
  @Input({ required: true }) parentNodeIri!: string;

  @Input() isAdmin = false;
  showChildren = false;
  showActionBubble = false;

  readOnlyFormArray: MultiLanguageFormArray = DEFAULT_MULTILANGUAGE_FORM([]);

  constructor(private readonly _translate: TranslateService) {}

  ngOnChanges() {
    this.buildForm();
  }

  private buildForm() {
    this.readOnlyFormArray = DEFAULT_MULTILANGUAGE_FORM(
      ensureWithDefaultLanguage(this.node.labels, this._translate.currentLang)
    );
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
