import { GlobalSearchComponent } from './lib/header/global-search.component';
import { HeaderLogoComponent } from './lib/header/header-logo.component';
import { HeaderUserActionsComponent } from './lib/header/header-user-actions.component';
import { HeaderComponent } from './lib/header/header.component';
import { LoginFormComponent } from './lib/header/login-form/login-form.component';
import { PasswordConfirmFormComponent } from './lib/header/password-form/password-confirm-form.component';
import { PasswordFormFieldComponent } from './lib/header/password-form/password-form-field.component';
import { SearchTipsComponent } from './lib/header/search-tips.component';
import { UserMenuComponent } from './lib/header/user-menu/user-menu.component';
import { VersionBadgeComponent } from './lib/header/version-badge.component';
import { SplitPipe } from './lib/split.pipe';
import { StatusComponent } from './lib/status/status.component';
import { UserFormComponent } from './lib/user-form/user-form.component';

export const CommonToMoveComponents = [
  SplitPipe,
  HeaderComponent,
  StatusComponent,
  HeaderUserActionsComponent,
  UserMenuComponent,
  LoginFormComponent,
  PasswordFormFieldComponent,
  PasswordConfirmFormComponent,
  HeaderLogoComponent,
  VersionBadgeComponent,
  GlobalSearchComponent,
  SearchTipsComponent,
  UserFormComponent,
];
