import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// TODO remove this Interceptor and add all IIIF requests to a IIIFApiService that adds withCredentials true.
/**
 * Add withCredentials true (sends cookies, used for authentication)to any iiif request
 */
@Injectable()
export class IiifWithCredentialsInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (request.url.startsWith('https://iiif')) {
      const modifiedRequest = request.clone({ withCredentials: true });
      return next.handle(modifiedRequest);
    }

    // If the URL doesn't match, proceed with the original request
    return next.handle(request);
  }
}
