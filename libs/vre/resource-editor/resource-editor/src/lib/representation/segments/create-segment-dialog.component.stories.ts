import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
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

@Component({
  selector: 'app-create-segment-dialog-launcher',
  template: ``,
})
class CreateSegmentDialogLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);

  ngOnInit() {
    this._dialog.open(CreateSegmentDialogComponent, { data: makeDialogData() });
  }
}

const meta: Meta<CreateSegmentDialogLauncherComponent> = {
  title: 'Resource Editor / 3. Representation / Segments / Create Segment Dialog',
  component: CreateSegmentDialogLauncherComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: SegmentApiService, useValue: { createSegment: () => of({}) } },
        { provide: SegmentsService, useValue: { reload: () => {} } },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<CreateSegmentDialogLauncherComponent>;

export const DefaultView: Story = {
  name: 'Shows create annotation form with label, start and end inputs',
  play: async ({ step }) => {
    await step('Start time input is rendered', async () => {
      const startInput = document.querySelector('[data-cy="start-input"]');
      await expect(startInput).not.toBeNull();
    });
    await step('End time input is rendered', async () => {
      const endInput = document.querySelector('[data-cy="end-input"]');
      await expect(endInput).not.toBeNull();
    });
  },
};

export const SpacesItsFieldsEvenly: Story = {
  name: 'Keeps a gap between every pair of adjacent fields',
  // DEV-7450: Label/Start and Title/Description/Keywords touched here while End/Title stayed
  // spaced, because only some of these controls reserve the subscript below the field.
  play: async ({ step }) => {
    await step('The six annotation fields are rendered', async () => {
      const fields = document.querySelectorAll('.mat-mdc-dialog-content .mat-mdc-text-field-wrapper');
      await expect(fields.length).toBeGreaterThanOrEqual(6);
    });
    await step('No two adjacent fields touch', async () => {
      // Label, Start, End, Title, Description, Keywords — in DOM order. The CKEditor comment that
      // follows them is not a form field, so it is left out.
      const fields = Array.from(document.querySelectorAll('.mat-mdc-dialog-content .mat-mdc-text-field-wrapper')).slice(
        0,
        6
      );

      const gaps = fields
        .slice(1)
        .map((field, index) => field.getBoundingClientRect().top - fields[index].getBoundingClientRect().bottom);

      for (const gap of gaps) {
        await expect(gap).toBeGreaterThanOrEqual(12);
      }
    });
  },
};
