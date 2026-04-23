import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';

import { SegmentsService } from '../../segment-support/segments.service';
import {
  makeResourceFetcherServiceStub,
  makeSegment,
  makeSegmentsServiceStub,
  notificationServiceStub,
  representationServiceStub,
} from '../../stories.helpers';
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

const sampleSegments = [
  makeSegment('Introduction', 0, 10, 0),
  makeSegment('Main content', 15, 45, 0),
  makeSegment('Conclusion', 50, 60, 0),
  makeSegment('Side note', 20, 40, 1),
];

const meta: Meta<VideoComponent> = {
  title: 'Devs / Resource Editor / Representation / Video',
  component: VideoComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(OverlayModule),
        { provide: RepresentationService, useValue: representationServiceStub },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: ResourceFetcherService, useValue: makeResourceFetcherServiceStub({ projectShortcode: '0869' }) },
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
