import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { AuthService, UserService } from '@dasch-swiss/vre/core/session';
import { AdminImageDirective } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule } from '@ngx-translate/core';
import { LoginFormComponent } from '../login-form/login-form.component';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  standalone: true,
  imports: [
    AdminImageDirective,
    AsyncPipe,
    LoginFormComponent,
    MatButton,
    MatDivider,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    RouterLink,
    TranslateModule,
  ],
})
export class UserMenuComponent {
  readonly MY_PROFILE = RouteConstants.myProfile;

  isLoggedIn$ = this._userService.isLoggedIn$;

  readonly systemLink = RouteConstants.system;
  user$ = this._userService.user$;
  isSysAdmin$ = this._userService.isSysAdmin$;

  constructor(
    private readonly _authService: AuthService,
    private readonly _userService: UserService
  ) {}

  logout() {
    this._authService.logout();
  }
}
