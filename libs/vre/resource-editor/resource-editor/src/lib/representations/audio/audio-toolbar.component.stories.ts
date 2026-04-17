import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { FileRepresentationInput, ParentResourceInput } from '../representation-inputs';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { AudioToolbarComponent } from './audio-toolbar.component';
import { MediaPlayerService } from './media-player.service';

const makeParentResource = (): ParentResourceInput => ({
  id: 'http://rdfh.ch/resource/1',
  properties: {},
  attachedToProject: 'http://rdfh.ch/project/1',
  type: 'http://api.dasch.swiss/ontology/knora-api/v2#AudioRepresentation',
});

const makeMediaPlayerStub = (overrides: Partial<MediaPlayerService> = {}): Partial<MediaPlayerService> => ({
  isPaused: () => true,
  isMuted: () => false,
  currentTime: () => 0,
  duration: () => 120,
  togglePlay: () => {},
  toggleMute: () => {},
  navigateToStart: () => {},
  navigate: () => {},
  ...overrides,
});

const notificationServiceStub: Partial<NotificationService> = {
  openSnackBar: () => {},
};

const representationServiceStub: Partial<RepresentationService> = {
  downloadProjectFile: () => {},
};

const resourceFetcherServiceStub: Partial<ResourceFetcherService> = {
  userCanEdit$: of(false),
  projectShortcode$: of('0001'),
};

const meta: Meta<AudioToolbarComponent> = {
  title: 'Devs / Resource Editor / Representation / Audio Toolbar',
  component: AudioToolbarComponent,
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
    parentResource: {
      description: 'The parent resource the audio belongs to.',
      table: { type: { summary: 'ParentResourceInput' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<AudioToolbarComponent>;

export const DefaultView: Story = {
  name: 'Shows play button and volume control when audio is paused',
  args: {
    parentResource: makeParentResource(),
  },
  play: async ({ canvasElement, step }) => {
    await step('Play button shows play_arrow icon when paused', async () => {
      const playButton = canvasElement.querySelector('[data-cy="play-pause-button"] mat-icon');
      await expect(playButton?.textContent?.trim()).toBe('play_arrow');
    });
    await step('Volume button is rendered', async () => {
      const volumeButton = canvasElement.querySelector('[data-cy="volume-button"]');
      await expect(volumeButton).not.toBeNull();
    });
    await step('Go-to-start button is rendered', async () => {
      const startButton = canvasElement.querySelector('[data-cy="go-to-start-button"]');
      await expect(startButton).not.toBeNull();
    });
  },
};

export const WhilePlaying: Story = {
  name: 'Shows pause icon when audio is playing',
  decorators: [
    applicationConfig({
      providers: [
        { provide: MediaPlayerService, useValue: makeMediaPlayerStub({ isPaused: () => false }) },
      ],
    }),
  ],
  args: {
    parentResource: makeParentResource(),
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
    parentResource: makeParentResource(),
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
    parentResource: makeParentResource(),
  },
  play: async ({ canvasElement, step }) => {
    await step('Timeline/annotation button is not rendered for read-only users', async () => {
      const timelineButton = canvasElement.querySelector('[data-cy="timeline-button"]');
      await expect(timelineButton).toBeNull();
    });
  },
};
