import { Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { CreateTextValueAsString, ReadTextValueAsString, UpdateTextValueAsString } from '@dasch-swiss/dsp-js';
import * as Editor from 'ckeditor5-custom-build';
import { Subscription } from 'rxjs';
import { BaseValueDirective } from 'src/app/main/directive/base-value.directive';
import { ValueErrorStateMatcher } from '../../value-error-state-matcher';
import { ckEditor } from '../ck-editor';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-text-value-as-string',
    templateUrl: './text-value-as-string.component.html',
    styleUrls: ['./text-value-as-string.component.scss']
})
export class TextValueAsStringComponent extends BaseValueDirective implements OnInit, OnChanges, OnDestroy {

    @Input() displayValue?: ReadTextValueAsString;
    @Input() textArea?: boolean = false;

    @Input() guiElement: 'simpleText' | 'textArea' | 'richText' = 'simpleText';

    valueFormControl: UntypedFormControl;
    commentFormControl: UntypedFormControl;

    form: UntypedFormGroup;

    valueChangesSubscription: Subscription;
    matcher = new ValueErrorStateMatcher();
    customValidators = [];

    // https://ckeditor.com/docs/ckeditor5/latest/builds/guides/integration/frameworks/angular.html
    editor: Editor;
    editorConfig;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {
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

        // initialize form control elements
        this.valueFormControl = new UntypedFormControl(null);

        this.commentFormControl = new UntypedFormControl(null);

        this.valueChangesSubscription = this.commentFormControl.valueChanges.subscribe(
            data => {
                this.valueFormControl.updateValueAndValidity();
            }
        );

        this.form = this._fb.group({
            value: this.valueFormControl,
            comment: this.commentFormControl
        });

        if (this.guiElement === 'richText') {
            this.editor = Editor;
            this.editorConfig = ckEditor.config;
        }

        this.resetFormControl();

        resolvedPromise.then(() => {
            // add form to the parent form group
            this.addToParentFormGroup(this.formName, this.form);
        });
    }

    ngOnChanges(changes: SimpleChanges): void {

        // resets values and validators in form controls when input displayValue or mode changes
        // at the first call of ngOnChanges, form control elements are not initialized yet
        this.resetFormControl();
    }

    ngOnDestroy(): void {
        this.unsubscribeFromValueChanges();

        resolvedPromise.then(() => {
            // remove form from the parent form group
            this.removeFromParentFormGroup(this.formName);
        });
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
