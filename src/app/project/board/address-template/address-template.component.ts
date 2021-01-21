import { Component, Input } from '@angular/core';
import { IAddress } from '../dataset-metadata';

@Component({
    selector: 'app-address-template',
    template: `
        <div class="sub-details">
            <h4>Address:</h4>
            <address class="contents">
                <p>{{ address.streetAddress }}</p>
                <span class="postcode">{{ address.postalCode }}</span>
                <span>{{ address.addressLocality }}</span>
            </address>
        </div>
    `,
    styles: ['.postcode { margin-right: 6px; }']
})
export class AddressTemplateComponent {
    @Input() address: IAddress;
}
