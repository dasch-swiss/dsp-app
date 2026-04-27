import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { ParagraphViewerComponent } from './paragraph-viewer.component';

const meta: Meta<ParagraphViewerComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Properties Display / Template Switcher / Paragraph Viewer',
  component: ParagraphViewerComponent,
  argTypes: {
    value: {
      description: 'ReadTextValueAsString containing plain text.',
      table: { type: { summary: 'ReadTextValueAsString' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ParagraphViewerComponent>;

export const DefaultView: Story = {
  name: 'Displays plain text with line breaks preserved',
  args: {
    value: { text: 'First line\nSecond line\nThird line' } as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Text content is rendered', async () => {
      const span = canvasElement.querySelector('span');
      await expect(span).not.toBeNull();
      await expect(span?.textContent).toContain('First line');
    });
  },
};
