import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { ReadIntervalValue } from '@dasch-swiss/dsp-js';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { MediaControlService } from './media-control.service';
import { Segment } from './segment';
import { SegmentsDisplayComponent } from './segments-display.component';
import { SegmentsService } from './segments.service';

const makeInterval = (start: number, end: number): ReadIntervalValue =>
  ({ start, end }) as unknown as ReadIntervalValue;

const makeSegment = (label: string, start: number, end: number, row: number): Segment =>
  ({
    label,
    row,
    hasSegmentBounds: makeInterval(start, end),
    hasSegmentOfValue: undefined,
    hasComment: undefined,
    hasDescription: undefined,
    hasKeyword: undefined,
    hasTitle: undefined,
    resource: {} as any,
  }) as Segment;

const meta: Meta<SegmentsDisplayComponent> = {
  title: 'Resource Editor / 3. Representation / Segments / Segments display',
  component: SegmentsDisplayComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(OverlayModule),
        MediaControlService,
        { provide: SegmentsService, useValue: { highlightSegment: () => {} } },
      ],
    }),
  ],
  argTypes: {
    segments: {
      description: 'Array of ordered segments to display as coloured bars on the timeline.',
      table: { type: { summary: 'Segment[]' }, category: 'State' },
    },
    videoLengthSecs: {
      description: 'Total duration of the video in seconds. Used to compute each segments relative width and position.',
      control: 'number',
      table: { type: { summary: 'number' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<SegmentsDisplayComponent>;

export const SingleRow: Story = {
  name: 'Shows non-overlapping segments on a single row',
  args: {
    videoLengthSecs: 60,
    segments: [makeSegment('Intro', 0, 10, 0), makeSegment('Main', 15, 40, 0), makeSegment('Outro', 45, 60, 0)],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Three segment bars are rendered', async () => {
      const segments = canvasElement.querySelectorAll('.segment');
      await expect(segments.length).toBe(3);
    });
  },
};

export const MultipleRows: Story = {
  name: 'Distributes overlapping segments across multiple rows',
  args: {
    videoLengthSecs: 60,
    segments: [makeSegment('A', 0, 30, 0), makeSegment('B', 10, 50, 1), makeSegment('C', 40, 60, 1)],
  },
  play: async ({ canvasElement, step }) => {
    await step('Segment bars are rendered', async () => {
      const segments = canvasElement.querySelectorAll('.segment');
      await expect(segments.length).toBe(3);
    });
  },
};

export const NoSegments: Story = {
  name: 'Shows black bar with no segments when list is empty',
  args: {
    videoLengthSecs: 60,
    segments: [],
  },
  play: async ({ canvasElement, step }) => {
    await step('No segment bars are rendered', async () => {
      const segments = canvasElement.querySelectorAll('.segment');
      await expect(segments.length).toBe(0);
    });
  },
};
