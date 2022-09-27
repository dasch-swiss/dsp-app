import {
    Component,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CreateTextValueAsString, ReadTextValueAsString, UpdateTextValueAsString } from '@dasch-swiss/dsp-js';
import * as Editor from 'ckeditor5-custom-build';
import { BaseValueDirective } from 'src/app/main/directive/base-value.directive';
import { ValueErrorStateMatcher } from '../../value-error-state-matcher';
import { ckEditor } from '../ck-editor';

@Component({
    selector: 'app-text-value-as-string',
    templateUrl: './text-value-as-string.component.html',
    styleUrls: ['./text-value-as-string.component.scss']
})
export class TextValueAsStringComponent extends BaseValueDirective implements OnInit, OnChanges, OnDestroy {

    @Input() displayValue?: ReadTextValueAsString;
    @Input() textArea?: boolean = false;

    @Input() guiElement: 'simpleText' | 'textArea' | 'richText' = 'simpleText';

    matcher = new ValueErrorStateMatcher();
    customValidators = [];

    // https://ckeditor.com/docs/ckeditor5/latest/builds/guides/integration/frameworks/angular.html
    editor: Editor;
    editorConfig;

    constructor(@Inject(FormBuilder) protected _fb: FormBuilder) {
        super();
    }

    getInitValue(): string | null {
        if (this.displayValue !== undefined) {
            return this.displayValue.text;
        } else {
            return null;
        }
    }

    ngOnInit() {
        super.ngOnInit();

        if (this.guiElement === 'richText') {
            this.editor = Editor;
            this.editorConfig = ckEditor.config;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {

        // resets values and validators in form controls when input displayValue or mode changes
        // at the first call of ngOnChanges, form control elements are not initialized yet
        this.resetFormControl();
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
    }

    getNewValue(): CreateTextValueAsString | false {
        if (this.mode !== 'create' || !this.form.valid || this.isEmptyVal()) {
            return false;
        }

        const newTextValue = new CreateTextValueAsString();

        newTextValue.text = this.valueFormControl.value;

        if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
            newTextValue.valueHasComment = this.commentFormControl.value;
        }

        return newTextValue;

    }

    getUpdatedValue(): UpdateTextValueAsString | false {

        if (this.mode !== 'update' || !this.form.valid) {
            return false;
        }

        const updatedTextValue = new UpdateTextValueAsString();

        updatedTextValue.id = this.displayValue.id;

        updatedTextValue.text = this.valueFormControl.value;

        if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
            updatedTextValue.valueHasComment = this.commentFormControl.value;
        }

        return updatedTextValue;
    }

}
