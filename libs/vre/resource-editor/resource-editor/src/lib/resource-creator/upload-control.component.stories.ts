import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { UploadFileService } from '../representations/upload/upload-file.service';
import { UploadControlComponent } from './upload-control.component';

const meta: Meta<UploadControlComponent> = {
  title: 'Devs / Resource Editor / Resource Creator / Upload Control',
  component: UploadControlComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: UploadFileService, useValue: { upload: () => of({}), getFileInfo: () => of({}) } },
        { provide: NotificationService, useValue: { openSnackBar: () => {} } },
      ],
    }),
    moduleMetadata({ imports: [ReactiveFormsModule] }),
  ],
  argTypes: {
    representation: {
      description: 'File representation type (audio, video, image, etc.).',
      table: { type: { summary: 'FileRepresentationType' }, category: 'State' },
    },
    projectShortcode: {
      description: 'Project shortcode for the upload destination.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<UploadControlComponent>;

const form = new FormGroup({ file: new FormControl<string | null>(null) });

export const DefaultView: Story = {
  name: 'Shows upload area when no file is selected',
  render: () => ({
    props: { form },
    template: `
      <form [formGroup]="form">
        <app-upload-control
          formControlName="file"
          representation="audio"
          projectShortcode="test" />
      </form>
    `,
    imports: [ReactiveFormsModule, UploadControlComponent],
  }),
  play: async ({ canvasElement, step }) => {
    await step('Upload component is rendered', async () => {
      const upload = canvasElement.querySelector('app-upload');
      await expect(upload).not.toBeNull();
    });
  },
};
