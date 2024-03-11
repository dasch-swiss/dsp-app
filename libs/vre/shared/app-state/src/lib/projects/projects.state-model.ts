import { ProjectRestrictedViewSettings, ReadGroup, ReadProject, ReadUser } from '@dasch-swiss/dsp-js';
import { RestrictedViewResponse } from '@dasch-swiss/vre/open-api';
import { IKeyValuePair, IKeyValuePairs } from '../model-interfaces';

export class ProjectsStateModel {
  isLoading = false;
  isMembershipLoading = false;
  hasLoadingErrors = false;
  allProjects: ReadProject[] = [];
  projectMembers: IKeyValuePairs<ReadUser> = {};
  projectGroups: IKeyValuePairs<ReadGroup> = {};
  projectRestrictedViewSettings: IKeyValuePair<ProjectRestrictedViewSettings | RestrictedViewResponse> = {};
}
