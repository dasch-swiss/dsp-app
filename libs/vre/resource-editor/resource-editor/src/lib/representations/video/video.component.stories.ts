import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { ReadIntervalValue } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { of, Subject } from 'rxjs';
import { expect, within } from 'storybook/test';

import { Segment } from '../../segment-support/segment';
import { SegmentsService } from '../../segment-support/segments.service';
import { FileRepresentationInput, ParentResourceInput } from '../representation-inputs';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { VideoComponent } from './video.component';

const makeSrc = (fileUrl = 'https://example.org/video.mp4'): FileRepresentationInput => ({
  fileUrl,
  userHasPermission: 'RV',
  filename: 'video.mp4',
});

const makeParentResource = (): ParentResourceInput => ({
  id: 'http://rdfh.ch/resource/1',
  properties: {},
  attachedToProject: 'http://rdfh.ch/project/1',
  type: 'http://api.dasch.swiss/ontology/knora-api/v2#MovingImageRepresentation',
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
  makeSegment('Introduction', 0, 10, 0),
  makeSegment('Main content', 15, 45, 0),
  makeSegment('Conclusion', 50, 60, 0),
  makeSegment('Side note', 20, 40, 1),
];

const makeSegmentsServiceStub = (segments: Segment[] = []): Partial<SegmentsService> => ({
  segments,
  onInit: () => {},
  playSegment$: new Subject<any>().asObservable(),
  highlightSegment$: new Subject<any>().asObservable(),
});

const minimalFileInfo = {
  '@context': '',
  checksumDerivative: '',
  checksumOriginal: '',
  duration: 0,
  fileSize: 0,
  fps: 0,
  height: 0,
  id: '',
  internalMimeType: 'video/mp4',
  originalFilename: 'video.mp4',
  width: 0,
};

const representationServiceStub: Partial<RepresentationService> = {
  getFileInfo: () => of(minimalFileInfo),
};

const notificationServiceStub: Partial<NotificationService> = {
  openSnackBar: () => {},
};

const resourceFetcherServiceStub: Partial<ResourceFetcherService> = {
  userCanEdit$: of(false),
  projectShortcode$: of('0869'),
};

const meta: Meta<VideoComponent> = {
  title: 'Devs / Resource Editor / Representation / Video',
  component: VideoComponent,
  decorators: [
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
      description: 'The DSP-JS file value containing the video URL.',
      table: { type: { summary: 'ReadMovingImageFileValue' }, category: 'State' },
    },
    parentResource: {
      description: 'The parent resource the video belongs to. Used to load associated video segments.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
    loaded: {
      description: 'Emitted once the video player is ready to play.',
      table: { category: 'Events', type: { summary: 'EventEmitter<boolean>' } },
    },
  },
};
export default meta;
type Story = StoryObj<VideoComponent>;

const STAGE_VIDEO_URL = 'https://iiif.stage.dasch.swiss:443/0869/3xUzuLcE9nC-MjBgXRjjsos.mp4/file';

export const WithLiveVideo: Story = {
  name: 'Plays a real video from the DSP stage server',
  args: {
    src: makeSrc(STAGE_VIDEO_URL),
    parentResource: makeParentResource(),
  },
};

export const WithAnnotations: Story = {
  name: 'Shows video with segment annotations on the timeline',
  decorators: [
    moduleMetadata({
      providers: [{ provide: SegmentsService, useFactory: () => makeSegmentsServiceStub(sampleSegments) }],
    }),
  ],
  args: {
    src: makeSrc(STAGE_VIDEO_URL),
    parentResource: makeParentResource(),
  },
};

export const Loading: Story = {
  name: 'Shows video element once src is set',
  args: {
    src: makeSrc(),
    parentResource: makeParentResource(),
  },
  play: async ({ canvasElement, step }) => {
    await step('Video element is rendered', async () => {
      const video = canvasElement.querySelector('video');
      await expect(video).not.toBeNull();
    });
  },
};
