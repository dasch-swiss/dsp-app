import { FormControl } from '@angular/forms';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { UploadFileService } from '../representations/upload/upload-file.service';
import { notificationServiceStub } from '../stories.helpers';
import { CreateResourceFormImageComponent } from './create-resource-form-image.component';

const meta: Meta<CreateResourceFormImageComponent> = {
  title: 'Devs / Resource Editor / Resource Creator / Create Resource Form Image',
  component: CreateResourceFormImageComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: UploadFileService, useValue: { upload: () => {}, getFileInfo: () => {} } },
        { provide: NotificationService, useValue: notificationServiceStub },
      ],
    }),
  ],
  argTypes: {
    control: {
      description: 'FormControl holding the uploaded internal filename.',
      table: { type: { summary: 'FormControl<string | null>' }, category: 'State' },
    },
    projectShortcode: {
      description: 'Project shortcode for upload destination.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    fileRepresentation: {
      description: 'File representation type (still image or external image).',
      table: { type: { summary: 'FileRepresentationType' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<CreateResourceFormImageComponent>;

export const DefaultView: Story = {
  name: 'Shows image source selector with upload and external options',
  args: {
    control: new FormControl<string | null>(null),
    projectShortcode: 'test',
    fileRepresentation: 'stillImage' as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Image source selector is rendered', async () => {
      const selector = canvasElement.querySelector('[data-cy="image-source-selector"]');
      await expect(selector).not.toBeNull();
    });
  },
};
