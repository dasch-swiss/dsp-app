import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { makeReadUser, STORY_PROVIDERS } from './stories.helpers';
import { EditPasswordDialogComponent } from './edit-password-dialog.component';

const sampleUser = makeReadUser({ username: 'testuser', id: 'http://rdfh.ch/users/testuser' });

const sharedProviders = [
  ...STORY_PROVIDERS,
  { provide: MAT_DIALOG_DATA, useValue: { user: sampleUser } },
  { provide: MatDialogRef, useValue: { close: () => {} } },
  { provide: UserApiService, useValue: { updatePassword: () => of({}) } },
  { provide: UserService, useValue: { currentUser: sampleUser } },
  { provide: DspApiConnectionToken, useValue: { v2: { auth: { login: () => of({}) } } } },
];

const meta: Meta<EditPasswordDialogComponent> = {
  title: 'Pages / User Settings / Edit Password Dialog',
  component: EditPasswordDialogComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<EditPasswordDialogComponent>;

export const InitialStep: Story = {
  name: 'Shows current password step with next button on open',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Username is shown in dialog header', async () => {
      await expect(canvas.getByText('testuser')).toBeInTheDocument();
    });
    await step('Next button is present for password verification', async () => {
      await expect(canvas.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });
    await step('Cancel button is present', async () => {
      await expect(canvas.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  },
};

export const AdvancesToNextStep: Story = {
  name: 'Advances to new password step after verifying current password',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Type current password', async () => {
      await userEvent.type(canvas.getByRole('textbox'), 'currentpass');
    });
    await step('Click next', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /next/i }));
    });
    await step('Update button appears for new password step', async () => {
      await expect(canvas.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });
  },
};
