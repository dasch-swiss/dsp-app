import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, waitFor } from 'storybook/test';

import { ResourceRestrictionComponent } from './resource-restriction.component';

const meta: Meta<ResourceRestrictionComponent> = {
  title: 'Resource Editor / 1. Meta information / Resource Restriction',
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

export const SpeaksOnlyAboutTheResource: Story = {
  name: 'Describes hidden values without claiming the asset is degraded',
  play: async ({ canvasElement, step }) => {
    await step('Message mentions the resource values that are hidden', async () => {
      const text = canvasElement.textContent?.toLowerCase() ?? '';
      await expect(text).toContain('values');
    });
    await step('Message makes no claim about image or file quality (DEV-7392)', async () => {
      const text = canvasElement.textContent?.toLowerCase() ?? '';
      await expect(text).not.toContain('quality');
      await expect(text).not.toContain('image');
    });
  },
};

export const Dismissible: Story = {
  name: 'Hides the alert once the close button is clicked',
  play: async ({ canvasElement, step }) => {
    await step('Alert is visible initially', async () => {
      await expect(canvasElement.querySelector('app-alert-info')).not.toBeNull();
    });
    await step('Clicking close removes the alert', async () => {
      const closeButton = canvasElement.querySelector('[data-cy="close-restricted-button"]') as HTMLElement;
      await userEvent.click(closeButton);
      await waitFor(async () => {
        await expect(canvasElement.querySelector('app-alert-info')).toBeNull();
      });
    });
  },
};
