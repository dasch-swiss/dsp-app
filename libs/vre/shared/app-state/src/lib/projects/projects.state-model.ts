import { ReadGroup, ReadProject, ReadUser } from '@dasch-swiss/dsp-js';
import { IKeyValuePairs } from '../model-interfaces';

export class ProjectsStateModel {
  isLoading = false;
  hasLoadingErrors = false;
  allProjects: ReadProject[] = [];
  readProjects: ReadProject[] = [];
  projectMembers: IKeyValuePairs<ReadUser> = {};
  projectGroups: IKeyValuePairs<ReadGroup> = {};
}
