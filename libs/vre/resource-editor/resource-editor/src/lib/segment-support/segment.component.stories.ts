import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { MediaControlService } from './media-control.service';
import { SegmentComponent } from './segment.component';
import { SegmentsService } from './segments.service';

const makeSegment = () => ({
  id: 'http://rdfh.ch/segment/1',
  label: 'Intro',
  hasSegmentBounds: { start: 10, end: 40 },
});

const meta: Meta<SegmentComponent> = {
  title: 'Devs / Resource Editor / Representation / Segments / Segment',
  component: SegmentComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: MediaControlService, useValue: { playMedia: () => {} } },
        { provide: SegmentsService, useValue: { highlightSegment: () => {} } },
      ],
    }),
  ],
  argTypes: {
    segment: {
      description: 'The segment data including label and time bounds.',
      table: { type: { summary: 'Segment' }, category: 'State' },
    },
    videoLengthSecs: {
      description: 'Total video duration in seconds, used to calculate segment width and position.',
      table: { type: { summary: 'number' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<SegmentComponent>;

export const DefaultView: Story = {
  name: 'Shows segment bar positioned on the timeline',
  args: {
    segment: makeSegment() as any,
    videoLengthSecs: 120,
  },
  play: async ({ canvasElement, step }) => {
    await step('Segment element is rendered', async () => {
      const segment = canvasElement.querySelector('.segment');
      await expect(segment).not.toBeNull();
    });
  },
};
