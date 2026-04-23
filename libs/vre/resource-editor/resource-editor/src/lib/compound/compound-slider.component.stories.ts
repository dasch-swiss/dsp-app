import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { CompoundSliderComponent } from './compound-slider.component';
import { CompoundService } from './compound.service';

const makeCompoundServiceStub = (page = 3, totalPages = 10) => ({
  compoundPosition: { page, totalPages, isLastPage: page >= totalPages },
  openPage: () => {},
});

const meta: Meta<CompoundSliderComponent> = {
  title: 'Devs / Resource Editor / Compound / Compound Slider',
  component: CompoundSliderComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: CompoundService, useValue: makeCompoundServiceStub() }],
    }),
  ],
};
export default meta;
type Story = StoryObj<CompoundSliderComponent>;

export const DefaultView: Story = {
  name: 'Shows page slider for compound resource navigation',
  play: async ({ canvasElement, step }) => {
    await step('Slider is rendered', async () => {
      const slider = canvasElement.querySelector('mat-slider');
      await expect(slider).not.toBeNull();
    });
  },
};
