import { Component, Input, OnChanges, Optional, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReadLinkValue } from '@dasch-swiss/dsp-js';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { Subscription } from 'rxjs';
import { FootnoteService } from '../footnote.service';
import { IsSwitchComponent } from './is-switch-component.interface';

@Component({
  selector: 'app-rich-text-switch',
  template: ` <div
      *ngIf="displayMode; else editMode"
      data-cy="rich-text-switch"
      [innerHTML]="sanitizedHtml"
      appFootnote
      appHtmlLink
      (internalLinkClicked)="openResource($event)"></div>
    <ng-template #editMode>
      <app-ck-editor [control]="myControl" />
    </ng-template>`,
  styles: [
    `
      :host ::ng-deep footnote {
        font-size: 0.8em;
        vertical-align: super;
        visibility: visible;
        position: relative;
        top: -6px;
        left: 2px;
        color: #336790;
        cursor: pointer;
        display: inline-block;
        padding: 0 2px;
      }
    `,
  ],
})
export class RichTextSwitchComponent implements IsSwitchComponent, OnChanges {
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input() displayMode = true;

  sanitizedHtml!: SafeHtml;
  subscription?: Subscription;

  private readonly _footnoteRegExp = /<footnote content="([^>]+)">([^<]*)<\/footnote>/g;

  get myControl() {
    return this.control as FormControl<string>;
  }

  constructor(
    private _resourceService: ResourceService,
    private _sanitizer: DomSanitizer,
    @Optional() private _footnoteService: FootnoteService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    // does nothing if only displayMode changes
    if (!changes['control'] && changes['displayMode'].currentValue === !changes['displayMode'].previousValue) {
      return;
    }

    if (this.control.value === null) {
      this.sanitizedHtml = this._sanitizer.bypassSecurityTrustHtml('');
      return;
    }

    if (!this._containsFootnote(this.control.value)) {
      this.sanitizedHtml = this._sanitizer.bypassSecurityTrustHtml(this.control.value);
      return;
    }

    this._parseFootnotes(this.control.value);
  }

  openResource(linkValue: ReadLinkValue | string) {
    const iri = typeof linkValue == 'string' ? linkValue : linkValue.linkedResourceIri;
    const path = this._resourceService.getResourcePath(iri);
    window.open(`/resource${path}`, '_blank');
  }

  private _containsFootnote(text: string) {
    return text.match(this._footnoteRegExp) !== null;
  }

  private _parseFootnotes(controlValue: string) {
    const matches = controlValue.matchAll(this._footnoteRegExp);
    let newValue = controlValue;
    if (matches) {
      Array.from(matches).forEach(matchArray => {
        const uuid = window.crypto.getRandomValues(new Uint32Array(1))[0].toString();
        const parsedFootnote = `<footnote content="${matchArray[1]}" id="${uuid}">${this._footnoteService.footnotes.length + 1}</footnote>`;
        newValue = newValue.replace(matchArray[0], parsedFootnote);
        this._footnoteService.addFootnote(
          uuid,
          this._sanitizer.bypassSecurityTrustHtml(this._unescapeHtml(this._unescapeHtml(matchArray[1])))
        );
      });
    }
    this.sanitizedHtml = this._sanitizer.bypassSecurityTrustHtml(this._unescapeHtml(newValue));
  }

  private _unescapeHtml(str: string) {
    const unescapeMap = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'",
    };
    return str.replace(/&(amp|lt|gt|quot|#039);/g, match => unescapeMap[match]);
  }
}
