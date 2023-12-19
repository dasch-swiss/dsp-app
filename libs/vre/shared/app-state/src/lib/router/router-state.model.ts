import { Params } from '@angular/router';

export interface RouterStateModel {
  url: string;
  params: Params;
  queryParams: Params;
  data: any;
}
