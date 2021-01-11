import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-address-template',
  template: `
      <div class="sub-details">
          <h4>Address:</h4>
          <address class="contents">
              <p *ngIf="address['streetAddress']">{{ address['streetAddress'] }}</p>
              <span *ngIf="address['postalCode']" style="margin-right: 6px;">{{ address['postalCode'] }}</span>
              <span *ngIf="address['addressLocality']">{{ address['addressLocality'] }}</span>
          </address>
      </div>
  `
})
export class AddressTemplateComponent {
    @Input() address: object;
}
