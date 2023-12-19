/* eslint-disable @typescript-eslint/naming-convention */
import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  Constants,
  CreateTextValueAsXml,
  ReadTextValueAsXml,
  UpdateTextValueAsXml,
} from '@dasch-swiss/dsp-js';
import { BaseValueDirective } from '@dsp-app/src/app/main/directive/base-value.directive';
import * as Editor from 'ckeditor5-custom-build';
import { ValueErrorStateMatcher } from '../../value-error-state-matcher';
import { ckEditor } from '../ck-editor';

@Component({
  selector: 'app-text-value-as-xml',
  templateUrl: './text-value-as-xml.component.html',
  styleUrls: ['./text-value-as-xml.component.scss'],
})
export class TextValueAsXMLComponent
  extends BaseValueDirective
  implements OnInit, OnChanges, OnDestroy
{
  @Input() displayValue?: ReadTextValueAsXml;

  @Output() internalLinkClicked: EventEmitter<string> =
    new EventEmitter<string>();

  @Output() internalLinkHovered: EventEmitter<string> =
    new EventEmitter<string>();

  readonly standardMapping = Constants.StandardMapping; // todo: define this somewhere else

  matcher = new ValueErrorStateMatcher();
  customValidators = [];

  // https://ckeditor.com/docs/ckeditor5/latest/builds/guides/integration/frameworks/angular.html
  editor: Editor;
  editorConfig;

  // xML conversion
  xmlTransform = {
    '<hr>': '<hr/>',
    '<s>': '<strike>',
    '</s>': '</strike>',
    '<i>': '<em>',
    '</i>': '</em>',
    '<figure class="table">': '',
    '</figure>': '',
    '<br>': '<br/>',
  };

  constructor(@Inject(FormBuilder) protected _fb: FormBuilder) {
    super();
  }

  standardValueComparisonFunc(initValue: any, curValue: any): boolean {
    const initValueTrimmed =
      typeof initValue === 'string' ? initValue.trim() : initValue;
    const curValueTrimmed =
      typeof curValue === 'string' ? curValue.trim() : curValue;

    return initValueTrimmed === this._handleXML(curValueTrimmed, false, false);
  }

  getInitValue(): string | null {
    // check for standard mapping
    if (
      this.displayValue !== undefined &&
      this.displayValue.mapping === this.standardMapping
    ) {
      return this._handleXML(this.displayValue.xml, true);
    } else {
      return null;
    }
  }

  ngOnInit() {
    this.editor = Editor;
    this.editorConfig = ckEditor.config;

    super.ngOnInit();
  }

  ngOnChanges(): void {
    // resets values and validators in form controls when input displayValue or mode changes
    // at the first call of ngOnChanges, form control elements are not initialized yet
    this.resetFormControl();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  getNewValue(): CreateTextValueAsXml | false {
    if (this.mode !== 'create' || !this.form.valid || this.isEmptyVal()) {
      return false;
    }

    const newTextValue = new CreateTextValueAsXml();

    newTextValue.xml = this._handleXML(this.valueFormControl.value, false);
    newTextValue.mapping = this.standardMapping;

    if (
      this.commentFormControl.value !== null &&
      this.commentFormControl.value !== ''
    ) {
      newTextValue.valueHasComment = this.commentFormControl.value;
    }

    return newTextValue;
  }

  getUpdatedValue(): UpdateTextValueAsXml | false {
    if (this.mode !== 'update' || !this.form.valid) {
      return false;
    }

    const updatedTextValue = new UpdateTextValueAsXml();

    updatedTextValue.id = this.displayValue.id;

    updatedTextValue.xml = this._handleXML(this.valueFormControl.value, false);
    updatedTextValue.mapping = this.standardMapping;

    if (
      this.commentFormControl.value !== null &&
      this.commentFormControl.value !== ''
    ) {
      updatedTextValue.valueHasComment = this.commentFormControl.value;
    }

    return updatedTextValue;
  }

  /**
   * converts XML to HTML suitable for CKEditor and vice versa.
   *
   * @param xml xml to be processed.
   * @param fromKnora true if xml is received from Knora.
   * @param addXMLDocType whether to add the doctype to the XML.
   */
  private _handleXML(xml: string, fromKnora: boolean, addXMLDocType = true) {
    const doctype = '<?xml version="1.0" encoding="UTF-8"?>';
    const textTag = 'text';
    const openingTextTag = `<${textTag}>`;
    const closingTextTag = `</${textTag}>`;

    // check if xml is a string
    if (typeof xml !== 'string') {
      return xml;
    }

    if (fromKnora) {
      // cKEditor accepts tags from version 4
      // see 4 to 5 migration, see https://ckeditor.com/docs/ckeditor5/latest/builds/guides/migrate.html
      return xml
        .replace(doctype, '')
        .replace(openingTextTag, '')
        .replace(closingTextTag, '');
    } else {
      // replace &nbsp; entity
      xml = xml.replace(/&nbsp;/g, String.fromCharCode(160));

      // get XML transform config
      const keys = Object.keys(this.xmlTransform);
      for (const key of keys) {
        // replace tags defined in config
        xml = xml.replace(new RegExp(key, 'g'), this.xmlTransform[key]);
      }

      if (addXMLDocType) {
        return doctype + openingTextTag + xml + closingTextTag;
      } else {
        return xml;
      }
    }
  }
}
