import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { MediaSliderComponent } from './media-slider.component';

const meta: Meta<MediaSliderComponent> = {
  title: 'Devs / Resource Editor / 3. Representation / Media Slider',
  component: MediaSliderComponent,
  argTypes: {
    max: {
      description: 'Total duration in seconds (slider maximum).',
      table: { type: { summary: 'number' }, category: 'State' },
    },
    currentTime: {
      description: 'Current playback position in seconds.',
      table: { type: { summary: 'number' }, category: 'State' },
    },
    afterNavigation: {
      description: 'Emitted with the new time when the user moves the slider.',
      table: { type: { summary: 'EventEmitter<number>' }, category: 'Events' },
    },
  },
};
export default meta;
type Story = StoryObj<MediaSliderComponent>;

export const DefaultView: Story = {
  name: 'Shows playback slider with current position',
  args: {
    max: 300,
    currentTime: 60,
  },
  play: async ({ canvasElement, step }) => {
    await step('Slider element is rendered', async () => {
      const slider = canvasElement.querySelector('mat-slider');
      await expect(slider).not.toBeNull();
    });
  },
};
