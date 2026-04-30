import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { UploadFileService } from '../representations/upload/upload-file.service';
import { notificationServiceStub } from '../stories.helpers';
import { UploadComponent } from './upload.component';

const meta: Meta<UploadComponent> = {
  title: 'Resource Creator / 1. File Upload / Upload',
  component: UploadComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: UploadFileService, useValue: { upload: () => {} } },
        { provide: NotificationService, useValue: notificationServiceStub },
      ],
    }),
  ],
  argTypes: {
    representation: {
      description: 'The type of file representation expected (image, video, audio, etc.).',
      table: { type: { summary: 'FileRepresentationType' }, category: 'State' },
    },
    projectShortcode: {
      description: 'Project shortcode for upload destination.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    afterFileUploaded: {
      description: 'Emitted with the uploaded file response after successful upload.',
      table: { type: { summary: 'EventEmitter<UploadedFileResponse>' }, category: 'Events' },
    },
  },
};
export default meta;
type Story = StoryObj<UploadComponent>;

export const DefaultView: Story = {
  name: 'Shows drag and drop upload zone',
  args: {
    representation: 'stillImage' as any,
    projectShortcode: 'test',
  },
  play: async ({ canvasElement, step }) => {
    await step('Upload file input is rendered', async () => {
      const input = canvasElement.querySelector('[data-cy="upload-file"]');
      await expect(input).not.toBeNull();
    });
    await step('Upload icon is displayed', async () => {
      const icon = canvasElement.querySelector('mat-icon');
      await expect(icon?.textContent?.trim()).toBe('cloud_upload');
    });
  },
};
