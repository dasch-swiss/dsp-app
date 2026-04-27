import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';

import { MovingImageSidecar } from '../moving-image-sidecar';
import { FileRepresentationInput, ParentResourceInput } from '../representation-inputs';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { MediaPlayerService } from './media-player.service';
import { VideoToolbarComponent } from './video-toolbar.component';

const makeSrc = (): FileRepresentationInput => ({
  fileUrl: 'https://example.org/video.mp4',
  userHasPermission: 'RV',
  filename: 'video.mp4',
});

const makeParentResource = (): ParentResourceInput => ({
  id: 'http://rdfh.ch/resource/1',
  properties: {},
  attachedToProject: 'http://rdfh.ch/project/1',
  type: 'http://api.dasch.swiss/ontology/knora-api/v2#MovingImageRepresentation',
});

const makeFileInfo = (): MovingImageSidecar => ({
  '@context': '',
  checksumDerivative: '',
  checksumOriginal: '',
  duration: 300,
  fileSize: 0,
  fps: 25,
  height: 720,
  id: '',
  internalMimeType: 'video/mp4',
  originalFilename: 'video.mp4',
  width: 1280,
});

const makeMediaPlayerStub = (overrides: Partial<MediaPlayerService> = {}): Partial<MediaPlayerService> => ({
  isPaused: () => true,
  currentTime: () => 0,
  duration: () => 300,
  togglePlay: () => {},
  navigate: () => {},
  ...overrides,
});

const notificationServiceStub: Partial<NotificationService> = {
  openSnackBar: () => {},
};

const representationServiceStub: Partial<RepresentationService> = {
  getFileInfo: () => of({ originalFilename: 'video.mp4' }),
  downloadProjectFile: () => {},
};

const resourceFetcherServiceStub: Partial<ResourceFetcherService> = {
  userCanEdit$: of(false),
  projectShortcode$: of('0001'),
};

const meta: Meta<VideoToolbarComponent> = {
  title: 'Devs / Resource Editor / 3. Representation / Video / Video Toolbar',
  component: VideoToolbarComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(OverlayModule),
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: RepresentationService, useValue: representationServiceStub },
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceStub },
        { provide: MediaPlayerService, useValue: makeMediaPlayerStub() },
      ],
    }),
  ],
  argTypes: {
    src: {
      description: 'File value containing the video URL and user permissions.',
      table: { type: { summary: 'FileRepresentationInput' }, category: 'State' },
    },
    parentResource: {
      description: 'The parent resource the video belongs to.',
      table: { type: { summary: 'ParentResourceInput' }, category: 'State' },
    },
    fileInfo: {
      description: 'Sidecar metadata: duration, fps, dimensions.',
      table: { type: { summary: 'MovingImageSidecar' }, category: 'State' },
    },
    toggleCinemaMode: {
      description: 'Emitted when the cinema/fullscreen button is clicked.',
      table: { category: 'Events', type: { summary: 'EventEmitter<void>' } },
    },
  },
};
export default meta;
type Story = StoryObj<VideoToolbarComponent>;

export const DefaultView: Story = {
  name: 'Shows play button and time display when video is paused',
  args: {
    src: makeSrc(),
    parentResource: makeParentResource(),
    fileInfo: makeFileInfo(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Play button shows play_arrow icon when paused', async () => {
      const playButton = canvasElement.querySelector('[data-cy="play-pause-button"] mat-icon');
      await expect(playButton?.textContent?.trim()).toBe('play_arrow');
    });
    await step('Time display is rendered', async () => {
      const timeDisplay = canvasElement.querySelector('[data-cy="player-time"]');
      await expect(timeDisplay).not.toBeNull();
    });
    await step('Cinema mode button is present', async () => {
      const cinemaButton = canvasElement.querySelector('[data-cy="cinema-mode-button"]');
      await expect(cinemaButton).not.toBeNull();
    });
  },
};

export const WhilePlaying: Story = {
  name: 'Shows pause icon when video is playing',
  decorators: [
    applicationConfig({
      providers: [{ provide: MediaPlayerService, useValue: makeMediaPlayerStub({ isPaused: () => false }) }],
    }),
  ],
  args: {
    src: makeSrc(),
    parentResource: makeParentResource(),
    fileInfo: makeFileInfo(),
  },
  play: async ({ canvasElement, step }) => {
    await step('Play button shows pause icon while playing', async () => {
      const playButton = canvasElement.querySelector('[data-cy="play-pause-button"] mat-icon');
      await expect(playButton?.textContent?.trim()).toBe('pause');
    });
  },
};

export const WithEditPermission: Story = {
  name: 'Shows create annotation button when user can edit',
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: ResourceFetcherService,
          useValue: { ...resourceFetcherServiceStub, userCanEdit$: of(true) },
        },
        { provide: MediaPlayerService, useValue: makeMediaPlayerStub() },
      ],
    }),
  ],
  args: {
    src: makeSrc(),
    parentResource: makeParentResource(),
    fileInfo: makeFileInfo(),
  },
  play: async ({ canvasElement, step }) => {
    await step('Timeline/annotation button is visible for editors', async () => {
      const timelineButton = canvasElement.querySelector('[data-cy="timeline-button"]');
      await expect(timelineButton).not.toBeNull();
    });
  },
};

export const WithoutEditPermission: Story = {
  name: 'Hides create annotation button for read-only users',
  args: {
    src: makeSrc(),
    parentResource: makeParentResource(),
    fileInfo: makeFileInfo(),
  },
  play: async ({ canvasElement, step }) => {
    await step('Timeline/annotation button is not rendered for read-only users', async () => {
      const timelineButton = canvasElement.querySelector('[data-cy="timeline-button"]');
      await expect(timelineButton).toBeNull();
    });
  },
};
