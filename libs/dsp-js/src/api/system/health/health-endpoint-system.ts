import { catchError, map } from 'rxjs';
import { ApiResponseData } from '../../../models/api-response-data';
import { HealthResponse } from '../../../models/system/health-response';
import { Endpoint } from '../../endpoint';

/**
 * An endpoint to get Knora's state of health.
 *
 * @category Endpoint System
 */
export class HealthEndpointSystem extends Endpoint {
  /**
   * Returns Knora's state of health.
   */
  getHealthStatus() {
    return this.httpGet('').pipe(
      map(ajaxResponse => {
        return ApiResponseData.fromAjaxResponse(ajaxResponse, HealthResponse, this.jsonConvert);
      }),
      catchError(error => this.handleError(error))
    );
  }
}
