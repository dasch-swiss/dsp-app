import { FormControl } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, waitFor } from 'storybook/test';

import { AuthorshipChipEditorComponent } from './authorship-chip-editor.component';

const meta: Meta<AuthorshipChipEditorComponent> = {
  title: 'UI / Authorship Chip Editor / Hint',
  component: AuthorshipChipEditorComponent,
  argTypes: {
    control: {
      description: 'The bound authorship list (nonNullable `FormControl<string[]>`).',
      table: { type: { summary: 'FormControl<string[]>' }, category: 'State' },
    },
    ariaLabel: {
      description: 'Accessible name for the chip grid and its input.',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
    label: {
      description: 'Optional visible label of the field.',
      table: { type: { summary: 'string | undefined' }, category: 'Content' },
    },
    placeholder: {
      description: 'Placeholder of the input while the list is empty.',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
    hint: {
      description: 'Optional helper text under the field.',
      table: { type: { summary: 'string | undefined' }, category: 'Content' },
    },
    hintAfterFirstFocus: {
      description: 'Show the hint from the first focus on instead of from the start, for compact forms.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Appearance' },
    },
    dataCy: {
      description: 'Optional data-cy hook on the input for E2E tests.',
      table: { type: { summary: 'string | undefined' }, category: 'Testing' },
    },
    removeAuthorLabel: {
      description: 'Builds the aria-label of each chip’s remove button.',
      table: { type: { summary: '(name: string) => string' }, category: 'Content' },
    },
  },
};
export default meta;
type Story = StoryObj<AuthorshipChipEditorComponent>;

const HINT = 'Type a name and press Enter to add each author.';

export const ShowsHintAtAllTimesByDefault: Story = {
  name: 'Shows the hint at all times by default',
  args: {
    control: new FormControl<string[]>([], { nonNullable: true }),
    ariaLabel: 'Authorship',
    placeholder: 'New authorship...',
    hint: HINT,
    dataCy: 'authorship-chips',
  },
  play: async ({ canvasElement, step }) => {
    await step('The hint is shown without focusing the field', async () => {
      await expect(canvasElement.textContent).toContain(HINT);
    });
  },
};

export const ShowsHintFromFirstFocusWhenAsked: Story = {
  name: 'Shows the hint from the first focus on when asked to',
  args: { ...ShowsHintAtAllTimesByDefault.args, hintAfterFirstFocus: true },
  play: async ({ canvasElement, step }) => {
    const input = canvasElement.querySelector('[data-cy="authorship-chips"]') as HTMLInputElement;

    await step('At rest, no hint is shown', async () => {
      await expect(canvasElement.textContent).not.toContain(HINT);
    });
    await step('Focusing the input shows the hint', async () => {
      await userEvent.click(input);
      await waitFor(() => expect(canvasElement.textContent).toContain(HINT));
    });
    await step('Leaving the input keeps it, so nothing below moves', async () => {
      await userEvent.tab();
      await expect(canvasElement.textContent).toContain(HINT);
    });
  },
};
