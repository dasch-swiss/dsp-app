import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cookie-policy',
  templateUrl: './cookie-policy.component.html',
  styleUrls: ['./cookie-policy.component.scss'],
  imports: [TranslateModule, MatDivider, MatIcon, MatButton],
})
export class CookiePolicyComponent {
  constructor(private readonly _location: Location) {}

  goBack() {
    this._location.back();
  }
}
