import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { VideoMoreButtonComponent } from './video-more-button.component';

const makeSrc = () => ({
  fileUrl: 'https://example.org/video.mp4',
  userHasPermission: 'RV',
  filename: 'video.mp4',
});

const makeParentResource = () => ({
  id: 'http://rdfh.ch/resource/1',
  type: 'http://example.org/Thing',
  attachedToProject: 'http://rdfh.ch/projects/test',
});

const makeFileInfo = () => ({
  duration: 300,
  fps: 25,
  width: 1280,
  height: 720,
  internalMimeType: 'video/mp4',
  originalFilename: 'video.mp4',
});

const meta: Meta<VideoMoreButtonComponent> = {
  title: 'Devs / Resource Editor / Representation / Video More Button',
  component: VideoMoreButtonComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: ResourceFetcherService, useValue: { userCanEdit$: of(false) } },
        { provide: RepresentationService, useValue: { downloadProjectFile: () => {} } },
        { provide: NotificationService, useValue: { openSnackBar: () => {} } },
      ],
    }),
  ],
  argTypes: {
    src: {
      description: 'File representation containing the video URL and user permissions.',
      table: { type: { summary: 'FileRepresentationInput' }, category: 'State' },
    },
    parentResource: {
      description: 'Parent resource the video belongs to.',
      table: { type: { summary: 'ParentResourceInput' }, category: 'State' },
    },
    fileInfo: {
      description: 'Video sidecar metadata.',
      table: { type: { summary: 'MovingImageSidecar' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<VideoMoreButtonComponent>;

export const DefaultView: Story = {
  name: 'Shows more_vert icon button for video actions menu',
  args: {
    src: makeSrc() as any,
    parentResource: makeParentResource() as any,
    fileInfo: makeFileInfo() as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('More button icon is rendered', async () => {
      const icon = canvasElement.querySelector('mat-icon');
      await expect(icon?.textContent?.trim()).toBe('more_vert');
    });
  },
};
