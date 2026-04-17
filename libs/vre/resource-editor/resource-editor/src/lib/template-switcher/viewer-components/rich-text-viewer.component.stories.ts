import { signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { FootnoteService } from '../../resource-properties/footnotes/footnote.service';
import { RichTextViewerComponent } from './rich-text-viewer.component';

const footnoteServiceStub: Partial<FootnoteService> = {
  reloadToken: signal(0),
};

const meta: Meta<RichTextViewerComponent> = {
  title: 'Devs / Resource Editor / Template Switcher / Rich Text Viewer',
  component: RichTextViewerComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: FootnoteService, useValue: footnoteServiceStub }],
    }),
  ],
  argTypes: {
    value: {
      description: 'ReadTextValueAsXml containing XML/HTML rich text.',
      table: { type: { summary: 'ReadTextValueAsXml' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<RichTextViewerComponent>;

export const DefaultView: Story = {
  name: 'Renders rich text HTML content',
  args: {
    value: { strval: '<p>This is <strong>bold</strong> and <em>italic</em> text.</p>' } as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Rich text container is rendered', async () => {
      const container = canvasElement.querySelector('[data-cy="rich-text-switch"]');
      await expect(container).not.toBeNull();
    });
    await step('Text content is displayed', async () => {
      const container = canvasElement.querySelector('[data-cy="rich-text-switch"]');
      await expect(container?.textContent).toContain('bold');
    });
  },
};
