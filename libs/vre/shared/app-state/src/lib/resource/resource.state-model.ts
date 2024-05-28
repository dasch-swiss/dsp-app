import { ReadProject, ReadUser } from '@dasch-swiss/dsp-js';
import { IKeyValuePairs } from '../model-interfaces';

export class ReourceStateModel {
  isLoading = false;
  attachedUsers: IKeyValuePairs<ReadUser> = {};
  attachedProjects: IKeyValuePairs<ReadProject> = {};
}
