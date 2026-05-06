import { provideRouter } from '@angular/router';
import { Constants, ReadIntervalValue, ReadResource, ReadTextValueAsString } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource, ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of, Subject } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { Segment } from './segment-support/segment';
import { SegmentsService } from './segment-support/segments.service';
import { SegmentTabComponent } from './segment-tab.component';

const makeParentResource = (): ReadResource =>
  ({
    id: 'http://rdfh.ch/resource/1',
    type: 'http://example.org/Thing',
    label: 'Test Resource',
  }) as any;

const makeSegmentResource = (index: number): DspResource =>
  ({
    res: {
      id: `http://rdfh.ch/resource/segment/${index}`,
      type: 'http://api.knora.org/ontology/knora-api/v2#VideoSegment',
      label: `Segment ${index}`,
      attachedToProject: 'http://rdfh.ch/projects/test',
      attachedToUser: 'http://rdfh.ch/users/test',
      userHasPermission: 'CR',
      creationDate: '2024-06-15T10:00:00.000Z',
      properties: {},
      entityInfo: { classes: {} },
    },
    resProps: [],
    incomingAnnotations: [],
  }) as unknown as DspResource;

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
  provideRouter([{ path: '**', redirectTo: '' }]),
  {
    provide: AppConfigService,
    useValue: { dspApiConfig: { apiUrl: '' }, dspAppConfig: { iriBase: 'http://rdfh.ch' } },
  },
  {
    provide: ResourceService,
    useValue: {
      getResourcePath: (iri: string) => iri,
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
    useValue: { attachedUser$: of({ givenName: 'Jane', familyName: 'Doe' }) },
  },
];

const meta: Meta<SegmentTabComponent> = {
  title: 'Resource Editor / 4. Properties / Resource Media Tabs / Segment Tab',
  component: SegmentTabComponent,
  argTypes: {
    resource: {
      description: 'The parent resource whose segments are listed.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<SegmentTabComponent>;

export const NoSegments: Story = {
  name: 'Shows empty segment tab when resource has no segments',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: SegmentsService,
          useValue: {
            segments: [],
            highlightSegment$: new Subject(),
          },
        },
      ],
    }),
  ],
  args: { resource: makeParentResource() },
  play: async ({ canvasElement, step }) => {
    await step('Accordion container is rendered', async () => {
      const accordion = canvasElement.querySelector('mat-accordion');
      await expect(accordion).not.toBeNull();
    });
    await step('No segment panels are rendered', async () => {
      const panels = canvasElement.querySelectorAll('[data-cy="segment-border"]');
      await expect(panels.length).toBe(0);
    });
  },
};

export const WithSegments: Story = {
  name: 'Shows segment panels when resource has segments',
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
  args: { resource: makeParentResource() },
  play: async ({ canvasElement, step }) => {
    await step('Three segment panels are rendered', async () => {
      const panels = canvasElement.querySelectorAll('[data-cy="segment-border"]');
      await expect(panels.length).toBe(3);
    });
    await step('First segment label is displayed', async () => {
      const labels = canvasElement.querySelectorAll('.label');
      await expect(labels[0].textContent?.trim()).toBe('Introduction');
    });
  },
};
