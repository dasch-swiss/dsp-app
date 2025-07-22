import { ProjectRestrictedViewSettings, ReadProject } from '@dasch-swiss/dsp-js';
import { RestrictedViewResponse } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { IKeyValuePair } from '../model-interfaces';

export class ProjectsStateModel {
  isLoading = false;
  allProjects: ReadProject[] = [];
  projectRestrictedViewSettings: IKeyValuePair<ProjectRestrictedViewSettings | RestrictedViewResponse> = {};
}
