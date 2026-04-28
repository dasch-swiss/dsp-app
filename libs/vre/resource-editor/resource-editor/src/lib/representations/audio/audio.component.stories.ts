import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { Constants, ReadIntervalValue } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { of, Subject } from 'rxjs';
import { expect } from 'storybook/test';

import { Segment } from '../../segment-support/segment';
import { SegmentsService } from '../../segment-support/segments.service';
import { FileRepresentationInput, ParentResourceInput } from '../representation-inputs';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { AudioComponent } from './audio.component';

const PUBLIC_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const makeSrc = (fileUrl = PUBLIC_AUDIO_URL): FileRepresentationInput => ({
  fileUrl,
  userHasPermission: 'RV',
  filename: 'audio.mp3',
});

const makeParentResource = (fileUrl = PUBLIC_AUDIO_URL): ParentResourceInput => ({
  id: 'http://rdfh.ch/resource/1',
  properties: {
    [Constants.HasAudioFileValue]: [{ fileUrl, userHasPermission: 'RV' } as any],
  },
  attachedToProject: 'http://rdfh.ch/project/1',
  type: 'http://api.dasch.swiss/ontology/knora-api/v2#AudioRepresentation',
});

const makeSegment = (label: string, start: number, end: number, row: number): Segment =>
  ({
    label,
    row,
    hasSegmentBounds: { start, end } as unknown as ReadIntervalValue,
    hasVideoSegmentOfValue: undefined,
    hasComment: undefined,
    hasDescription: undefined,
    hasKeyword: undefined,
    hasTitle: undefined,
    resource: {} as any,
  }) as Segment;

const sampleSegments: Segment[] = [
  makeSegment('Intro', 0, 15, 0),
  makeSegment('Verse 1', 20, 60, 0),
  makeSegment('Chorus', 65, 90, 0),
  makeSegment('Bridge', 30, 70, 1),
];

const makeSegmentsServiceStub = (segments: Segment[] = []): Partial<SegmentsService> => ({
  segments,
  onInit: () => {},
  playSegment$: new Subject<any>().asObservable(),
  highlightSegment$: new Subject<any>().asObservable(),
});

const representationServiceStub: Partial<RepresentationService> = {
  getFileInfo: () => of({ originalFilename: 'audio.mp3' }),
};

const notificationServiceStub: Partial<NotificationService> = {
  openSnackBar: () => {},
};

const resourceFetcherServiceStub: Partial<ResourceFetcherService> = {
  userCanEdit$: of(false),
  projectShortcode$: of('0001'),
};

const meta: Meta<AudioComponent> = {
  title: 'Resource Editor / 3. Representation / Audio / Audio',
  component: AudioComponent,
  decorators: [
    story => {
      const s = story();
      return {
        ...s,
        template: `<div style="height: 400px; background-color: black">${s.template ?? '<app-audio [src]="src" [parentResource]="parentResource" />'}</div>`,
      };
    },
    applicationConfig({
      providers: [
        importProvidersFrom(OverlayModule),
        { provide: RepresentationService, useValue: representationServiceStub },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceStub },
      ],
    }),
    moduleMetadata({
      providers: [{ provide: SegmentsService, useFactory: () => makeSegmentsServiceStub() }],
    }),
  ],
  argTypes: {
    src: {
      description: 'File value containing the audio URL.',
      table: { type: { summary: 'FileRepresentationInput' }, category: 'State' },
    },
    parentResource: {
      description: 'The parent resource the audio belongs to. Used to load associated segments.',
      table: { type: { summary: 'ParentResourceInput' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<AudioComponent>;

export const WithLiveAudio: Story = {
  name: 'Plays a real audio file from a public source',
  args: {
    src: makeSrc(),
    parentResource: makeParentResource(),
  },
};

export const WithAnnotations: Story = {
  name: 'Shows audio with segment annotations on the timeline',
  decorators: [
    moduleMetadata({
      providers: [{ provide: SegmentsService, useFactory: () => makeSegmentsServiceStub(sampleSegments) }],
    }),
  ],
  args: {
    src: makeSrc(),
    parentResource: makeParentResource(),
  },
};

export const Loading: Story = {
  name: 'Shows audio icon while player is loading',
  args: {
    src: makeSrc('https://example.org/audio.mp3'),
    parentResource: makeParentResource(),
  },
  play: async ({ canvasElement, step }) => {
    await step('Audio icon is visible before player is ready', async () => {
      const icon = canvasElement.querySelector('mat-icon');
      await expect(icon).not.toBeNull();
    });
  },
};

export const WithError: Story = {
  name: 'Shows error message when audio fails to load',
  render: args => ({
    props: { ...args, failedToLoad: true },
  }),
  args: {
    src: makeSrc(),
    parentResource: makeParentResource(),
  },
  play: async ({ canvasElement, step }) => {
    await step('Error message component is rendered', async () => {
      const errMsg = canvasElement.querySelector('app-representation-error-message');
      await expect(errMsg).not.toBeNull();
    });
  },
};
