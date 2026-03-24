import { setupAjaxMock, AjaxMock } from '../../../../test/ajax-mock-helper';
import { KnoraApiConfig } from '../../../knora-api-config';
import { KnoraApiConnection } from '../../../knora-api-connection';
import { CreateGroupRequest } from '../../../models/admin/create-group-request';
import { GroupResponse } from '../../../models/admin/group-response';
import { GroupsResponse } from '../../../models/admin/groups-response';
import { MembersResponse } from '../../../models/admin/members-response';
import { StringLiteral } from '../../../models/admin/string-literal';
import { UpdateGroupRequest } from '../../../models/admin/update-group-request';
import { ApiResponseData } from '../../../models/api-response-data';

describe('GroupsEndpoint', () => {
  const config = new KnoraApiConfig('http', 'localhost', 3333, undefined, undefined, true);
  const knoraApiConnection = new KnoraApiConnection(config);

  let ajaxMock: AjaxMock;

  beforeEach(() => {
    ajaxMock = setupAjaxMock();
  });

  afterEach(() => {
    ajaxMock.cleanup();
  });

  describe('Method getGroups', () => {
    it('should return all groups', done => {
      const groups = require('../../../../test/data/api/admin/groups/get-groups-response.json');

      ajaxMock.setMockResponse(groups);

      knoraApiConnection.admin.groupsEndpoint.getGroups().subscribe((response: ApiResponseData<GroupsResponse>) => {
        expect(response.body.groups.length).toEqual(2);
        expect(response.body.groups[0].id).toEqual('http://rdfh.ch/groups/00FF/images-reviewer');

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe('http://localhost:3333/admin/groups');

        expect(request?.method).toEqual('GET');

        done();
      });
    });
  });

  describe('Method createGroup', () => {
    it('should create a group', done => {
      const group = new CreateGroupRequest();

      group.name = 'NewGroup';
      group.project = 'http://rdfh.ch/projects/00FF';
      group.status = true;
      group.selfjoin = false;

      const descriptions = new StringLiteral();
      descriptions.language = 'en';
      descriptions.value = 'NewGroupDescription';

      group.descriptions = [descriptions];

      const groups = require('../../../../test/data/api/admin/groups/get-group-response.json');

      ajaxMock.setMockResponse(groups);

      knoraApiConnection.admin.groupsEndpoint
        .createGroup(group)
        .subscribe((response: ApiResponseData<GroupResponse>) => {
          expect(response.body.group.name).toEqual('Image reviewer');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/groups');

          expect(request?.method).toEqual('POST');

          const payload = require('../../../../test/data/api/admin/groups/create-group-request.json');

          expect(request?.body).toEqual(payload);

          done();
        });
    });
  });

  describe('Method getGroupByIri', () => {
    it('should get a group by its IRI', done => {
      const groupIri = 'http://rdfh.ch/groups/00FF/images-reviewer';

      const group = require('../../../../test/data/api/admin/groups/get-group-response.json');

      ajaxMock.setMockResponse(group);

      knoraApiConnection.admin.groupsEndpoint
        .getGroupByIri(groupIri)
        .subscribe((response: ApiResponseData<GroupResponse>) => {
          expect(response.body.group.id).toEqual('http://rdfh.ch/groups/00FF/images-reviewer');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://localhost:3333/admin/groups/http%3A%2F%2Frdfh.ch%2Fgroups%2F00FF%2Fimages-reviewer'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method updateGroup', () => {
    it('should update a group', done => {
      const groupIri = 'http://rdfh.ch/groups/00FF/images-reviewer';

      const groupInfo = new UpdateGroupRequest();

      groupInfo.name = 'UpdatedGroupName';

      const descriptions = new StringLiteral();
      descriptions.language = 'en';
      descriptions.value = 'UpdatedGroupDescription';

      groupInfo.descriptions = [descriptions];

      const group = require('../../../../test/data/api/admin/groups/get-group-response.json');

      ajaxMock.setMockResponse(group);

      knoraApiConnection.admin.groupsEndpoint
        .updateGroup(groupIri, groupInfo)
        .subscribe((response: ApiResponseData<GroupResponse>) => {
          expect(response.body.group.name).toEqual('Image reviewer');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://localhost:3333/admin/groups/http%3A%2F%2Frdfh.ch%2Fgroups%2F00FF%2Fimages-reviewer'
          );

          expect(request?.method).toEqual('PUT');

          const payload = require('../../../../test/data/api/admin/groups/update-group-request.json');

          expect(request?.body).toEqual(payload);

          done();
        });
    });
  });

  describe('Method updateGroupStatus', () => {
    it("should update a group's status", done => {
      const groupIri = 'http://rdfh.ch/groups/00FF/images-reviewer';
      const groupStatus = true;

      // TODO: fix in Knora: payload

      const group = require('../../../../test/data/api/admin/groups/get-group-response.json');

      ajaxMock.setMockResponse(group);

      knoraApiConnection.admin.groupsEndpoint
        .updateGroupStatus(groupIri, groupStatus)
        .subscribe((response: ApiResponseData<GroupResponse>) => {
          expect(response.body.group.name).toEqual('Image reviewer');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://localhost:3333/admin/groups/http%3A%2F%2Frdfh.ch%2Fgroups%2F00FF%2Fimages-reviewer/status'
          );

          expect(request?.method).toEqual('PUT');

          const payload = require('../../../../test/data/api/admin/groups/change-group-status-request.json');

          expect(request?.body).toEqual(payload);

          done();
        });
    });
  });

  describe('Method deleteGroup', () => {
    it('should delete a group', done => {
      const groupIri = 'http://rdfh.ch/groups/00FF/images-reviewer';

      const group = require('../../../../test/data/api/admin/groups/get-group-response.json');

      ajaxMock.setMockResponse(group);

      knoraApiConnection.admin.groupsEndpoint
        .deleteGroup(groupIri)
        .subscribe((response: ApiResponseData<GroupResponse>) => {
          expect(response.body.group.name).toEqual('Image reviewer');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://localhost:3333/admin/groups/http%3A%2F%2Frdfh.ch%2Fgroups%2F00FF%2Fimages-reviewer'
          );

          expect(request?.method).toEqual('DELETE');

          done();
        });
    });
  });

  describe('Method getGroupMembers', () => {
    it("should get a group's members", done => {
      const groupIri = 'http://rdfh.ch/groups/00FF/images-reviewer';

      const members = require('../../../../test/data/api/admin/groups/get-group-members-response.json');

      ajaxMock.setMockResponse(members);

      knoraApiConnection.admin.groupsEndpoint
        .getGroupMembers(groupIri)
        .subscribe((response: ApiResponseData<MembersResponse>) => {
          expect(response.body.members.length).toEqual(2);
          expect(response.body.members[0].id).toEqual('http://rdfh.ch/users/images-reviewer-user');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://localhost:3333/admin/groups/http%3A%2F%2Frdfh.ch%2Fgroups%2F00FF%2Fimages-reviewer/members'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });
});
