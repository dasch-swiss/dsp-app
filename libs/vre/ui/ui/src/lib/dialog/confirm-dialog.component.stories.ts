import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';

import { ConfirmDialogComponent } from './confirm-dialog.component';

const makeProviders = (data: { message: string; title: string | null; subtitle: string | null }) => [
  applicationConfig({
    providers: [
      { provide: MatDialogRef, useValue: { close: () => {} } },
      { provide: MAT_DIALOG_DATA, useValue: data },
    ],
  }),
];

const meta: Meta<ConfirmDialogComponent> = {
  title: 'UI / Dialog / Confirm Dialog',
  component: ConfirmDialogComponent,
};
export default meta;
type Story = StoryObj<ConfirmDialogComponent>;

export const WithMessageOnly: Story = {
  name: 'Shows confirmation message with default title',
  decorators: makeProviders({ message: 'Are you sure you want to delete this resource?', title: null, subtitle: null }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Confirmation message is visible', async () => {
      await expect(canvas.getByText('Are you sure you want to delete this resource?')).toBeInTheDocument();
    });
    await step('Yes and No buttons are rendered', async () => {
      await expect(canvas.getByRole('button', { name: /yes/i })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: /no/i })).toBeInTheDocument();
    });
  },
};

export const WithCustomTitle: Story = {
  name: 'Shows custom title and subtitle',
  decorators: makeProviders({
    message: 'This action cannot be undone.',
    title: 'Delete Project',
    subtitle: 'You are about to remove all project data',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"Delete Project" title is visible', async () => {
      await expect(canvas.getByText('Delete Project')).toBeInTheDocument();
    });
    await step('Subtitle is visible', async () => {
      await expect(canvas.getByText('You are about to remove all project data')).toBeInTheDocument();
    });
    await step('Message body is visible', async () => {
      await expect(canvas.getByText('This action cannot be undone.')).toBeInTheDocument();
    });
  },
};

export const ClicksNoButton: Story = {
  name: 'Closes dialog with false when No is clicked',
  decorators: makeProviders({ message: 'Confirm cancellation?', title: null, subtitle: null }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('No button is clicked', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /no/i }));
    });
  },
};

export const ClicksYesButton: Story = {
  name: 'Closes dialog with true when Yes is clicked',
  decorators: makeProviders({ message: 'Confirm deletion?', title: 'Delete', subtitle: null }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Yes button is clicked', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /yes/i }));
    });
  },
};
