import { map } from 'rxjs';
import { AdminEndpoint } from '../api/admin/admin-endpoint';
import { ListResponse } from '../models/admin/list-response';
import { ApiResponseData } from '../models/api-response-data';
import { GenericCache } from './GenericCache';

/**
 * Caches user information obtained from Knora.
 */
export class ListAdminCache extends GenericCache<ListResponse> {
  constructor(private adminEndpoint: AdminEndpoint) {
    super();
  }

  /**
   * Requests a whole list from the admin API.
   *
   * @param listIri IRI of the list.
   */
  getList(listIri: string) {
    return this.getItem(listIri);
  }

  /**
   * Public method to access the reloadItem method
   *
   * @param key the id of the information to be returned.
   * @return the item
   */
  reloadCachedItem(key: string) {
    return this.reloadItem(key);
  }

  protected requestItemFromKnora(key: string, isDependency: boolean) {
    return this.adminEndpoint.listsEndpoint.getList(key).pipe(
      map((response: ApiResponseData<ListResponse>) => {
        return [response.body];
      })
    );
  }

  protected getKeyOfItem(item: ListResponse) {
    return item.list.listinfo.id;
  }

  protected getDependenciesOfItem(item: ListResponse): string[] {
    return [];
  }
}
