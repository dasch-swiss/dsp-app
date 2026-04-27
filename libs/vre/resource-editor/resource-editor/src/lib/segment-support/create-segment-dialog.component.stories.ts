import { DialogRef } from '@angular/cdk/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { CreateSegmentDialogComponent } from './create-segment-dialog.component';
import { SegmentApiService } from './segment-api.service';
import { SegmentsService } from './segments.service';

const makeDialogData = () => ({
  resource: {
    id: 'http://rdfh.ch/resource/1',
    type: 'http://example.org/Thing',
    attachedToProject: 'http://rdfh.ch/projects/test',
  },
  videoDurationSecs: 300,
  type: 'VideoSegment',
  projectShortcode: 'test',
});

const meta: Meta<CreateSegmentDialogComponent> = {
  title: 'Devs / Resource Editor / Representation / Segments / Create Segment Dialog',
  component: CreateSegmentDialogComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: makeDialogData() },
        { provide: DialogRef, useValue: { close: () => {} } },
        { provide: SegmentApiService, useValue: { createSegment: () => of({}) } },
        { provide: SegmentsService, useValue: { reload: () => {} } },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<CreateSegmentDialogComponent>;

export const DefaultView: Story = {
  name: 'Shows create annotation form with label, start and end inputs',
  play: async ({ canvasElement, step }) => {
    await step('Start time input is rendered', async () => {
      const startInput = canvasElement.querySelector('[data-cy="start-input"]');
      await expect(startInput).not.toBeNull();
    });
    await step('End time input is rendered', async () => {
      const endInput = canvasElement.querySelector('[data-cy="end-input"]');
      await expect(endInput).not.toBeNull();
    });
  },
};
