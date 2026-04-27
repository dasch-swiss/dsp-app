import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { SegmentTooltipComponent } from './segment-tooltip.component';
import { SegmentsService } from './segments.service';

const makeSegment = () => ({
  id: 'http://rdfh.ch/segment/1',
  label: 'Intro',
  hasSegmentBounds: { start: 0, end: 30 },
});

const meta: Meta<SegmentTooltipComponent> = {
  title: 'Devs / Resource Editor / Representation / Segments / Segment Tooltip',
  component: SegmentTooltipComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: SegmentsService, useValue: { highlightSegment: () => {} } }],
    }),
  ],
};
export default meta;
type Story = StoryObj<SegmentTooltipComponent>;

export const DefaultView: Story = {
  name: 'Shows segment label and navigate-down button in tooltip',
  render: () => ({
    props: {},
    template: `<app-segment-tooltip></app-segment-tooltip>`,
    moduleMetadata: {},
  }),
  play: async ({ canvasElement, step }) => {
    await step('Arrow downward icon button is rendered', async () => {
      const icon = canvasElement.querySelector('mat-icon');
      await expect(icon?.textContent?.trim()).toBe('arrow_downward');
    });
  },
};
