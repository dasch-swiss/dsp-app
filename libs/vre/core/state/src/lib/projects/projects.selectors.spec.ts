import { Params } from '@angular/router';
import {
  Constants,
  ProjectRestrictedViewSettings,
  ReadProject,
  ReadUser,
  StoredProject,
  StringLiteral,
} from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { IKeyValuePairs } from '../model-interfaces';
import { ProjectsSelectors } from './projects.selectors';
import { ProjectsStateModel } from './projects.state-model';

// Import ProjectService for spying instead of mocking

describe('ProjectsSelectors', () => {
  let mockState: ProjectsStateModel;
  let mockProjects: ReadProject[];
  let mockUserActiveProjects: StoredProject[];
  let mockProjectMembers: IKeyValuePairs<ReadUser>;
  let mockProjectGroups: IKeyValuePairs<any>;
  let mockProjectRestrictedViewSettings: ProjectRestrictedViewSettings;

  beforeEach(() => {
    mockProjects = [
      {
        id: 'http://rdfh.ch/projects/project1',
        shortcode: 'P001',
        shortname: 'project1',
        longname: 'Project One',
        description: [{ value: 'First project', language: 'en' }] as StringLiteral[],
        keywords: [],
        logo: '',
        status: true,
        selfjoin: false,
        ontologies: ['http://rdfh.ch/ontologies/project1'],
      },
      {
        id: 'http://rdfh.ch/projects/project2',
        shortcode: 'P002',
        shortname: 'project2',
        longname: 'Project Two',
        description: [{ value: 'Second project', language: 'en' }] as StringLiteral[],
        keywords: [],
        logo: '',
        status: false,
        selfjoin: false,
        ontologies: ['http://rdfh.ch/ontologies/project2'],
      },
      {
        id: Constants.SystemProjectIRI,
        shortcode: 'SYS',
        shortname: 'system',
        longname: 'System Project',
        description: [{ value: 'System project', language: 'en' }] as StringLiteral[],
        keywords: [],
        logo: '',
        status: true,
        selfjoin: false,
        ontologies: ['http://rdfh.ch/ontologies/system'],
      },
      {
        id: 'http://rdfh.ch/projects/project3',
        shortcode: 'P003',
        shortname: 'project3',
        longname: 'A Project Three',
        description: [{ value: 'Third project', language: 'en' }] as StringLiteral[],
        keywords: [],
        logo: '',
        status: true,
        selfjoin: false,
        ontologies: ['http://rdfh.ch/ontologies/project3'],
      },
    ];

    mockUserActiveProjects = [
      mockProjects[0] as StoredProject, // project1
      mockProjects[2] as StoredProject, // system project
    ];

    mockProjectMembers = {
      'project1-uuid': {
        value: [
          {
            id: 'http://rdfh.ch/users/user1',
            username: 'user1',
            email: 'user1@test.com',
            familyName: 'User',
            givenName: 'One',
            status: true,
            lang: 'en',
            groups: [],
            projects: [],
            permissions: {
              groupsPerProject: {},
              administrativePermissionsPerProject: {},
            },
          },
        ],
      },
    };

    mockProjectGroups = {
      'project1-uuid': {
        value: [
          {
            id: 'http://rdfh.ch/groups/group1',
            name: 'Group One',
            description: 'Group description',
            project: mockProjects[0],
            status: true,
            selfjoin: false,
          },
        ],
      },
    };

    mockProjectRestrictedViewSettings = {
      size: 'small',
      watermark: true,
    };

    mockState = {
      allProjects: mockProjects,
      isLoading: false,
      isMembershipLoading: false,
      hasLoadingErrors: false,
      projectMembers: mockProjectMembers,
      projectGroups: mockProjectGroups,
      projectRestrictedViewSettings: {
        'project1-uuid': {
          value: mockProjectRestrictedViewSettings,
        },
      },
    };
  });

  describe('otherProjects', () => {
    it('should return projects user is not a member of', () => {
      const result = ProjectsSelectors.otherProjects(mockState, mockUserActiveProjects);

      expect(result).toHaveLength(2);
      expect(result).toContain(mockProjects[1]); // project2
      expect(result).toContain(mockProjects[3]); // project3
      expect(result).not.toContain(mockProjects[0]); // project1 (user is member)
      expect(result).not.toContain(mockProjects[2]); // system project (user is member)
    });

    it('should return all projects when user has no active projects', () => {
      const result = ProjectsSelectors.otherProjects(mockState, []);

      expect(result).toHaveLength(4);
      expect(result).toEqual(mockProjects);
    });

    it('should return empty array when user is member of all projects', () => {
      const result = ProjectsSelectors.otherProjects(mockState, mockProjects as StoredProject[]);

      expect(result).toHaveLength(0);
    });
  });

  describe('allProjects', () => {
    it('should return all projects from state', () => {
      const result = ProjectsSelectors.allProjects(mockState);

      expect(result).toEqual(mockProjects);
    });
  });

  describe('allProjectShortcodes', () => {
    it('should return shortcodes of all projects', () => {
      const result = ProjectsSelectors.allProjectShortcodes(mockState);

      expect(result).toEqual(['P001', 'P002', 'SYS', 'P003']);
    });
  });

  describe('isProjectsLoading', () => {
    it('should return loading state', () => {
      const result = ProjectsSelectors.isProjectsLoading(mockState);

      expect(result).toBe(false);
    });

    it('should return true when loading', () => {
      mockState.isLoading = true;
      const result = ProjectsSelectors.isProjectsLoading(mockState);

      expect(result).toBe(true);
    });
  });

  describe('isMembershipLoading', () => {
    it('should return membership loading state', () => {
      const result = ProjectsSelectors.isMembershipLoading(mockState);

      expect(result).toBe(false);
    });

    it('should return true when membership loading', () => {
      mockState.isMembershipLoading = true;
      const result = ProjectsSelectors.isMembershipLoading(mockState);

      expect(result).toBe(true);
    });
  });

  describe('hasLoadingErrors', () => {
    it('should return loading errors state', () => {
      const result = ProjectsSelectors.hasLoadingErrors(mockState);

      expect(result).toBe(false);
    });

    it('should return true when has loading errors', () => {
      mockState.hasLoadingErrors = true;
      const result = ProjectsSelectors.hasLoadingErrors(mockState);

      expect(result).toBe(true);
    });
  });

  describe('projectMembers', () => {
    it('should return project members', () => {
      const result = ProjectsSelectors.projectMembers(mockState);

      expect(result).toEqual(mockProjectMembers);
    });
  });

  describe('projectGroups', () => {
    it('should return project groups', () => {
      const result = ProjectsSelectors.projectGroups(mockState);

      expect(result).toEqual(mockProjectGroups);
    });
  });

  describe('allActiveProjects', () => {
    it('should return only active projects sorted by longname', () => {
      const result = ProjectsSelectors.allActiveProjects(mockState);

      expect(result).toHaveLength(3);
      expect(result[0].longname).toBe('A Project Three'); // sorted alphabetically
      expect(result[1].longname).toBe('Project One');
      expect(result[2].longname).toBe('System Project');
      expect(result.every(p => p.status === true)).toBe(true);
    });

    it('should handle projects with undefined longname', () => {
      mockProjects[0].longname = undefined;
      const result = ProjectsSelectors.allActiveProjects(mockState);

      expect(result).toHaveLength(3);
      // Projects with undefined longname should be filtered out or sorted properly
      expect(result.find(p => p.longname === 'A Project Three')).toBeDefined();
    });
  });

  describe('allInactiveProjects', () => {
    it('should return only inactive projects sorted by longname', () => {
      const result = ProjectsSelectors.allInactiveProjects(mockState);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockProjects[1]);
      expect(result[0].status).toBe(false);
    });

    it('should handle projects with undefined longname', () => {
      mockProjects[1].longname = undefined;
      const result = ProjectsSelectors.allInactiveProjects(mockState);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockProjects[1]);
    });
  });

  describe('allNotSystemProjects', () => {
    it('should return active projects excluding system projects', () => {
      const result = ProjectsSelectors.allNotSystemProjects(mockState);

      expect(result).toHaveLength(2);
      expect(result).toContain(mockProjects[0]); // project1
      expect(result).toContain(mockProjects[3]); // project3
      expect(result).not.toContain(mockProjects[1]); // project2 (inactive)
      expect(result).not.toContain(mockProjects[2]); // system project
    });

    it('should exclude default shared ontology projects', () => {
      const sharedOntologyProject = {
        id: Constants.DefaultSharedOntologyIRI,
        shortcode: 'DSO',
        shortname: 'shared',
        longname: 'Shared Ontology',
        description: [{ value: 'Shared ontology', language: 'en' }] as StringLiteral[],
        keywords: [],
        logo: '',
        status: true,
        selfjoin: false,
        ontologies: ['http://rdfh.ch/ontologies/shared'],
      };

      mockProjects.push(sharedOntologyProject);
      mockState.allProjects = mockProjects;

      const result = ProjectsSelectors.allNotSystemProjects(mockState);

      expect(result).toHaveLength(2);
      expect(result.every(p => p.id !== Constants.DefaultSharedOntologyIRI)).toBe(true);
    });
  });

  describe('currentProject', () => {
    const mockParams: Params = {
      [RouteConstants.uuidParameter]: 'project1-uuid',
    };

    beforeEach(() => {
      jest.spyOn(ProjectService, 'IriToUuid').mockImplementation((iri: string) => {
        if (iri === 'http://rdfh.ch/projects/project1') return 'project1-uuid';
        return 'unknown-uuid';
      });
    });

    it('should return current project based on route params', () => {
      const result = ProjectsSelectors.currentProject(mockState, mockParams);

      expect(result).toEqual(mockProjects[0]);
    });

    it('should return undefined when params are undefined', () => {
      const result = ProjectsSelectors.currentProject(mockState, undefined);

      expect(result).toBeUndefined();
    });

    it('should return undefined when project not found', () => {
      const params = { [RouteConstants.uuidParameter]: 'nonexistent-uuid' };
      const result = ProjectsSelectors.currentProject(mockState, params);

      expect(result).toBeUndefined();
    });
  });

  describe('currentProjectsUuid', () => {
    it('should return current project UUID from params', () => {
      const params = { [RouteConstants.uuidParameter]: 'project1-uuid' };
      const result = ProjectsSelectors.currentProjectsUuid(mockState, params);

      expect(result).toBe('project1-uuid');
    });

    it('should return undefined when params are undefined', () => {
      const result = ProjectsSelectors.currentProjectsUuid(mockState, undefined);

      expect(result).toBeUndefined();
    });
  });

  describe('projectRestrictedViewSettings', () => {
    it('should return restricted view settings for current project', () => {
      const params = { [RouteConstants.uuidParameter]: 'project1-uuid' };
      const result = ProjectsSelectors.projectRestrictedViewSettings(
        mockState,
        null,
        { iriBase: 'http://rdfh.ch', geonameToken: 'token' },
        params
      );

      expect(result).toEqual(mockProjectRestrictedViewSettings);
    });

    it('should return undefined when params are null', () => {
      const result = ProjectsSelectors.projectRestrictedViewSettings(
        mockState,
        null,
        { iriBase: 'http://rdfh.ch', geonameToken: 'token' },
        undefined
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined when project UUID is not found', () => {
      const params = { [RouteConstants.uuidParameter]: 'nonexistent-uuid' };
      const result = ProjectsSelectors.projectRestrictedViewSettings(
        mockState,
        null,
        { iriBase: 'http://rdfh.ch', geonameToken: 'token' },
        params
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined when settings are not available', () => {
      mockState.projectRestrictedViewSettings = {};
      const params = { [RouteConstants.uuidParameter]: 'project1-uuid' };
      const result = ProjectsSelectors.projectRestrictedViewSettings(
        mockState,
        null,
        { iriBase: 'http://rdfh.ch', geonameToken: 'token' },
        params
      );

      expect(result).toBeUndefined();
    });
  });
});
