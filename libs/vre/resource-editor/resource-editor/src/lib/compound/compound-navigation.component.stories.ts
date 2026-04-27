import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { CompoundNavigationComponent } from './compound-navigation.component';
import { CompoundService } from './compound.service';

const meta: Meta<CompoundNavigationComponent> = {
  title: 'Devs / Resource Editor / 3. Representation / Compound / Compound Navigation',
  component: CompoundNavigationComponent,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: CompoundService,
          useValue: {
            compoundPosition: { page: 3, totalPages: 10, isLastPage: false },
            openPage: () => {},
          },
        },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<CompoundNavigationComponent>;

export const MiddlePage: Story = {
  name: 'Shows all navigation buttons enabled on a middle page',
  play: async ({ canvasElement, step }) => {
    await step('Page range is displayed', async () => {
      await expect(canvasElement.textContent).toContain('3');
      await expect(canvasElement.textContent).toContain('10');
    });
    await step('First page button is rendered', async () => {
      const icons = Array.from(canvasElement.querySelectorAll('mat-icon'));
      const first = icons.find(i => i.textContent?.trim() === 'first_page');
      await expect(first).not.toBeUndefined();
    });
  },
};
