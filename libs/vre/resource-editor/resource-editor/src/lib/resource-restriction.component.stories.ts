import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { ResourceRestrictionComponent } from './resource-restriction.component';

const meta: Meta<ResourceRestrictionComponent> = {
  title: 'Devs / Resource Editor / Header / Resource Restriction',
  component: ResourceRestrictionComponent,
};
export default meta;
type Story = StoryObj<ResourceRestrictionComponent>;

export const DefaultView: Story = {
  name: 'Shows restricted resource alert with close button',
  play: async ({ canvasElement, step }) => {
    await step('Close button is rendered', async () => {
      const closeButton = canvasElement.querySelector('[data-cy="close-restricted-button"]');
      await expect(closeButton).not.toBeNull();
    });
    await step('Warning icon is rendered', async () => {
      const icon = canvasElement.querySelector('mat-icon');
      await expect(icon).not.toBeNull();
    });
  },
};
