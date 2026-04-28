import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { MediaPlayerService } from './media-player.service';
import { VideoOverlayComponent } from './video-overlay.component';

const makeMediaPlayerStub = (overrides: Partial<MediaPlayerService> = {}): Partial<MediaPlayerService> => ({
  togglePlay: () => {},
  navigate: () => {},
  ...overrides,
});

const meta: Meta<VideoOverlayComponent> = {
  title: 'Resource Editor / Resource / Video / Video Overlay',
  component: VideoOverlayComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(OverlayModule), { provide: MediaPlayerService, useValue: makeMediaPlayerStub() }],
    }),
  ],
};
export default meta;
type Story = StoryObj<VideoOverlayComponent>;

export const DefaultView: Story = {
  name: 'Shows play, rewind and fast-forward buttons',
  play: async ({ canvasElement, step }) => {
    await step('Three icon buttons are rendered', async () => {
      const icons = canvasElement.querySelectorAll('mat-icon');
      await expect(icons.length).toBe(3);
    });
    await step('Rewind 10s icon is present', async () => {
      const icons = Array.from(canvasElement.querySelectorAll('mat-icon'));
      await expect(icons.some(i => i.textContent?.trim() === 'replay_10')).toBe(true);
    });
    await step('Fast forward 10s icon is present', async () => {
      const icons = Array.from(canvasElement.querySelectorAll('mat-icon'));
      await expect(icons.some(i => i.textContent?.trim() === 'forward_10')).toBe(true);
    });
  },
};
