import { JsonConvert, OperationMode, ValueCheckingMode } from 'json2typescript';
import { PropertyMatchingRule } from 'json2typescript';
import { of } from 'rxjs';
import { KnoraApiConfig } from '../knora-api-config';
import { KnoraApiConnection } from '../knora-api-connection';
import { UserResponse } from '../models/admin/user-response';
import { ApiResponseData } from '../models/api-response-data';
import { UserCache } from './UserCache';

describe('UserCache', () => {
  const config = new KnoraApiConfig('http', '0.0.0.0', 3333);
  const knoraApiConnection = new KnoraApiConnection(config);

  let getUserSpy: jest.SpyInstance;
  let userCache: UserCache;

  const jsonConvert: JsonConvert = new JsonConvert(
    OperationMode.ENABLE,
    ValueCheckingMode.DISALLOW_NULL,
    false,
    PropertyMatchingRule.CASE_STRICT
  );

  const user = require('../../test/data/api/admin/users/get-user-response.json');

  const userResp = jsonConvert.deserializeObject(user, UserResponse);

  beforeEach(() => {
    getUserSpy = jest
      .spyOn(knoraApiConnection.admin.usersEndpoint, 'getUser')
      .mockImplementation((prop: 'iri' | 'username' | 'email', userId: string) => {
        return of({ body: userResp } as ApiResponseData<UserResponse>);
      });

    userCache = new UserCache(knoraApiConnection);
  });

  afterEach(() => {
    getUserSpy.mockRestore();
  });

  describe('Method getItem', () => {
    it('should get a user from the cache', done => {
      userCache['getItem']('http://rdfh.ch/users/root').subscribe((res: UserResponse) => {
        expect(res.user.id).toEqual('http://rdfh.ch/users/root');
        expect(getUserSpy).toHaveBeenCalledTimes(1);

        expect(userCache['cache']['http://rdfh.ch/users/root']).not.toBeUndefined();
        done();
      });
    });

    it('should get the user from the cache twice synchronously', done => {
      userCache['getItem']('http://rdfh.ch/users/root').subscribe((res: UserResponse) => {
        expect(res.user.id).toEqual('http://rdfh.ch/users/root');
        expect(getUserSpy).toHaveBeenCalledTimes(1);

        userCache['getItem']('http://rdfh.ch/users/root').subscribe((res2: UserResponse) => {
          expect(res2.user.id).toEqual('http://rdfh.ch/users/root');
          expect(getUserSpy).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });

    it('should get the same user from the cache several times asynchronously', () => {
      userCache['getItem']('http://rdfh.ch/users/root').subscribe((res: UserResponse) => {
        expect(getUserSpy).toHaveBeenCalledTimes(1);
      });

      userCache['getItem']('http://rdfh.ch/users/root').subscribe((res: UserResponse) => {
        expect(getUserSpy).toHaveBeenCalledTimes(1);
      });

      userCache['getItem']('http://rdfh.ch/users/root').subscribe((res: UserResponse) => {
        expect(getUserSpy).toHaveBeenCalledTimes(1);
      });

      expect(getUserSpy).toHaveBeenCalledTimes(1);
      expect(getUserSpy).toHaveBeenCalledWith('iri', 'http://rdfh.ch/users/root');
    });

    it('should get a user from the cache and refresh the entry', done => {
      userCache['getItem']('http://rdfh.ch/users/root').subscribe((res: UserResponse) => {
        expect(getUserSpy).toHaveBeenCalledTimes(1);

        userCache['reloadItem']('http://rdfh.ch/users/root').subscribe((res2: UserResponse) => {
          expect(getUserSpy).toHaveBeenCalledTimes(2);
          done();
        });
      });
    });
  });

  describe('Method getUser', () => {
    it('should get a user by its Iri', done => {
      userCache.getUser('http://rdfh.ch/users/root').subscribe((res: UserResponse) => {
        expect(res.user.id).toEqual('http://rdfh.ch/users/root');
        expect(getUserSpy).toHaveBeenCalledTimes(1);

        expect(userCache['cache']['http://rdfh.ch/users/root']).not.toBeUndefined();
        done();
      });
    });
  });

  describe('Method reloadCachedItem', () => {
    it('should get reload a user from the cache', done => {
      userCache['reloadCachedItem']('http://rdfh.ch/users/root').subscribe((res: UserResponse) => {
        expect(res.user.id).toEqual('http://rdfh.ch/users/root');
        expect(getUserSpy).toHaveBeenCalledTimes(1);

        expect(userCache['cache']['http://rdfh.ch/users/root']).not.toBeUndefined();
        done();
      });
    });
  });
});
