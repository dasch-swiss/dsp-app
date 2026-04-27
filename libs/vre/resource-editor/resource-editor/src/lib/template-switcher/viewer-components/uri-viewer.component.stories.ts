import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { UriViewerComponent } from './uri-viewer.component';

const meta: Meta<UriViewerComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Template Switcher / URI Viewer',
  component: UriViewerComponent,
  argTypes: {
    value: {
      description: 'ReadUriValue containing the URI string.',
      table: { type: { summary: 'ReadUriValue' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<UriViewerComponent>;

export const DefaultView: Story = {
  name: 'Shows a clickable link for the URI',
  args: {
    value: { uri: 'https://www.dasch.swiss' } as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Link is rendered', async () => {
      const link = canvasElement.querySelector('a');
      await expect(link).not.toBeNull();
    });
    await step('Link href matches the URI', async () => {
      const link = canvasElement.querySelector('a') as HTMLAnchorElement;
      await expect(link.href).toContain('dasch.swiss');
    });
    await step('Link text shows the URI', async () => {
      const link = canvasElement.querySelector('a') as HTMLAnchorElement;
      await expect(link.textContent?.trim()).toContain('dasch.swiss');
    });
  },
};
