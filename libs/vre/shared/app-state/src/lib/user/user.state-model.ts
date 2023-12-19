import { ReadUser, User } from '@dasch-swiss/dsp-js';

export class UserStateModel {
  isLoading: boolean | undefined;
  user: User | ReadUser | null | undefined;
  userProjectAdminGroups: string[] = []; // before was projectAdmin
  isMemberOfSystemAdminGroup = false; // before was sysAdmin
  allUsers: ReadUser[] = [];
}
