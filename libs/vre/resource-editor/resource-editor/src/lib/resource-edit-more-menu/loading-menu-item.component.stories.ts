import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { LoadingMenuItemComponent } from './loading-menu-item.component';

const meta: Meta<LoadingMenuItemComponent> = {
  title: 'Devs / Resource Editor / More Menu / Loading Menu Item',
  component: LoadingMenuItemComponent,
  argTypes: {
    dataCy: {
      description: 'data-cy attribute value applied to the button.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    tooltipKey: {
      description: 'Translation key for the tooltip.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    labelKey: {
      description: 'Translation key for the button label.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<LoadingMenuItemComponent>;

export const DefaultView: Story = {
  name: 'Shows disabled menu item with spinner while loading',
  args: {
    dataCy: 'resource-more-menu-delete-button',
    tooltipKey: 'resourceEditor.moreMenu.checkingPermission',
    labelKey: 'ui.common.actions.delete',
  },
  play: async ({ canvasElement, step }) => {
    await step('Button is rendered and disabled', async () => {
      const button = canvasElement.querySelector('[data-cy="resource-more-menu-delete-button"]');
      await expect(button).not.toBeNull();
      await expect((button as HTMLButtonElement).disabled).toBe(true);
    });
  },
};
