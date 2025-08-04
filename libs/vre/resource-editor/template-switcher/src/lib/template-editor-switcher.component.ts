import { AfterViewInit, Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
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
  selector: 'app-template-editor-switcher',
  template: `
    <ng-template #intEditorTpl let-item="item">
      <mat-form-field style="width: 100%">
        <input matInput [formControl]="item" type="number" data-cy="int-input" />
        <mat-error *ngIf="item.errors as errors">
          {{ errors | humanReadableError }}
        </mat-error>
      </mat-form-field>
    </ng-template>

    <ng-template #decimalEditorTpl let-item="item">
      <mat-form-field style="width: 100%">
        <input matInput [formControl]="item" type="number" step="0.05" placeholder="e.g. 8.05" />
      </mat-form-field>
      <mat-error *ngIf="item.touched && item.errors as errors">
        {{ errors | humanReadableError }}
      </mat-error>
    </ng-template>

    <ng-template #booleanEditorTpl let-item="item">
      <app-boolean-value [control]="item" />
    </ng-template>

    <ng-template #listEditorTpl let-item="item">
      <app-list-value [control]="item" [propertyDef]="propertyDefinition" />
    </ng-template>

    <ng-template #colorEditorTpl let-control="item">
      <app-color-value [control]="control" />
    </ng-template>

    <ng-template #richTextEditorTpl let-item="item">
      <app-ck-editor [control]="item" />
    </ng-template>

    <ng-template #textEditorTpl let-item="item">
      <app-common-input
        [control]="item"
        [withLabel]="false"
        style="width: 100%"
        data-cy="text-input"
        label="Text value" />
    </ng-template>

    <ng-template #textHtmlEditorTpl>This value cannot be edited.</ng-template>

    <ng-template #paragraphEditorTpl let-item="item">
      <mat-form-field style="width: 100%">
        <textarea matInput [formControl]="item" rows="9" placeholder="Text value"></textarea>
      </mat-form-field>
      <mat-error *ngIf="item.touched && item.errors as errors">
        {{ errors | humanReadableError }}
      </mat-error>
    </ng-template>

    <ng-template #dateEditorTpl let-control="item">
      <app-date-value-handler [formControl]="control" />
      <mat-error *ngIf="control.touched && control.errors as errors">{{ errors | humanReadableError }}</mat-error>
    </ng-template>

    <ng-template #timeEditorTpl let-item="item">
      <app-time-value [control]="item" />
    </ng-template>

    <ng-template #intervalEditorTpl let-item="item">
      <app-interval-value [control]="item" />
    </ng-template>

    <ng-template #geoNameEditorTpl let-item="item">
      <app-geoname-value [control]="item" />
    </ng-template>

    <ng-template #linkEditorTpl let-item="item">
      <app-link-value
        [control]="item"
        [defaultValue]="value"
        [propIri]="myPropertyDefinition.id"
        [resourceClassIri]="resourceClassIri" />
    </ng-template>

    <ng-template #uriEditorTpl let-item="item">
      <app-common-input
        [control]="item"
        [withLabel]="false"
        label="External link"
        [validatorErrors]="[{ errorKey: 'pattern', message: 'This is not a valid link.' }]" />
    </ng-template>
  `,
})
export class TemplateEditorSwitcherComponent implements AfterViewInit {
  @Input({ required: true }) myPropertyDefinition!: PropertyDefinition;
  @Input({ required: true }) resourceClassIri!: string;
  @Input() value?: ReadValue;
  @Output() templateFound = new EventEmitter<TemplateRef<any>>();

  @ViewChild('intEditorTpl') intEditorTpl!: TemplateRef<any>;
  @ViewChild('decimalEditorTpl') decimalEditorTpl!: TemplateRef<any>;
  @ViewChild('booleanEditorTpl') booleanEditorTpl!: TemplateRef<any>;
  @ViewChild('colorEditorTpl') colorEditorTpl!: TemplateRef<any>;
  @ViewChild('textEditorTpl') textEditorTpl!: TemplateRef<any>;
  @ViewChild('textHtmlEditorTpl') textHtmlEditorTpl!: TemplateRef<any>;
  @ViewChild('paragraphEditorTpl') paragraphEditorTpl!: TemplateRef<any>;
  @ViewChild('richTextEditorTpl') richTextEditorTpl!: TemplateRef<any>;
  @ViewChild('dateEditorTpl') dateEditorTpl!: TemplateRef<any>;
  @ViewChild('timeEditorTpl') timeEditorTpl!: TemplateRef<any>;
  @ViewChild('intervalEditorTpl') intervalEditorTpl!: TemplateRef<any>;
  @ViewChild('listEditorTpl') listEditorTpl!: TemplateRef<any>;
  @ViewChild('geoNameEditorTpl') geoNameEditorTpl!: TemplateRef<any>;
  @ViewChild('linkEditorTpl') linkEditorTpl!: TemplateRef<any>;
  @ViewChild('uriEditorTpl') uriEditorTpl!: TemplateRef<any>;

  get propertyDefinition() {
    return JsLibPotentialError.setAs(this.myPropertyDefinition);
  }

  ngAfterViewInit() {
    this.templateFound.emit(this._getEditorTemplate());
  }

  private _getEditorTemplate(): TemplateRef<any> {
    switch (this.propertyDefinition.objectType) {
      case Constants.IntValue:
        return this.intEditorTpl;
      case Constants.DecimalValue:
        return this.decimalEditorTpl;
      case Constants.BooleanValue:
        return this.booleanEditorTpl;
      case Constants.ColorValue:
        return this.colorEditorTpl;
      case Constants.TextValue:
        return this._manageTextEditorValue();
      case Constants.DateValue:
        return this.dateEditorTpl;
      case Constants.TimeValue:
        return this.timeEditorTpl;
      case Constants.IntervalValue:
        return this.intervalEditorTpl;
      case Constants.ListValue:
        return this.listEditorTpl;
      case Constants.GeonameValue:
        return this.geoNameEditorTpl;
      case Constants.LinkValue:
        return this.linkEditorTpl;
      case Constants.UriValue:
        return this.uriEditorTpl;
      default: {
        throw Error(`Unrecognized property ${this.propertyDefinition.objectType}`);
      }
    }
  }

  private _manageTextEditorValue() {
    if (this.value === undefined) {
      return this._defaultTextEditorBehavior();
    }

    const value = this.value as ReadTextValueAsString | ReadTextValueAsXml | ReadTextValueAsHtml;

    if (value instanceof ReadTextValueAsString) {
      return this._defaultTextEditorBehavior();
    }

    if (value instanceof ReadTextValueAsXml && value.mapping === Constants.StandardMapping) {
      return this.richTextEditorTpl;
    }

    if (value instanceof ReadTextValueAsHtml) {
      return this.textHtmlEditorTpl;
    }

    throw new Error('The text value is not supported');
  }

  private _defaultTextEditorBehavior() {
    switch (this.propertyDefinition.guiElement) {
      case Constants.GuiRichText:
        return this.richTextEditorTpl;
      case Constants.GuiTextarea:
        return this.paragraphEditorTpl;
      default:
        return this.textEditorTpl;
    }
  }
}
