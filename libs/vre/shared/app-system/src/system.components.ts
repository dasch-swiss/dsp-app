import { CookiePolicyComponent } from './lib/cookie-policy/cookie-policy.component';
import { EraseProjectDialogComponent } from './lib/projects/projects-list/erase-project-dialog/erase-project-dialog.component';
import { ProjectsListComponent } from './lib/projects/projects-list/projects-list.component';
import { ProjectsComponent } from './lib/projects/projects.component';
import { SortButtonComponent } from './lib/sort-button/sort-button.component';
import { SystemComponent } from './lib/system.component';
import { EditPasswordDialogComponent } from './lib/users/edit-password-dialog.component';
import { UsersListComponent } from './lib/users/users-list/users-list.component';
import { UsersComponent } from './lib/users/users.component';

export const SystemComponents = [
  SystemComponent,
  ProjectsComponent,
  ProjectsListComponent,
  EraseProjectDialogComponent,
  UsersComponent,
  UsersListComponent,
  SortButtonComponent,
  CookiePolicyComponent,
  EditPasswordDialogComponent,
];
