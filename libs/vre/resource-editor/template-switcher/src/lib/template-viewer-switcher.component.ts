import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  Constants,
  PropertyDefinition,
  ReadTextValueAsHtml,
  ReadTextValueAsString,
  ReadTextValueAsXml,
  ReadValue,
} from '@dasch-swiss/dsp-js';
import { JsLibPotentialError } from '@dasch-swiss/vre/resource-editor/resource-properties';

@Component({
  selector: 'app-template-viewer-switcher',
  template: `
    <ng-template #textDisplayTpl let-item="item">
      <span>{{ item.text }}</span>
    </ng-template>

    <ng-template #paragraphDisplayTpl let-item="item">
      <app-paragraph-viewer [value]="item" />
    </ng-template>

    <ng-template #intDisplayTpl let-item="item">
      <span>{{ item.strval }}</span>
    </ng-template>

    <ng-template #booleanDisplayTpl let-item="item">
      <mat-slide-toggle [checked]="item.bool" [disabled]="true" />
    </ng-template>

    <ng-template #intervalDisplayTpl let-item="item">
      <app-interval-viewer [value]="item" />
    </ng-template>

    <ng-template #timeDisplayTpl let-item="item">
      <app-time-viewer [value]="item" />
    </ng-template>

    <ng-template #listDisplayTpl let-item="item">
      <app-list-viewer [value]="item" [propertyDef]="propertyDefinition" />
    </ng-template>

    <ng-template #richTextDisplayTpl let-item="item" let-index="index">
      <app-rich-text-viewer [value]="item" [index]="index" />
    </ng-template>

    <ng-template #textHtmlDisplayTpl let-item="item">
      <app-text-html-viewer [value]="item" />
    </ng-template>

    <ng-template #colorDisplayTpl let-item="item">
      <app-color-viewer [value]="item" />
    </ng-template>

    <ng-template #dateDisplayTpl let-item="item">
      <app-date-viewer [value]="item" />
    </ng-template>

    <ng-template #geoNameDisplayTpl let-item="item">
      <app-geoname-viewer [value]="item" />
    </ng-template>

    <ng-template #linkDisplayTpl let-item="item">
      <app-link-viewer [value]="item" />
    </ng-template>

    <ng-template #uriDisplayTpl let-item="item">
      <app-uri-viewer [value]="item" />
    </ng-template>

    <ng-template #defaultDisplayTpl><span style="width: 100%">Nothing to show</span></ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TemplateViewerSwitcherComponent implements AfterViewInit {
  @Input({ required: true }) value!: ReadValue | undefined;
  @Input({ required: true }) myPropertyDefinition!: PropertyDefinition;
  @Output() templateFound = new EventEmitter<TemplateRef<any>>();

  @ViewChild('intDisplayTpl') intDisplayTpl!: TemplateRef<any>;
  @ViewChild('booleanDisplayTpl') booleanDisplayTpl!: TemplateRef<any>;
  @ViewChild('colorDisplayTpl') colorDisplayTpl!: TemplateRef<any>;
  @ViewChild('textHtmlDisplayTpl') textHtmlDisplayTpl!: TemplateRef<any>;
  @ViewChild('richTextDisplayTpl') richTextDisplayTpl!: TemplateRef<any>;
  @ViewChild('dateDisplayTpl') dateDisplayTpl!: TemplateRef<any>;
  @ViewChild('timeDisplayTpl') timeDisplayTpl!: TemplateRef<any>;
  @ViewChild('intervalDisplayTpl') intervalDisplayTpl!: TemplateRef<any>;
  @ViewChild('listDisplayTpl') listDisplayTpl!: TemplateRef<any>;
  @ViewChild('geoNameDisplayTpl') geoNameDisplayTpl!: TemplateRef<any>;
  @ViewChild('linkDisplayTpl') linkDisplayTpl!: TemplateRef<any>;
  @ViewChild('uriDisplayTpl') uriDisplayTpl!: TemplateRef<any>;
  @ViewChild('textDisplayTpl') textDisplayTpl!: TemplateRef<any>;
  @ViewChild('paragraphDisplayTpl') paragraphDisplayTpl!: TemplateRef<any>;

  @ViewChild('defaultDisplayTpl') defaultDisplayTpl!: TemplateRef<any>;

  get propertyDefinition() {
    return JsLibPotentialError.setAs(this.myPropertyDefinition);
  }

  ngAfterViewInit() {
    this.templateFound.emit(this._getDisplayTemplate());
  }

  private _getDisplayTemplate(): TemplateRef<any> {
    switch (this.propertyDefinition.objectType) {
      case Constants.IntValue:
      case Constants.DecimalValue:
        return this.intDisplayTpl;
      case Constants.BooleanValue:
        return this.booleanDisplayTpl;
      case Constants.ColorValue:
        return this.colorDisplayTpl;
      case Constants.TextValue:
        return this._manageTextDisplayValue();
      case Constants.DateValue:
        return this.dateDisplayTpl;
      case Constants.TimeValue:
        return this.timeDisplayTpl;
      case Constants.IntervalValue:
        return this.intervalDisplayTpl;
      case Constants.ListValue:
        return this.listDisplayTpl;
      case Constants.GeonameValue:
        return this.geoNameDisplayTpl;
      case Constants.LinkValue:
        return this.linkDisplayTpl;
      case Constants.UriValue:
        return this.uriDisplayTpl;
      default: {
        throw Error(`Unrecognized property ${this.propertyDefinition.objectType}`);
      }
    }
  }

  private _manageTextDisplayValue() {
    if (this.value === undefined) {
      return this._defaultTextDisplayBehavior();
    }

    const value = this.value as ReadTextValueAsString | ReadTextValueAsXml | ReadTextValueAsHtml;

    if (value instanceof ReadTextValueAsString) {
      return this._defaultTextDisplayBehavior();
    }

    if (value instanceof ReadTextValueAsXml && value.mapping === Constants.StandardMapping) {
      return this.richTextDisplayTpl;
    }

    if (value instanceof ReadTextValueAsHtml) {
      return this.textHtmlDisplayTpl;
    }

    throw new Error('The text value is not supported');
  }

  private _defaultTextDisplayBehavior() {
    switch (this.propertyDefinition.guiElement) {
      case Constants.GuiRichText:
        return this.richTextDisplayTpl;
      case Constants.GuiTextarea:
        return this.paragraphDisplayTpl;
      default:
        return this.textDisplayTpl;
    }
  }
}
