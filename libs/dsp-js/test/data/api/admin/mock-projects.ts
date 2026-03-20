import {
  JsonConvert,
  OperationMode,
  PropertyMatchingRule,
  ValueCheckingMode,
} from 'json2typescript';
import { AjaxResponse } from 'rxjs/ajax';
import { ApiResponseData } from '../../../../src/models/api-response-data';
import { ProjectsResponse } from '../../../../src/models/admin/projects-response';
import { ProjectResponse } from '../../../../src/models/admin/project-response';

import projects from './projects/get-projects-response.json';
import project from './projects/get-project-response.json';

// Helper to create a mock AjaxResponse compatible with RxJS 7.x
function createMockAjaxResponse<T extends object>(response: T): AjaxResponse<T> {
  return {
    response,
    status: 200,
    responseType: 'json',
    loaded: 0,
    total: 0,
    request: {
      url: '',
      method: 'GET',
      async: true,
      headers: {},
      timeout: 0,
      crossDomain: false,
      responseType: 'json',
      withCredentials: false,
    },
    originalEvent: {} as ProgressEvent,
    xhr: {} as XMLHttpRequest,
    type: 'download_load',
    responseHeaders: {},
  } as AjaxResponse<T>;
}

export namespace MockProjects {
  const jsonConvert: JsonConvert = new JsonConvert(
    OperationMode.ENABLE,
    ValueCheckingMode.DISALLOW_NULL,
    false,
    PropertyMatchingRule.CASE_STRICT
  );

  export const mockProjects = (): ApiResponseData<ProjectsResponse> => {
    const responseData = ApiResponseData.fromAjaxResponse(
      createMockAjaxResponse({} as object)
    );

    const projectsRes = jsonConvert.serializeObject(projects, ProjectsResponse);
    responseData.body = projectsRes;
    return responseData as ApiResponseData<ProjectsResponse>;
  };

  export const mockProject = (): ApiResponseData<ProjectResponse> => {
    const responseData = ApiResponseData.fromAjaxResponse(
      createMockAjaxResponse({} as object)
    );

    const projectRes = jsonConvert.serializeObject(project, ProjectResponse);
    responseData.body = projectRes;
    return responseData as ApiResponseData<ProjectResponse>;
  };
}
