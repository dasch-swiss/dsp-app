import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { STORY_PROVIDERS } from '../stories.helpers';
import { CreateCopyrightHolderDialogComponent } from './create-copyright-holder-dialog.component';

const sharedProviders = [
  ...STORY_PROVIDERS,
  { provide: MAT_DIALOG_DATA, useValue: { projectShortcode: '0001' } },
  { provide: MatDialogRef, useValue: { close: () => {} } },
  {
    provide: AdminAPIApiService,
    useValue: { postAdminProjectsShortcodeProjectshortcodeLegalInfoCopyrightHolders: () => of({}) },
  },
];

const meta: Meta<CreateCopyrightHolderDialogComponent> = {
  title: 'Pages / Project / Legal Settings / Create Copyright Holder Dialog',
  component: CreateCopyrightHolderDialogComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<CreateCopyrightHolderDialogComponent>;

export const EmptyForm: Story = {
  name: 'Shows text input and submit button disabled when form is empty',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Dialog title is shown', async () => {
      await expect(canvas.getByText('Add copyright holder')).toBeInTheDocument();
    });
    await step('Submit button is disabled on empty form', async () => {
      await expect(canvas.getByRole('button', { name: /submit/i })).toBeDisabled();
    });
    await step('Cancel button is present', async () => {
      await expect(canvas.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  },
};

export const FilledForm: Story = {
  name: 'Enables submit button when copyright holder text is entered',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Type a copyright holder value', async () => {
      await userEvent.type(canvas.getByRole('textbox'), 'University of Basel');
    });
    await step('Submit button is enabled', async () => {
      await expect(canvas.getByRole('button', { name: /submit/i })).not.toBeDisabled();
    });
  },
};
