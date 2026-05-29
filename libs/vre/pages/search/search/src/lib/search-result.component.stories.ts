import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { NEVER, of } from 'rxjs';
import { expect } from 'storybook/test';
import { SearchResultComponent } from './search-result.component';

const STORY_PROVIDERS = [
  provideAnimations(),
  provideRouter([{ path: '**', redirectTo: '' }]),
  { provide: UserService, useValue: { currentUser: null } as Partial<UserService> },
];

const makeReadResource = (id: string, label: string): ReadResource => {
  const r = new ReadResource();
  r.id = id;
  r.label = label;
  r.type = 'http://api.knora.org/ontology/knora-api/v2#Resource';
  r.properties = {};
  r.attachedToProject = 'http://rdfh.ch/projects/0001';
  r.attachedToUser = 'http://rdfh.ch/users/root';
  r.hasPermissions = 'CR knora-admin:SystemAdmin';
  r.userHasPermission = 'CR';
  r.versionArkUrl = '';
  r.arkUrl = '';
  return r;
};

const meta: Meta<SearchResultComponent> = {
  title: 'Search / Fulltext Search / Search Result',
  component: SearchResultComponent,
  argTypes: {
    query: { description: 'Fulltext search query string.' },
    projectId: { description: 'Optional project IRI to limit the search scope.' },
    showProjectShortname: { description: 'Whether to show the project shortname in the resource list.' },
  },
};
export default meta;
type Story = StoryObj<SearchResultComponent>;

const sharedProviders = [
  ...STORY_PROVIDERS,
  importProvidersFrom(OverlayModule),
  { provide: ResourceResultService, useValue: { pageIndex$: of(0), numberOfResults: 0 } },
];

export const NoResults: Story = {
  name: 'Shows no-results message when search returns empty list',
  args: { query: 'nonexistent term', showProjectShortname: false },
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              search: {
                doFulltextSearch: () => of({ resources: [] }),
                doFulltextSearchCountQuery: () => of({ numberOfResults: 0 }),
              },
            },
          },
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('No results component is rendered', async () => {
      await expect(canvasElement.querySelector('app-no-results-found')).not.toBeNull();
    });
  },
};

export const WithResults: Story = {
  name: 'Shows resource browser when search returns results',
  args: { query: 'test', showProjectShortname: false },
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              search: {
                doFulltextSearch: () =>
                  of({ resources: [makeReadResource('http://rdfh.ch/0001/res1', 'Test Resource')] }),
                doFulltextSearchCountQuery: () => of({ numberOfResults: 1 }),
              },
            },
          },
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Resource browser is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-browser')).not.toBeNull();
    });
  },
};

export const WithResultsAndProjectFilter: Story = {
  name: 'Limits search results to a specific project when projectId is provided',
  args: {
    query: 'test',
    projectId: 'http://rdfh.ch/projects/0001',
    showProjectShortname: true,
  },
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              search: {
                doFulltextSearch: () =>
                  of({ resources: [makeReadResource('http://rdfh.ch/0001/res1', 'Project Resource')] }),
                doFulltextSearchCountQuery: () => of({ numberOfResults: 1 }),
              },
            },
          },
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Resource browser is rendered for project-scoped results', async () => {
      await expect(canvasElement.querySelector('app-resource-browser')).not.toBeNull();
    });
  },
};

export const Loading: Story = {
  name: 'Shows progress indicator while search is in flight',
  args: { query: 'loading test' },
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              search: {
                doFulltextSearch: () => NEVER,
                doFulltextSearchCountQuery: () => NEVER,
              },
            },
          },
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Progress indicator is shown', async () => {
      await expect(canvasElement.querySelector('app-progress-indicator')).not.toBeNull();
    });
    await step('Resource browser is not yet rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-browser')).toBeNull();
    });
  },
};
