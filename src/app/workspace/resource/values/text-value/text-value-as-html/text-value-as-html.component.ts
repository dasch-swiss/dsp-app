import { Component, OnInit, Inject, Input, ElementRef, EventEmitter, Output } from '@angular/core';
import { ReadTextValueAsHtml } from '@dasch-swiss/dsp-js';
import { UntypedFormControl, UntypedFormGroup, FormBuilder } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BaseValueDirective } from 'src/app/main/directive/base-value.directive';

@Component({
    selector: 'app-text-value-as-html',
    templateUrl: './text-value-as-html.component.html',
    styleUrls: ['./text-value-as-html.component.scss']
})
export class TextValueAsHtmlComponent extends BaseValueDirective implements OnInit {

    @Input() displayValue?: ReadTextValueAsHtml;

    @Output() internalLinkClicked: EventEmitter<string> = new EventEmitter<string>();

    @Output() internalLinkHovered: EventEmitter<string> = new EventEmitter<string>();

    valueFormControl: UntypedFormControl;
    commentFormControl: UntypedFormControl;

    form: UntypedFormGroup;

    valueChangesSubscription: Subscription;

    customValidators = [];

    commentLabel = 'Comment';
    htmlFromKnora: string;
    comment: string;

    constructor() {
        super();
    }

    ngOnInit() {
        this.htmlFromKnora = this.getInitValue();
        this.comment = this.getInitComment();
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
