import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { StringLiteral } from '@dasch-swiss/dsp-js';
import { SessionService } from '../../services/session.service';

@Component({
    selector: 'app-string-literal-input',
    templateUrl: './string-literal-input.component.html',
    styleUrls: ['./string-literal-input.component.scss']
})
export class StringLiteralInputComponent implements OnInit, OnChanges {

    /**
     * optional placeholder for the input field e.g. Label
     *
     * @param  {string} [placeholder='Label']
     */
    @Input() placeholder = 'Label';

    /**
     * optional predefined (selected) language: en, de, it, fr, etc.
     *
     * @param  {string} language
     */
    @Input() language: string;

    /**
     * optional form field input type: textarea? set to true for textarea
     * otherwise it's a simple (short) input field
     *
     * @param  {boolean} [textarea=false]
     */
    @Input() textarea: boolean;

    /**
     * optional form field value of type StringLiteral[]
     *
     * @param {StringLiteral[]} value
     */
    @Input() value: StringLiteral[] = [];

    /**
     * optional disable the input field in case of no right to edit the field/value
     *
     * @param {boolean}: [disabled=false]
     */
    @Input() disabled: boolean;

    /**
     * the readonly attribute specifies whether the control may be modified by the user.
     *
     * @param {boolean}: [readonly=false]
     */
    @Input() readonly: boolean;

    /**
     * returns (output) an array of StringLiteral on any change on the input field.
     *
     * @emits {StringLiteral[]} dataChanged
     */
    @Output() dataChanged: EventEmitter<StringLiteral[]> = new EventEmitter<StringLiteral[]>();

    /**
     * returns (output) true when the field was touched. This can be used to validate data, e.g. in case a value is required
     *
     * @emits {boolean} touched
     */
    @Output() touched: EventEmitter<boolean> = new EventEmitter<boolean>();

    /**
     * returns true when a user press ENTER. This can be used to submit data in the parent component.
     *
     * * @emits {boolean} enter
     */
    @Output() enter: EventEmitter<boolean> = new EventEmitter<boolean>();

    /**
     * returns true when the field is focused. Use similarly to touched for data validation.
     *
     * @emits {boolean} focus
     */
    @Output() focus: EventEmitter<boolean> = new EventEmitter<boolean>();

    @ViewChild('textInput', { static: false }) textInput: ElementRef;

    @ViewChild('btnToSelectLanguage', { static: false }) btnToSelectLanguage: MatMenuTrigger;

    form: UntypedFormGroup;
    languages: string[] = ['de', 'fr', 'it', 'en', 'rm'];

    constructor(private _fb: UntypedFormBuilder,
        private _sessionService: SessionService) {

        // set selected language, if it's not defined yet
        if (!this.language) {
            if (this._sessionService.getSession() !== null) {
                // get language from the logged-in user profile data
                this.language = this._sessionService.getSession().user.lang;
            } else {
                // get default language from browser
                this.language = navigator.language.substring(0, 2);
            }
        }

        // does the defined language exists in our supported languages list?
        if (this.languages.indexOf(this.language) === -1) {
            // if not, select the first language from our list of supported languages
            this.language = this.languages[0];
        }

    }

    ngOnInit() {

        // reset stringLiterals if they have empty values
        this.resetValues();

        // build the form
        this.form = this._fb.group({
            text: new UntypedFormControl(
                {
                    value: '',
                    disabled: this.disabled // https://stackoverflow.com/a/47521965
                }
            )
        });
        // update values on form change
        this.form.valueChanges.subscribe(data => this.onValueChanged());

        // get value from stringLiterals
        const val = this.getValueFromStringLiteral(this.language);
        this.updateFormField(val);
    }

    ngOnChanges() {
        // get value from stringLiterals
        const val = this.getValueFromStringLiteral(this.language);
        this.updateFormField(val);
    }

    /**
     * emit data to parent on any change on the input field
     */
    onValueChanged() {
        if (!this.form) {
            return;
        }

        const form = this.form;
        const control = form.get('text');
        this.touched.emit(control.dirty || control.touched);

        this.updateStringLiterals(this.language, this.form.controls.text.value);

        this.dataChanged.emit(this.value);

    }

    toggleAll() {
        // tODO: open/show all languages with their values
    }

    /**
     * set the language after selecting;
     * this updates the array of StringLiterals: adds item with the selected language if it doesn't exist
     */
    setLanguage(lang: string) {

        if (this.language !== lang) {
            // clean stringLIteral value for previous language, if text field is empty
            this.updateStringLiterals(this.language, this.form.controls.text.value);

            this.language = lang;
            // update form field value / reset in case of no value
            const val = this.getValueFromStringLiteral(lang);
            this.updateFormField(val);
        }
    }

    /**
     * switch focus to input field after selecting a language
     */
    switchFocus() {
        // close the menu
        if (!this.textarea && this.btnToSelectLanguage && this.btnToSelectLanguage.menuOpen) {
            this.btnToSelectLanguage.closeMenu();
        }

        if (!this.disabled) {
            this.form.controls.text.enable();
            this.textInput.nativeElement.focus();
        }
    }

    /**
     * switch focus to input field after closing the menu by clicking anywhere outside of it
     */
    menuClosed() {
        if (!this.disabled) {
            this.form.controls.text.enable();
            this.textInput.nativeElement.focus();
        }
    }

    /**
     * set the value in the input field
     */
    updateFormField(value: string) {
        if (!value) {
            value = '';
        }
        if (!this.form) {
            return;
        }
        this.form.controls.text.setValue(value);
    }

    /**
     * update the array of StringLiterals depending on value / empty value add or remove item from array.
     */
    updateStringLiterals(lang: string, value?: string) {
        const index = this.value.findIndex(i => i.language === lang);

        if (index > -1 && this.value[index].value.length > 0) {
            // value is not empty and exists in list of stringLiterals
            this.value[index].value = value;
        }

        if ((!value || value.length === 0) && index > -1) {
            // value is empty: delete stringLiteral item for this language
            this.value.splice(index, 1);
        }

        if (index < 0 && value) {
            // value doesn't exist in stringLiterals: add one
            const newValue: StringLiteral = {
                value: value,
                language: lang
            };
            this.value.push(newValue);
        }

    }

    /**
     * in case of strange array of StringLiterals, this method will reset to a API-conform array. This means an array without empty values.
     */
    resetValues() {
        const length: number = this.value.length;

        if (length > 0) {
            let index = length - 1;
            while (index >= 0) {
                // remove items with empty value
                if (!this.value[index].value.length) {
                    this.value.splice(index, 1);
                }
                index--;
            }

            // does an item for selected lanuage exists
            if (this.value.findIndex(i => i.language === this.language) === -1) {
                this.language = this.value[0].language;
            }

        } else {
            this.value = [];
        }
    }

    /**
     * get the value from array of StringLiterals for the selected language
     */
    getValueFromStringLiteral(lang: string): string {
        // get index for this language
        const index = this.value.findIndex(i => i.language === lang);

        if (this.value[index] && this.value[index].value.length > 0) {
            return this.value[index].value;
        } else {
            return undefined;
        }

    }

}
