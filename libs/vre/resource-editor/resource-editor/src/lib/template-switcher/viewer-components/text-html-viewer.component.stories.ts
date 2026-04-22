import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { TextHtmlViewerComponent } from './text-html-viewer.component';

const meta: Meta<TextHtmlViewerComponent> = {
  title: 'Devs / Resource Editor / Template Switcher / Text HTML Viewer',
  component: TextHtmlViewerComponent,
  argTypes: {
    value: {
      description: 'ReadTextValueAsHtml containing HTML markup.',
      table: { type: { summary: 'ReadTextValueAsHtml' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<TextHtmlViewerComponent>;

export const DefaultView: Story = {
  name: 'Renders HTML text content',
  args: {
    value: { html: '<p>This is <strong>formatted</strong> text.</p>' } as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('HTML content container is rendered', async () => {
      const container = canvasElement.querySelector('[data-cy="text-html-switch"]');
      await expect(container).not.toBeNull();
    });
    await step('HTML content is displayed', async () => {
      const container = canvasElement.querySelector('[data-cy="text-html-switch"]');
      await expect(container?.textContent).toContain('formatted');
    });
  },
};
