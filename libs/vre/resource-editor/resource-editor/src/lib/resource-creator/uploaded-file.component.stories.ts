import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { UploadFileService } from '../representation/upload/upload-file.service';
import { UploadedFileComponent } from './uploaded-file.component';

const meta: Meta<UploadedFileComponent> = {
  title: 'Resource Creator / 1. File Upload / Uploaded File',
  component: UploadedFileComponent,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: UploadFileService,
          useValue: {
            getFileInfo: () => of({ originalFilename: 'photo.jpg', fileSize: 204800, internalMimeType: 'image/jpeg' }),
          },
        },
      ],
    }),
  ],
  argTypes: {
    internalFilename: {
      description: 'Internal asset filename (used to fetch file info).',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    projectShortcode: {
      description: 'Project shortcode used when fetching file info.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    removeFile: {
      description: 'Emitted when the user clicks the remove button.',
      table: { type: { summary: 'EventEmitter<void>' }, category: 'Events' },
    },
  },
};
export default meta;
type Story = StoryObj<UploadedFileComponent>;

export const DefaultView: Story = {
  name: 'Shows uploaded file card with filename and remove button',
  args: {
    internalFilename: 'abc123.jpg',
    projectShortcode: 'test',
  },
  play: async ({ canvasElement, step }) => {
    await step('Filename is displayed', async () => {
      await expect(canvasElement.textContent).toContain('photo.jpg');
    });
    await step('Remove button icon is rendered', async () => {
      const icons = canvasElement.querySelectorAll('mat-icon');
      const cancelIcon = Array.from(icons).find(i => i.textContent?.trim() === 'cancel');
      await expect(cancelIcon).not.toBeUndefined();
    });
  },
};
