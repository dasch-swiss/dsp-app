import { ReadUser, User } from '@dasch-swiss/dsp-js';

export class UserStateModel {
  isLoading = false;
  user: ReadUser | null = null;
  userProjectAdminGroups: string[] = []; // before was projectAdmin
  isMemberOfSystemAdminGroup = false; // before was sysAdmin
  allUsers: ReadUser[] = [];
  usersLoading = false;
}
