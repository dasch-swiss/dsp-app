import { Component, Input } from '@angular/core';
import { IOrganisation } from '../dataset-metadata';

@Component({
    selector: 'app-organisation-template',
    template: `
        <div>
            <div>
                <h4 class="metadata-title">Organisation: </h4>
                {{ organisation.name }}
            </div>

            <div *ngIf="organisation.url">
                <h4>URL:</h4>
                <a href="{{ organisation.url }}" target="_blank"> {{ organisation.url }} </a>
            </div>

            <div *ngIf="organisation.email" class="email">
                <h4>Email:</h4>
                <a href="mailto:{{ organisation.email }}"> {{ organisation.email }} </a>
            </div>

            <app-address-template *ngIf="organisation.address" [address]="organisation.address"></app-address-template>
        </div>
    `,
    styles: ['.metadata-title { font-size: 95%; }']
})

export class OrganisationTemplateComponent {
    // input parameter
    @Input() organisation: IOrganisation;
}
