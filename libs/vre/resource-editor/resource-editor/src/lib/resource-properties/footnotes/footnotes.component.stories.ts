import { signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { FootnoteService } from './footnote.service';
import { FootnotesComponent } from './footnotes.component';

const makeFootnoteServiceStub = (footnotes: string[] = []): Partial<FootnoteService> => ({
  footnotes: footnotes as any[],
  uuid: 'test-uuid-123',
  reloadToken: signal(0),
});

const meta: Meta<FootnotesComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Footnotes / Footnotes',
  component: FootnotesComponent,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: FootnoteService,
          useValue: makeFootnoteServiceStub([
            'First footnote text.',
            'Second footnote with <strong>bold</strong> content.',
          ]),
        },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<FootnotesComponent>;

export const WithFootnotes: Story = {
  name: 'Shows numbered footnote list',
  play: async ({ canvasElement, step }) => {
    await step('Footnote items are rendered', async () => {
      const footnotes = canvasElement.querySelectorAll('[data-cy="footnote"]');
      await expect(footnotes.length).toBe(2);
    });
    await step('Footnotes heading is shown', async () => {
      const heading = canvasElement.querySelector('h5');
      await expect(heading).not.toBeNull();
    });
  },
};
