import {
  JsonConvert,
  OperationMode,
  PropertyMatchingRule,
  ValueCheckingMode,
} from 'json2typescript';
import { AjaxResponse } from 'rxjs/ajax';
import { ApiResponseData } from '../../../../src/models/api-response-data';
import { UsersResponse } from '../../../../src/models/admin/users-response';
import { UserResponse } from '../../../../src/models/admin/user-response';

import users from './users/get-users-response.json';
import user from './users/get-user-response.json';

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

export namespace MockUsers {
  const jsonConvert: JsonConvert = new JsonConvert(
    OperationMode.ENABLE,
    ValueCheckingMode.DISALLOW_NULL,
    false,
    PropertyMatchingRule.CASE_STRICT
  );

  export const mockUsers = (): ApiResponseData<UsersResponse> => {
    const responseData = ApiResponseData.fromAjaxResponse(
      createMockAjaxResponse({} as object)
    );

    const usersRes = jsonConvert.serializeObject(users, UsersResponse);
    responseData.body = usersRes;
    return responseData as ApiResponseData<UsersResponse>;
  };

  export const mockUser = (): ApiResponseData<UserResponse> => {
    const responseData = ApiResponseData.fromAjaxResponse(
      createMockAjaxResponse({} as object)
    );

    const userRes = jsonConvert.serializeObject(user, UserResponse);
    responseData.body = userRes;
    return responseData as ApiResponseData<UserResponse>;
  };
}
