import { provideRouter } from '@angular/router';
import { Constants, ReadIntervalValue, ReadResource, ReadTextValueAsString } from '@dasch-swiss/dsp-js';
import { ProjectApiService, ResourceLegalV2ApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import {
  DspResource,
  generateDspResource,
  PaginatedApiService,
  ResourceService,
} from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of, Subject } from 'rxjs';
import { expect } from 'storybook/test';

import { RegionService } from '../representation/region.service';
import { ResourceFetcherService } from '../representation/resource-fetcher.service';
import { Segment } from '../representation/segments/segment';
import { SegmentsService } from '../representation/segments/segments.service';
import { makeEntityInfo } from '../resource-stories.helper';
import { PropertiesDisplayService } from './properties-display/property-value/properties-display.service';
import { ResourceMediaTabsComponent } from './resource-media-tabs.component';

const makeResource = (): DspResource => {
  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/1';
  res.type = 'http://example.org/Thing';
  res.label = 'Test Resource';
  res.attachedToProject = 'http://rdfh.ch/projects/test';
  res.attachedToUser = 'http://rdfh.ch/users/test';
  res.userHasPermission = 'CR';
  res.versionArkUrl = 'http://ark.example/resource-1';
  res.properties = {};
  res.entityInfo = makeEntityInfo(res.type, [], 'Thing');
  return generateDspResource(res);
};

const makeSegmentResource = (index: number): DspResource => {
  const res = new ReadResource();
  res.id = `http://rdfh.ch/resource/segment/${index}`;
  res.type = 'http://api.knora.org/ontology/knora-api/v2#VideoSegment';
  res.label = `Segment ${index}`;
  res.attachedToProject = 'http://rdfh.ch/projects/test';
  res.attachedToUser = 'http://rdfh.ch/users/test';
  res.userHasPermission = 'CR';
  res.creationDate = '2024-06-15T10:00:00.000Z';
  res.versionArkUrl = `http://ark.example/segment-${index}`;
  res.properties = {};
  res.entityInfo = makeEntityInfo(res.type, [], 'Video Segment');
  return generateDspResource(res);
};

const makeTextValue = (text: string): ReadTextValueAsString => {
  const v = new ReadTextValueAsString();
  v.text = text;
  v.type = Constants.TextValue;
  v.userHasPermission = 'RV';
  return v;
};

const makeIntervalValue = (start: number, end: number): ReadIntervalValue => {
  const v = new ReadIntervalValue();
  v.start = start;
  v.end = end;
  return v;
};

const makeSegment = (index: number, label: string, start: number, end: number): Segment => ({
  resource: makeSegmentResource(index),
  row: index,
  label,
  hasSegmentBounds: makeIntervalValue(start, end),
  hasSegmentOfValue: undefined,
  hasComment: makeTextValue(`Comment for segment ${index}`),
  hasDescription: makeTextValue(`Description for segment ${index}`),
  hasKeyword: undefined,
  hasTitle: makeTextValue(label),
});

const sharedProviders = [
  provideRouter([{ path: '**', component: class {} }]),
  {
    provide: AppConfigService,
    useValue: { dspApiConfig: { apiUrl: '' }, dspAppConfig: { iriBase: 'http://rdfh.ch' } },
  },
  {
    provide: ResourceService,
    useValue: {
      getResourcePath: (iri?: string) => iri ?? '0001/test-resource',
      getResourceIri: (sc: string, uuid: string) => `http://rdfh.ch/${sc}/${uuid}`,
    },
  },
  {
    provide: DspApiConnectionToken,
    useValue: {
      v2: {
        search: { doSearchIncomingLinks: () => of({ resources: [], mayHaveMoreResults: false }) },
        onto: { getOntology: () => of({}) },
      },
    },
  },
  {
    provide: ProjectApiService,
    useValue: {
      get: () =>
        of({
          project: {
            id: 'http://rdfh.ch/projects/test',
            shortcode: 'test',
            shortname: 'test',
            longname: 'Test Project',
          },
        }),
    },
  },
  {
    provide: ResourceFetcherService,
    useValue: {
      attachedUser$: of({ givenName: 'Jane', familyName: 'Doe' }),
      userCanEdit$: of(false),
      userCanDelete$: of(false),
    },
  },
  {
    provide: RegionService,
    useValue: {
      regions$: of([]),
      regionsLoading$: of(false),
      selectedRegion$: of(null),
      showRegions: () => {},
      updateRegions$: () => of(undefined),
      selectRegion: () => {},
      setHighlightedRegionClicked: () => {},
    },
  },
  {
    provide: PropertiesDisplayService,
    useValue: {
      showAllProperties$: of(false),
      showComments$: of(false),
      toggleShowProperties: () => {},
      toggleShowComments: () => {},
    },
  },
  // Stubs for the embedded app-resource-rights-statement-container (data-side rights statement).
  { provide: PaginatedApiService, useValue: { getLicenses: () => of([]) } },
  { provide: ResourceLegalV2ApiService, useValue: { updateResourceAuthorship: () => of(undefined) } },
  { provide: UserService, useValue: { user$: of(null) } },
  { provide: NotificationService, useValue: { openSnackBar: () => {} } },
];

const meta: Meta<ResourceMediaTabsComponent> = {
  title: 'Resource Editor / 4. Properties / Resource Media Tabs / Resource Media Tabs',
  component: ResourceMediaTabsComponent,
  argTypes: {
    resource: {
      description: 'The DSP resource to display inside the tabs.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceMediaTabsComponent>;

export const PropertiesOnly: Story = {
  name: 'Shows only properties tab when resource has no segments',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: SegmentsService,
          useValue: { segments: [], highlightSegment$: new Subject() },
        },
      ],
    }),
  ],
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Properties tab is rendered', async () => {
      const tabs = canvasElement.querySelectorAll('.mat-mdc-tab');
      await expect(tabs.length).toBe(1);
    });
    await step('Properties display is rendered', async () => {
      await expect(canvasElement.querySelector('app-properties-display')).not.toBeNull();
    });
  },
};

export const WithSegments: Story = {
  name: 'Shows annotations tab with badge when resource has segments',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: SegmentsService,
          useValue: {
            segments: [
              makeSegment(1, 'Introduction', 0, 30),
              makeSegment(2, 'Main Content', 30, 90),
              makeSegment(3, 'Conclusion', 90, 120),
            ],
            highlightSegment$: new Subject(),
            playSegment: () => {},
          },
        },
      ],
    }),
  ],
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Both properties and annotations tabs are rendered', async () => {
      const tabs = canvasElement.querySelectorAll('.mat-mdc-tab');
      await expect(tabs.length).toBe(2);
    });
    await step('Annotations tab badge shows segment count', async () => {
      const badge = canvasElement.querySelector('.mat-badge-content');
      await expect(badge?.textContent?.trim()).toBe('3');
    });
  },
};
