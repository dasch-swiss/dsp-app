import { Component, Input } from '@angular/core';
import { ReadLinkValue } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-standoff-link-value',
  template: `
    <div *ngFor="let link of standoffLinks; let last = last">
      <a style="display: block; margin-bottom: 4px" [routerLink]="getLink(link.linkedResourceIri)" target="_blank">
        <span>{{ link.linkedResource.resourceClassLabel }}</span
        >:
        <strong>{{ link.strval }}</strong>
      </a>
    </div>
  `,
})
export class StandoffLinkValueComponent {
  @Input({ required: true }) standoffLinks!: ReadLinkValue[];

  getLink(linkIri: string) {
    return `/resource/${linkIri.match(/[^\/]*\/[^\/]*$/)[0]}`;
  }
}
