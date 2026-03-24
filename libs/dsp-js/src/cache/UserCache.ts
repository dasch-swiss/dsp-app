import { map } from 'rxjs';
import { KnoraApiConnection } from '../knora-api-connection';
import { UserResponse } from '../models/admin/user-response';
import { ApiResponseData } from '../models/api-response-data';
import { GenericCache } from './GenericCache';

/**
 * Caches user information obtained from Knora.
 */
export class UserCache extends GenericCache<UserResponse> {
  constructor(private knoraApiConnection: KnoraApiConnection) {
    super();
  }

  /**
   * Gets a user identified by its Iri.
   *
   * @param iri the Iri identifying the user.
   */
  getUser(iri: string) {
    return this.getItem(iri);
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
    return this.knoraApiConnection.admin.usersEndpoint.getUser('iri', key).pipe(
      map((response: ApiResponseData<UserResponse>) => {
        return [response.body];
      })
    );
  }

  protected getKeyOfItem(item: UserResponse) {
    return item.user.id;
  }

  protected getDependenciesOfItem(item: UserResponse): string[] {
    return [];
  }
}
