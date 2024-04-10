import { ReadProject, ReadUser } from '@dasch-swiss/dsp-js';
import { IKeyValuePairs } from '../model-interfaces';

export class ReourceStateModel {
  showAllProps = false;
  showAllComments = false;
  isLoading = false;
  attachedUsers: IKeyValuePairs<ReadUser> = {};
  attachedProjects: IKeyValuePairs<ReadProject> = {};
}
