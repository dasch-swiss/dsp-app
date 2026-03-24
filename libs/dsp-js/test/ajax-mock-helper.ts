import { of, throwError } from 'rxjs';
import * as rxjsAjax from 'rxjs/ajax';
import { AjaxResponse } from 'rxjs/ajax';

export interface AjaxMock {
  ajaxSpy: jest.SpyInstance;
  setMockResponse: (data: any) => void;
  setMockError: (error: any, status?: number) => void;
  getLastRequest: () => { url?: string; method?: string; body?: any; headers?: any } | null;
  cleanup: () => void;
}

export function setupAjaxMock(): AjaxMock {
  let lastRequest: any = null;

  const ajaxSpy = jest.spyOn(rxjsAjax, 'ajax').mockImplementation((config: any) => {
    lastRequest = typeof config === 'string' ? { url: config } : config;
    return throwError(() => new Error('No mock response set'));
  });

  return {
    ajaxSpy,
    setMockResponse: (data: any) => {
      ajaxSpy.mockImplementation((config: any) => {
        lastRequest = typeof config === 'string' ? { url: config } : config;
        return of({
          response: data,
          status: 200,
          responseType: 'json',
        } as AjaxResponse<any>);
      });
    },
    setMockError: (error: any, status = 400) => {
      ajaxSpy.mockImplementation((config: any) => {
        lastRequest = typeof config === 'string' ? { url: config } : config;
        // Mimic AjaxError structure for proper error handling
        const ajaxError = {
          name: 'AjaxError',
          message: `ajax error ${status}`,
          status,
          response: error,
          responseType: 'json',
          request: lastRequest,
          xhr: { status },
        };
        return throwError(() => ajaxError);
      });
    },
    getLastRequest: () => lastRequest,
    cleanup: () => {
      ajaxSpy.mockRestore();
      lastRequest = null;
    },
  };
}
