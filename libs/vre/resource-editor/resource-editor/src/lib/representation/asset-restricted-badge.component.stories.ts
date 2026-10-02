import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { AssetRestrictedBadgeComponent } from './asset-restricted-badge.component';

const meta: Meta<AssetRestrictedBadgeComponent> = {
  title: 'Resource Editor / 3. Representation / Asset Restricted Badge',
  component: AssetRestrictedBadgeComponent,
  decorators: [
    story => ({
      ...story(),
      // The badge is absolutely positioned on the asset viewer; this stands in for that dark,
      // positioned container so the story shows it in its real context.
      template: `<div style="position: relative; height: 180px; background: rgb(41, 41, 41);">${story().template}</div>`,
    }),
  ],
};
export default meta;
type Story = StoryObj<AssetRestrictedBadgeComponent>;

export const DefaultView: Story = {
  name: 'Marks the asset viewer as serving a reduced-quality file',
  play: async ({ canvasElement, step }) => {
    await step('Badge is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="asset-restricted-badge"]')).not.toBeNull();
    });
    await step('Badge names the restriction without blaming the resource', async () => {
      const text = canvasElement.querySelector('[data-cy="asset-restricted-badge"]')?.textContent?.toLowerCase() ?? '';
      await expect(text).toContain('quality');
    });
  },
};
