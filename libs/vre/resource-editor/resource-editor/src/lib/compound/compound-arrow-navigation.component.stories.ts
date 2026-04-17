import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { CompoundService } from './compound.service';
import { CompoundArrowNavigationComponent } from './compound-arrow-navigation.component';

const makeCompoundServiceStub = (page = 2, totalPages = 5) => ({
  compoundPosition: { page, totalPages, isLastPage: page >= totalPages },
  openPage: () => {},
});

const meta: Meta<CompoundArrowNavigationComponent> = {
  title: 'Devs / Resource Editor / Compound / Compound Arrow Navigation',
  component: CompoundArrowNavigationComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: CompoundService, useValue: makeCompoundServiceStub() }],
    }),
  ],
  argTypes: {
    forwardNavigation: {
      description: 'When true shows forward arrow, when false shows backward arrow.',
      table: { type: { summary: 'boolean' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<CompoundArrowNavigationComponent>;

export const Forward: Story = {
  name: 'Shows forward navigation arrow',
  args: { forwardNavigation: true },
  play: async ({ canvasElement, step }) => {
    await step('Right arrow icon is rendered', async () => {
      const icon = canvasElement.querySelector('mat-icon');
      await expect(icon?.textContent?.trim()).toBe('keyboard_arrow_right');
    });
  },
};

export const Backward: Story = {
  name: 'Shows backward navigation arrow',
  args: { forwardNavigation: false },
  play: async ({ canvasElement, step }) => {
    await step('Left arrow icon is rendered', async () => {
      const icon = canvasElement.querySelector('mat-icon');
      await expect(icon?.textContent?.trim()).toBe('keyboard_arrow_left');
    });
  },
};
