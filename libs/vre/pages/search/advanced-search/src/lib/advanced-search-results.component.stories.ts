import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { NEVER, of } from 'rxjs';
import { expect } from 'storybook/test';
import { AdvancedSearchResultsComponent } from './advanced-search-results.component';
import { makeDspApiConnectionStub, STORY_PROVIDERS } from './stories.helpers';

const SAMPLE_QUERY = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT { ?mainRes knora-api:isMainResource true . } WHERE { ?mainRes a knora-api:Resource . } OFFSET 0
`.trim();

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

const meta: Meta<AdvancedSearchResultsComponent> = {
  title: 'Search / Advanced Search / Advanced Search Results',
  component: AdvancedSearchResultsComponent,
  argTypes: {
    query: { description: 'Gravsearch query string to execute against the API.' },
  },
};
export default meta;
type Story = StoryObj<AdvancedSearchResultsComponent>;

const sharedProviders = [
  ...STORY_PROVIDERS,
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  { provide: ResourceResultService, useValue: { pageIndex$: of(0), numberOfResults: 0 } },
  // The component now reads `currentProject.id` synchronously (to pass limitToProject). The real
  // root ProjectPageService throws unless setup()/currentProject$ ran, so stub it as the unit test does.
  { provide: ProjectPageService, useValue: { currentProject: { id: 'http://rdfh.ch/projects/0001' } } },
];

export const NoResults: Story = {
  name: 'Shows no-results message when query returns empty list',
  args: { query: SAMPLE_QUERY },
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: DspApiConnectionToken,
          useValue: makeDspApiConnectionStub({
            search: {
              doExtendedSearch: () => of({ resources: [] }),
              doExtendedSearchCountQuery: () => of({ numberOfResults: 0 }),
            },
          }),
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
  name: 'Shows resource browser when query returns results',
  args: { query: SAMPLE_QUERY },
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: DspApiConnectionToken,
          useValue: makeDspApiConnectionStub({
            search: {
              doExtendedSearch: () =>
                of({ resources: [makeReadResource('http://rdfh.ch/0001/res1', 'Test Resource')] }),
              doExtendedSearchCountQuery: () => of({ numberOfResults: 1 }),
            },
          }),
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

export const Loading: Story = {
  name: 'Shows progress indicator while query is executing',
  args: { query: SAMPLE_QUERY },
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: DspApiConnectionToken,
          useValue: makeDspApiConnectionStub({
            search: {
              // The search never resolves, so the component keeps `queryIsExecuting` true and shows the indicator.
              doExtendedSearch: () => NEVER,
              doExtendedSearchCountQuery: () => NEVER,
            },
          }),
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
