import { provideRouter } from '@angular/router';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { CompoundService } from './compound/compound.service';
import { RegionService } from './representations/region.service';
import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { ResourceCompoundComponent } from './resource-compound.component';

const makeResource = (overrides: Record<string, unknown> = {}): DspResource =>
  ({
    res: {
      id: 'http://rdfh.ch/resource/1',
      type: 'http://example.org/Thing',
      label: 'Test Compound Resource',
      attachedToProject: 'http://rdfh.ch/projects/test',
      attachedToUser: 'http://rdfh.ch/users/test',
      userHasPermission: 'CR',
      properties: {},
      entityInfo: { classes: { 'http://example.org/Thing': { label: 'Thing' } } },
      getValues: () => [],
      ...overrides,
    },
    resProps: [],
    incomingAnnotations: [],
  }) as unknown as DspResource;

const meta: Meta<ResourceCompoundComponent> = {
  title: 'Resource Editor / Resource / Compound',
  component: ResourceCompoundComponent,
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([{ path: '**', redirectTo: '' }]),
        {
          provide: AppConfigService,
          useValue: { dspApiConfig: { apiUrl: '' }, dspAppConfig: { iriBase: 'http://rdfh.ch' } },
        },
        {
          provide: ProjectApiService,
          useValue: { get: () => of({ project: { id: '', shortcode: '0001', shortname: 'test', longname: 'Test' } }) },
        },
        {
          provide: CompoundService,
          useValue: {
            incomingResource$: of(undefined),
            reset: () => {},
            onInit: () => {},
            currentPosition$: of(null),
            compoundNavigation$: of(null),
          },
        },
        {
          provide: RegionService,
          useValue: {
            regions$: of([]),
            regionsLoading$: of(false),
            selectedRegion$: of(null),
            showRegions: () => {},
            updateRegions$: () => of([]),
          },
        },
        {
          provide: ResourceFetcherService,
          useValue: { userCanEdit$: of(false), projectShortcode$: of('0001') },
        },
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              search: { doSearchIncomingLinks: () => of({ resources: [], mayHaveMoreResults: false }) },
            },
          },
        },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The compound resource to display.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
    compoundCount: {
      description: 'Total number of sub-resources in the compound.',
      table: { type: { summary: 'number' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceCompoundComponent>;

export const DefaultView: Story = {
  name: 'Shows compound resource with header, viewer and compound tabs',
  args: { resource: makeResource(), compoundCount: 5 },
  play: async ({ canvasElement, step }) => {
    await step('Resource header is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-header')).not.toBeNull();
    });
    await step('Tab group is rendered', async () => {
      await expect(canvasElement.querySelector('mat-tab-group')).not.toBeNull();
    });
  },
};

export const RestrictedView: Story = {
  name: 'Shows restriction banner when user has only restricted view permission',
  args: { resource: makeResource({ userHasPermission: 'RV' }), compoundCount: 3 },
  play: async ({ canvasElement, step }) => {
    await step('Restriction banner is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-restriction')).not.toBeNull();
    });
  },
};
