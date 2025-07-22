import { UpdateProjectRequest } from '@dasch-swiss/dsp-js';
import { SetRestrictedViewRequest } from '@dasch-swiss/vre/3rd-party-services/open-api';

export class LoadProjectsAction {
  static readonly type = '[Projects] Load Projects';
}

export class LoadProjectAction {
  static readonly type = '[Projects] Load Project';

  constructor(
    public projectUuid: string,
    public loadMembership = true
  ) {}
}

export class ClearProjectsAction {
  static readonly type = '[Projects] Clear projects';
}

export class UpdateProjectAction {
  static readonly type = '[Projects] Update Project';

  constructor(
    public projectUuid: string,
    public projectData: UpdateProjectRequest
  ) {}
}

export class LoadProjectRestrictedViewSettingsAction {
  static readonly type = '[Projects] Load Project Restricted View Settings';

  constructor(public projectIri: string) {}
}

export class UpdateProjectRestrictedViewSettingsAction {
  static readonly type = '[Projects] Update Project Restricted View Settings';

  constructor(
    public projectUuid: string,
    public setRestrictedViewRequest: SetRestrictedViewRequest
  ) {}
}
