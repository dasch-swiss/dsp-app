import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';

import { GlobalSearchComponent } from './global-search.component';

const meta: Meta<GlobalSearchComponent> = {
  title: 'Shared / Header / Global Search',
  component: GlobalSearchComponent,
  decorators: [
    applicationConfig({
      providers: [provideRouter([])],
    }),
  ],
};
export default meta;
type Story = StoryObj<GlobalSearchComponent>;

export const Empty: Story = {
  name: 'Shows search input with search icon button',
  play: async ({ canvasElement, step }) => {
    await step('Search input is rendered', async () => {
      await expect(canvasElement.querySelector('input')).not.toBeNull();
    });
    await step('Search icon button is rendered', async () => {
      await expect(canvasElement.querySelector('mat-icon')).not.toBeNull();
    });
  },
};

export const WithTypedQuery: Story = {
  name: 'Accepts typed search query in the input',
  play: async ({ canvasElement, step }) => {
    const input = canvasElement.querySelector('input') as HTMLInputElement;
    await step('User types a search query', async () => {
      await userEvent.type(input, 'medieval manuscripts');
      await expect(input.value).toBe('medieval manuscripts');
    });
  },
};
