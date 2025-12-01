import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cookie-policy',
  templateUrl: './cookie-policy.component.html',
  styleUrls: ['./cookie-policy.component.scss'],
  standalone: true,
  imports: [TranslateModule, MatDivider, MatIcon],
})
export class CookiePolicyComponent {
  constructor(private readonly _location: Location) {}

  goBack() {
    this._location.back();
  }
}
