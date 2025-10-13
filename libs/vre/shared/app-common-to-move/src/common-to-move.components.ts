import { DialogHeaderComponent } from './lib/dialog-header.component';
import { GlobalSearchComponent } from './lib/header/global-search.component';
import { HeaderLogoComponent } from './lib/header/header-logo.component';
import { HeaderUserActionsComponent } from './lib/header/header-user-actions.component';
import { HeaderComponent } from './lib/header/header.component';
import { ProjectNavigationTabsComponent } from './lib/header/project-navigation-tabs.component';
import { VersionBadgeComponent } from './lib/header/version-badge.component';
import { SplitPipe } from './lib/split.pipe';
import { StatusComponent } from './lib/status/status.component';

export const CommonToMoveComponents = [
  DialogHeaderComponent,
  SplitPipe,
  HeaderComponent,
  StatusComponent,
  ProjectNavigationTabsComponent,
  HeaderUserActionsComponent,
  HeaderLogoComponent,
  VersionBadgeComponent,
  GlobalSearchComponent,
];
