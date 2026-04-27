import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { SegmentsService } from './segment-support/segments.service';
import { SegmentTabComponent } from './segment-tab.component';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/1',
    type: 'http://example.org/Thing',
    label: 'Test Resource',
  }) as any;

const meta: Meta<SegmentTabComponent> = {
  title: 'Visual / Resource Editor / Resource / Segment Tab',
  component: SegmentTabComponent,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: SegmentsService,
          useValue: {
            segments: [],
            highlightSegment$: { subscribe: () => ({ unsubscribe: () => {} }) },
            highlightSegment: () => {},
          },
        },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The parent resource whose segments are listed.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<SegmentTabComponent>;

export const NoSegments: Story = {
  name: 'Shows empty segment tab when resource has no segments',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Accordion container is rendered', async () => {
      const accordion = canvasElement.querySelector('mat-accordion');
      await expect(accordion).not.toBeNull();
    });
    await step('No segment panels are rendered', async () => {
      const panels = canvasElement.querySelectorAll('[data-cy="segment-border"]');
      await expect(panels.length).toBe(0);
    });
  },
};
