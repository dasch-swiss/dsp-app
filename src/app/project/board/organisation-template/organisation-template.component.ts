import { Component, Input } from '@angular/core';
import { Organization } from '@dasch-swiss/dsp-js';

@Component({
    selector: 'app-organisation-template',
    template: `
        <div class="organization">
            <div class="metadata-property">
                <div class="property-label">
                    <p *ngFor="let name of organisation.name" class="organization-name">
                        {{ organisation.name }}
                    </p>
                </div>
            </div>

            <div *ngIf="organisation.url">
                <app-url-template [urls]="organisation.url" [displayLabel]='true'></app-url-template>
            </div>

            <div *ngIf="organisation.email" class="metadata-property">
                <div class="property-label display-inline-block">
                    Email:
                </div>
                <div class="display-inline-block add-left-margin">
                    <a href="mailto:{{ organisation.email }}"> {{ organisation.email }} </a>
                </div>
            </div>

            <app-address-template *ngIf="organisation.address" [address]="organisation.address"></app-address-template>
        </div>
    `
})

export class OrganisationTemplateComponent {
    // input parameter
    @Input() organisation: Organization;
}
