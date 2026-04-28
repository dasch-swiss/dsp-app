import { provideRouter } from '@angular/router';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { ResourceSegmentComponent } from './resource-segment.component';

const makeResource = (overrides: Record<string, unknown> = {}): DspResource =>
  ({
    res: {
      id: 'http://rdfh.ch/resource/segment/1',
      type: 'http://api.knora.org/ontology/knora-api/v2#VideoSegment',
      label: 'Test Video Segment',
      attachedToProject: 'http://rdfh.ch/projects/test',
      attachedToUser: 'http://rdfh.ch/users/test',
      userHasPermission: 'CR',
      properties: {},
      entityInfo: { classes: { 'http://api.knora.org/ontology/knora-api/v2#VideoSegment': { label: 'VideoSegment' } } },
      getValues: () => [],
      ...overrides,
    },
    resProps: [],
    incomingAnnotations: [],
  }) as unknown as DspResource;

const meta: Meta<ResourceSegmentComponent> = {
  title: 'Resource Editor / Resource / Segment',
  component: ResourceSegmentComponent,
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
        { provide: ResourceFetcherService, useValue: { userCanEdit$: of(false), projectShortcode$: of('0001') } },
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
      description: 'The segment resource to display.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceSegmentComponent>;

export const DefaultView: Story = {
  name: 'Shows segment resource with header and properties tab',
  args: { resource: makeResource() },
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
  args: { resource: makeResource({ userHasPermission: 'RV' }) },
  play: async ({ canvasElement, step }) => {
    await step('Restriction banner is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-restriction')).not.toBeNull();
    });
  },
};
