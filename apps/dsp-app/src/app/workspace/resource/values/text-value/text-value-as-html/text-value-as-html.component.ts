import { Component, OnInit, OnDestroy, Input, EventEmitter, Output } from '@angular/core';
import { ReadTextValueAsHtml } from '@dasch-swiss/dsp-js';
import { BaseValueDirective } from '../../../../../main/directive/base-value.directive';

@Component({
  selector: 'app-text-value-as-html',
  templateUrl: './text-value-as-html.component.html',
  styleUrls: ['./text-value-as-html.component.scss'],
})
export class TextValueAsHtmlComponent extends BaseValueDirective implements OnInit, OnDestroy {
  @Input() displayValue?: ReadTextValueAsHtml;

  @Output() internalLinkClicked: EventEmitter<string> = new EventEmitter<string>();

  @Output() internalLinkHovered: EventEmitter<string> = new EventEmitter<string>();

  customValidators = [];

  commentLabel = 'Comment';
  htmlFromKnora: string;
  comment: string;

  ngOnInit() {
    this.htmlFromKnora = this.getInitValue();
    this.comment = this.getInitComment();
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  getInitValue() {
    if (this.displayValue !== undefined) {
      return this.displayValue.html;
    } else {
      return null;
    }
  }

  // readonly
  getNewValue(): false {
    return false;
  }

  // readonly
  getUpdatedValue(): false {
    return false;
  }
}
