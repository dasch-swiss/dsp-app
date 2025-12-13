import { HttpInterceptorFn } from '@angular/common/http';

// TODO remove this Interceptor and add all IIIF requests to a IIIFApiService that adds withCredentials true.
/**
 * Add withCredentials true (sends cookies, used for authentication) to any iiif request
 */
export const iiifWithCredentialsInterceptorFn: HttpInterceptorFn = (request, next) => {
  if (request.url.startsWith('https://iiif')) {
    const modifiedRequest = request.clone({ withCredentials: true });
    return next(modifiedRequest);
  }

  // If the URL doesn't match, proceed with the original request
  return next(request);
};
