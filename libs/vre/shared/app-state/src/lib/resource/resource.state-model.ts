import { ReadProject, ReadUser } from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { IKeyValuePairs } from '../model-interfaces';

export class ReourceStateModel {
  isLoading = false;
  attachedUsers: IKeyValuePairs<ReadUser> = {};
  attachedProjects: IKeyValuePairs<ReadProject> = {};
  resource: DspResource | null = null;
}
