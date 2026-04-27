import { FormControl } from '@angular/forms';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { UploadFileService } from '../representations/upload/upload-file.service';
import { CreateResourceFormRepresentationComponent } from './create-resource-form-representation.component';

const meta: Meta<CreateResourceFormRepresentationComponent> = {
  title: 'Devs / Resource Creator / Create Resource Form Representation',
  component: CreateResourceFormRepresentationComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: UploadFileService, useValue: { upload: () => {}, getFileInfo: () => {} } },
        { provide: NotificationService, useValue: { openSnackBar: () => {} } },
      ],
    }),
  ],
  argTypes: {
    control: {
      description: 'FormControl holding the uploaded internal filename.',
      table: { type: { summary: 'FormControl<string | null>' }, category: 'State' },
    },
    projectShortcode: {
      description: 'Project shortcode for the upload destination.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    fileRepresentation: {
      description: 'Representation type (video, audio, document, etc.).',
      table: { type: { summary: 'FileRepresentationType' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<CreateResourceFormRepresentationComponent>;

export const DefaultView: Story = {
  name: 'Shows upload control for the given representation type',
  args: {
    control: new FormControl<string | null>(null),
    projectShortcode: 'test',
    fileRepresentation: 'audio' as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Upload control is rendered', async () => {
      const upload = canvasElement.querySelector('app-upload-control, app-upload, [data-cy="upload-file"]');
      await expect(upload).not.toBeNull();
    });
  },
};
