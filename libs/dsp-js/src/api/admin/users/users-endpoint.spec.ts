import { setupAjaxMock, AjaxMock } from '../../../../test/ajax-mock-helper';
import { KnoraApiConfig } from '../../../knora-api-config';
import { KnoraApiConnection } from '../../../knora-api-connection';
import { GroupsResponse } from '../../../models/admin/groups-response';
import { ProjectsResponse } from '../../../models/admin/projects-response';
import { UpdateUserRequest } from '../../../models/admin/update-user-request';
import { User } from '../../../models/admin/user';
import { UserResponse } from '../../../models/admin/user-response';
import { UsersResponse } from '../../../models/admin/users-response';
import { ApiResponseData } from '../../../models/api-response-data';
import { ApiResponseError } from '../../../models/api-response-error';

describe('UsersEndpoint', () => {
  const config = new KnoraApiConfig('http', 'localhost', 3333, undefined, undefined, true);
  const knoraApiConnection = new KnoraApiConnection(config);

  let ajaxMock: AjaxMock;

  beforeEach(() => {
    ajaxMock = setupAjaxMock();
  });

  afterEach(() => {
    ajaxMock.cleanup();
  });

  describe('Method getUsers', () => {
    it('should return all users', done => {
      const users = require('../../../../test/data/api/admin/users/get-users-response.json');

      ajaxMock.setMockResponse(users);

      knoraApiConnection.admin.usersEndpoint.getUsers().subscribe((response: ApiResponseData<UsersResponse>) => {
        expect(response.body.users.length).toEqual(18);
        expect(response.body.users[0].familyName).toEqual('Admin-alt');

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe('http://localhost:3333/admin/users');

        expect(request?.method).toEqual('GET');

        done();
      });
    });
  });

  describe('Method getUser', () => {
    it('should return a user by its iri', done => {
      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint
        .getUser('iri', 'http://rdfh.ch/users/root')
        .subscribe((response: ApiResponseData<UserResponse>) => {
          expect(response.body.user.familyName).toEqual('Administrator');

          expect(response.body.user.permissions.administrativePermissionsPerProject).toEqual({});

          expect(response.body.user.permissions.groupsPerProject).toBeDefined();
          expect(
            response.body.user.permissions.groupsPerProject!['http://www.knora.org/ontology/knora-admin#SystemProject']
          ).toBeDefined();
          expect(
            response.body.user.permissions.groupsPerProject!['http://www.knora.org/ontology/knora-admin#SystemProject']!
              .length
          ).toEqual(1);
          expect(
            response.body.user.permissions.groupsPerProject![
              'http://www.knora.org/ontology/knora-admin#SystemProject'
            ]![0]
          ).toEqual('http://www.knora.org/ontology/knora-admin#SystemAdmin');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/users/iri/http%3A%2F%2Frdfh.ch%2Fusers%2Froot');

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should return a user by its email', done => {
      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint
        .getUser('email', 'root@example.org')
        .subscribe((response: ApiResponseData<UserResponse>) => {
          expect(response.body.user.familyName).toEqual('Administrator');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/users/email/root%40example.org');

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should return a user by its username', done => {
      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint
        .getUser('username', 'anything.Administrator')
        .subscribe((response: ApiResponseData<UserResponse>) => {
          expect(response.body.user.familyName).toEqual('Administrator');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/users/username/anything.Administrator');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getUserByIri', () => {
    it('should return a user by its iri', done => {
      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint
        .getUserByIri('http://rdfh.ch/users/root')
        .subscribe((response: ApiResponseData<UserResponse>) => {
          expect(response.body.user.familyName).toEqual('Administrator');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/users/iri/http%3A%2F%2Frdfh.ch%2Fusers%2Froot');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getUserByEmail', () => {
    it('should return a user by its email', done => {
      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint
        .getUserByEmail('root@example.org')
        .subscribe((response: ApiResponseData<UserResponse>) => {
          expect(response.body.user.familyName).toEqual('Administrator');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/users/email/root%40example.org');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getUserByUsername', () => {
    it('should return a user by its username', done => {
      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint
        .getUserByUsername('anything.Administrator')
        .subscribe((response: ApiResponseData<UserResponse>) => {
          expect(response.body.user.familyName).toEqual('Administrator');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/users/username/anything.Administrator');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getUserGroupMemberships', () => {
    it("should get a user's group memberships", done => {
      const userIri = 'http://rdfh.ch/users/9XBCrDV3SRa7kS1WwynB4Q';

      const groupMemberships = require('../../../../test/data/api/admin/users/get-user-group-memberships-response.json');

      ajaxMock.setMockResponse(groupMemberships);

      knoraApiConnection.admin.usersEndpoint
        .getUserGroupMemberships(userIri)
        .subscribe((response: ApiResponseData<GroupsResponse>) => {
          expect(response.body.groups.length).toEqual(1);
          expect(response.body.groups[0].id).toEqual('http://rdfh.ch/groups/00FF/images-reviewer');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://localhost:3333/admin/users/iri/http%3A%2F%2Frdfh.ch%2Fusers%2F9XBCrDV3SRa7kS1WwynB4Q/group-memberships'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getUserProjectMemberships', () => {
    it("should get a user's project memberships", done => {
      const userIri = 'http://rdfh.ch/users/9XBCrDV3SRa7kS1WwynB4Q';

      const projectMemberships = require('../../../../test/data/api/admin/users/get-user-project-memberships-response.json');

      ajaxMock.setMockResponse(projectMemberships);

      knoraApiConnection.admin.usersEndpoint.getUserProjectMemberships(userIri).subscribe(() => {
        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe(
          'http://localhost:3333/admin/users/iri/http%3A%2F%2Frdfh.ch%2Fusers%2F9XBCrDV3SRa7kS1WwynB4Q/project-memberships'
        );

        expect(request?.method).toEqual('GET');

        done();
      });
    });
  });

  describe('Method getUserProjectAdminMemberships', () => {
    it("should get a user's project admin memberships", done => {
      const userIri = 'http://rdfh.ch/users/9XBCrDV3SRa7kS1WwynB4Q';

      const projectMemberships = require('../../../../test/data/api/admin/users/get-user-project-memberships-response.json');

      ajaxMock.setMockResponse(projectMemberships);

      knoraApiConnection.admin.usersEndpoint.getUserProjectAdminMemberships(userIri).subscribe(() => {
        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe(
          'http://localhost:3333/admin/users/iri/http%3A%2F%2Frdfh.ch%2Fusers%2F9XBCrDV3SRa7kS1WwynB4Q/project-admin-memberships'
        );

        expect(request?.method).toEqual('GET');

        done();
      });
    });
  });

  describe('Method createUser', () => {
    it('should create a user', done => {
      const newUser = new User();

      newUser.username = 'donald.duck';
      newUser.email = 'donald.duck@example.org';
      newUser.givenName = 'Donald';
      newUser.familyName = 'Duck';
      newUser.password = 'test';
      newUser.status = true;
      newUser.lang = 'en';
      newUser.systemAdmin = false;

      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint.createUser(newUser).subscribe(() => {
        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe('http://localhost:3333/admin/users');

        expect(request?.method).toEqual('POST');

        expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');

        const payload = require('../../../../test/data/api/admin/users/create-user-request.json');

        expect(request?.body).toEqual(payload);

        done();
      });
    });
  });

  describe('Method updateUserBasicInformation', () => {
    it('should update user information', done => {
      const userIri = 'http://rdfh.ch/users/normaluser';
      const userInfo = new UpdateUserRequest();

      userInfo.username = 'donald.big.duck';
      userInfo.email = 'donald.big.duck@example.org';
      userInfo.givenName = 'Big Donald';
      userInfo.familyName = 'Duckmann';
      userInfo.lang = 'de';

      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint.updateUserBasicInformation(userIri, userInfo).subscribe(() => {
        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe(
          'http://localhost:3333/admin/users/iri/http%3A%2F%2Frdfh.ch%2Fusers%2Fnormaluser/BasicUserInformation'
        );

        expect(request?.method).toEqual('PUT');

        expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');

        const payload = require('../../../../test/data/api/admin/users/update-user-request.json');

        expect(request?.body).toEqual(payload);

        done();
      });
    });
  });

  describe('Method updateUserStatus', () => {
    it("should update a user's status", done => {
      const userIri = 'http://rdfh.ch/users/9XBCrDV3SRa7kS1WwynB4Q';

      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint.updateUserStatus(userIri, false).subscribe(() => {
        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe(
          'http://localhost:3333/admin/users/iri/http%3A%2F%2Frdfh.ch%2Fusers%2F9XBCrDV3SRa7kS1WwynB4Q/Status'
        );

        expect(request?.method).toEqual('PUT');

        expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');

        const payload = require('../../../../test/data/api/admin/users/update-user-status-request.json');

        expect(request?.body).toEqual(payload);

        done();
      });
    });
  });

  describe('Method updateUserPassword', () => {
    it("should update a user's password", done => {
      const userIri = 'http://rdfh.ch/users/9XBCrDV3SRa7kS1WwynB4Q';

      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint.updateUserPassword(userIri, 'test', 'test123456').subscribe(() => {
        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe(
          'http://localhost:3333/admin/users/iri/http%3A%2F%2Frdfh.ch%2Fusers%2F9XBCrDV3SRa7kS1WwynB4Q/Password'
        );

        expect(request?.method).toEqual('PUT');

        expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');

        const payload = require('../../../../test/data/api/admin/users/update-user-password-request.json');

        expect(request?.body).toEqual(payload);

        done();
      });
    });
  });

  describe('Method addUserToGroupMembership', () => {
    it('should add a user to a group', done => {
      const userIri = 'http://rdfh.ch/users/9XBCrDV3SRa7kS1WwynB4Q';

      const groupIri = 'http://rdfh.ch/groups/0001/thing-searcher';

      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint.addUserToGroupMembership(userIri, groupIri).subscribe(() => {
        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe(
          'http://localhost:3333/admin/users/iri/http%3A%2F%2Frdfh.ch%2Fusers%2F9XBCrDV3SRa7kS1WwynB4Q/group-memberships/http%3A%2F%2Frdfh.ch%2Fgroups%2F0001%2Fthing-searcher'
        );

        expect(request?.method).toEqual('POST');

        expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');

        done();
      });
    });
  });

  describe('Method removeUserFromGroupMembership', () => {
    it('should remove a user from a group', done => {
      const userIri = 'http://rdfh.ch/users/9XBCrDV3SRa7kS1WwynB4Q';

      const groupIri = 'http://rdfh.ch/groups/0001/thing-searcher';

      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint.removeUserFromGroupMembership(userIri, groupIri).subscribe(() => {
        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe(
          'http://localhost:3333/admin/users/iri/http%3A%2F%2Frdfh.ch%2Fusers%2F9XBCrDV3SRa7kS1WwynB4Q/group-memberships/http%3A%2F%2Frdfh.ch%2Fgroups%2F0001%2Fthing-searcher'
        );

        expect(request?.method).toEqual('DELETE');

        done();
      });
    });
  });

  describe('Method addUserToProjectMembership', () => {
    it('should add a user to a project', done => {
      const userIri = 'http://rdfh.ch/users/9XBCrDV3SRa7kS1WwynB4Q';

      const groupIri = 'http://rdfh.ch/groups/0001/thing-searcher';

      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint.addUserToProjectMembership(userIri, groupIri).subscribe(() => {
        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe(
          'http://localhost:3333/admin/users/iri/http%3A%2F%2Frdfh.ch%2Fusers%2F9XBCrDV3SRa7kS1WwynB4Q/project-memberships/http%3A%2F%2Frdfh.ch%2Fgroups%2F0001%2Fthing-searcher'
        );

        expect(request?.method).toEqual('POST');

        expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');

        done();
      });
    });
  });

  describe('Method removeUserFromProjectMembership', () => {
    it('should remove a user from a project', done => {
      const userIri = 'http://rdfh.ch/users/9XBCrDV3SRa7kS1WwynB4Q';

      const groupIri = 'http://rdfh.ch/groups/0001/thing-searcher';

      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint.removeUserFromProjectMembership(userIri, groupIri).subscribe(() => {
        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe(
          'http://localhost:3333/admin/users/iri/http%3A%2F%2Frdfh.ch%2Fusers%2F9XBCrDV3SRa7kS1WwynB4Q/project-memberships/http%3A%2F%2Frdfh.ch%2Fgroups%2F0001%2Fthing-searcher'
        );

        expect(request?.method).toEqual('DELETE');

        done();
      });
    });
  });

  describe('Method addUserToProjectAdminMembership', () => {
    it('should add a user to a project admin membership', done => {
      const userIri = 'http://rdfh.ch/users/9XBCrDV3SRa7kS1WwynB4Q';

      const groupIri = 'http://rdfh.ch/groups/0001/thing-searcher';

      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint.addUserToProjectAdminMembership(userIri, groupIri).subscribe(() => {
        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe(
          'http://localhost:3333/admin/users/iri/http%3A%2F%2Frdfh.ch%2Fusers%2F9XBCrDV3SRa7kS1WwynB4Q/project-admin-memberships/http%3A%2F%2Frdfh.ch%2Fgroups%2F0001%2Fthing-searcher'
        );

        expect(request?.method).toEqual('POST');

        expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');

        done();
      });
    });
  });

  describe('Method removeUserFromProjectAdminMembership', () => {
    it('should remove a user from a project admin membership', done => {
      const userIri = 'http://rdfh.ch/users/9XBCrDV3SRa7kS1WwynB4Q';

      const groupIri = 'http://rdfh.ch/groups/0001/thing-searcher';

      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint.removeUserFromProjectAdminMembership(userIri, groupIri).subscribe(() => {
        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe(
          'http://localhost:3333/admin/users/iri/http%3A%2F%2Frdfh.ch%2Fusers%2F9XBCrDV3SRa7kS1WwynB4Q/project-admin-memberships/http%3A%2F%2Frdfh.ch%2Fgroups%2F0001%2Fthing-searcher'
        );

        expect(request?.method).toEqual('DELETE');

        done();
      });
    });
  });

  describe('Method updateUserSystemAdminMembership', () => {
    it("should update a user's project admin membership", done => {
      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint
        .updateUserSystemAdminMembership('http://rdfh.ch/users/9XBCrDV3SRa7kS1WwynB4Q', true)
        .subscribe(() => {
          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://localhost:3333/admin/users/iri/http%3A%2F%2Frdfh.ch%2Fusers%2F9XBCrDV3SRa7kS1WwynB4Q/SystemAdmin'
          );

          expect(request?.method).toEqual('PUT');

          const payload = require('../../../../test/data/api/admin/users/update-user-system-admin-membership-request.json');

          expect(request?.body).toEqual(payload);

          done();
        });
    });
  });

  describe('Method deleteUser', () => {
    it('should delete a user', done => {
      const userIri = 'http://rdfh.ch/users/9XBCrDV3SRa7kS1WwynB4Q';

      const user = require('../../../../test/data/api/admin/users/get-user-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.usersEndpoint.deleteUser(userIri).subscribe(() => {
        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe(
          'http://localhost:3333/admin/users/iri/http%3A%2F%2Frdfh.ch%2Fusers%2F9XBCrDV3SRa7kS1WwynB4Q'
        );

        expect(request?.method).toEqual('DELETE');

        done();
      });
    });
  });
});
