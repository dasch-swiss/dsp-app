import { Component, Input } from '@angular/core';
import { Address } from '@dasch-swiss/dsp-js';

@Component({
    selector: 'app-address-template',
    template: `
        <div class='metadata-property'>
            <div class='property-label display-inline-block'>
                Address:
            </div>
            <div class='display-inline-block add-left-margin'>
                <span>{{ address.streetAddress }}, {{ address.postalCode }} {{ address.addressLocality }}</span>
            </div>
        </div>
    `
})
export class AddressTemplateComponent {
    @Input() address: Address;
}
