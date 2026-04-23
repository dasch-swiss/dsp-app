import { Clipboard } from '@angular/cdk/clipboard';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { DownloadMenuItemComponent } from './download-menu-item.component';
import { RepresentationService } from './representation.service';
import { notificationServiceStub } from '../stories.helpers';

const makeSrc = () => ({
  fileUrl: 'https://example.org/file.mp4',
  userHasPermission: 'RV',
  filename: 'file.mp4',
});

const makeParentResource = () => ({
  id: 'http://rdfh.ch/resource/1',
  type: 'http://example.org/Thing',
  attachedToProject: 'http://rdfh.ch/projects/test',
});

const meta: Meta<DownloadMenuItemComponent> = {
  title: 'Devs / Resource Editor / Representation / Download Menu Item',
  component: DownloadMenuItemComponent,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: RepresentationService,
          useValue: { downloadProjectFile: () => {}, getIngestOriginalUrl: () => of('https://example.org/file.mp4') },
        },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: Clipboard, useValue: { copy: () => true } },
      ],
    }),
  ],
  argTypes: {
    src: {
      description: 'File representation including URL and user permissions.',
      table: { type: { summary: 'FileRepresentationInput' }, category: 'State' },
    },
    parentResource: {
      description: 'Parent resource the file belongs to.',
      table: { type: { summary: 'ParentResourceInput' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<DownloadMenuItemComponent>;

export const DefaultView: Story = {
  name: 'Shows download and copy link buttons',
  args: {
    src: makeSrc() as any,
    parentResource: makeParentResource() as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Download button is rendered', async () => {
      const buttons = canvasElement.querySelectorAll('button');
      const downloadBtn = Array.from(buttons).find(b => b.textContent?.includes('download'));
      await expect(downloadBtn).not.toBeUndefined();
    });
    await step('Copy link button is rendered', async () => {
      const buttons = canvasElement.querySelectorAll('button');
      const copyBtn = Array.from(buttons).find(b => b.textContent?.includes('link'));
      await expect(copyBtn).not.toBeUndefined();
    });
  },
};
