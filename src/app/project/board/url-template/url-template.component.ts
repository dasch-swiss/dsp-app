import { Component, Input, OnInit } from '@angular/core';
import { IUrl } from '@dasch-swiss/dsp-js';

@Component({
    selector: 'app-url-template',
    template: `
        <div *ngIf="urls">
            <div *ngIf="templateType === 'string'">
                <p *ngFor="let str of urls" class="remove-top-margin"> {{ str }} </p>
            </div>
            <div *ngIf="templateType === 'IUrl'">
                <div class="metadata-property">
                    <div *ngIf="displayLabel" class="property-label display-inline-block">
                        {{ label }}:
                    </div>
                    <div [ngClass]="{'display-inline-block add-left-margin': displayLabel}">
                        <span *ngFor="let entry of urls" class="comma">
                            <a *ngIf="entry.name" href="{{ entry.url }}" target="_blank"> {{ entry.name }} </a>
                            <a *ngIf="!entry.name" href="{{ entry.url }}" target="_blank"> {{ entry.url }} </a>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class UrlTemplateComponent implements OnInit {
    @Input() urls: IUrl | IUrl[] | string[];

    @Input() label = 'URL(s)';

    @Input() displayLabel = false;

    templateType: string;

    ngOnInit() {
        if (!(this.urls instanceof Array)) {
            this.urls = [this.urls];
        }

        this.templateType = this.getTemplateType(this.urls[0]);
    }

    /**
     * determine if the object is of type string or IUrl
     * @param obj string | IUrl
     */
    getTemplateType (obj: IUrl | string): string {
        if (typeof obj === 'string') {
            return 'string';
        }
        return 'IUrl';
    }
}
