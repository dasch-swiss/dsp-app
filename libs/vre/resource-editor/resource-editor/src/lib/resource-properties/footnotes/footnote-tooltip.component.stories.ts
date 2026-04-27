import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { FootnoteTooltipComponent } from './footnote-tooltip.component';

const meta: Meta<FootnoteTooltipComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Footnote Tooltip',
  component: FootnoteTooltipComponent,
  argTypes: {
    content: {
      description: 'SafeHtml content to display inside the tooltip.',
      table: { type: { summary: 'SafeHtml' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<FootnoteTooltipComponent>;

export const DefaultView: Story = {
  name: 'Shows footnote content in a floating tooltip',
  args: {
    content: '<p>This is a <strong>footnote</strong> with formatted text.</p>' as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Tooltip content is rendered', async () => {
      const content = canvasElement.querySelector('.content');
      await expect(content).not.toBeNull();
    });
    await step('Footnote text is displayed', async () => {
      await expect(canvasElement.textContent).toContain('footnote');
    });
  },
};
