import { RouterStateSnapshot } from '@angular/router';
import { RouterStateSerializer } from '@ngxs/router-plugin';
import { RouterStateModel } from './router-state.model';

// The route state serializer will on route changes serialize
// the activated route into an object which reflect our state model
export class CustomRouterStateSerializer implements RouterStateSerializer<RouterStateModel> {
  serialize(routerState: RouterStateSnapshot): RouterStateModel {
    const {
      url,
      root: { queryParams },
    } = routerState;

    let { root: route } = routerState;

    while (route.firstChild) {
      route = route.firstChild;
    }

    const data = route.data;

    let params = route.params;
    params = route.pathFromRoot.filter(v => Object.keys(v.params).length).map(v => v.params)[0];
    params = params ? params : route.params;

    return { url, params, queryParams, data };
  }
}
