import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { UserService } from '@dasch-swiss/vre/core/session';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { makeReadUser, STORY_PROVIDERS } from '../stories.helpers';
import { EditUserDialogComponent } from './edit-user-dialog.component';

const sampleUser = makeReadUser({
  givenName: 'Jane',
  familyName: 'Doe',
  username: 'janedoe',
  email: 'jane@example.com',
  lang: 'en',
});

const sharedProviders = [
  ...STORY_PROVIDERS,
  { provide: MatDialogRef, useValue: { close: () => {} } },
  { provide: UserApiService, useValue: { updateBasicInformation: () => of({}) } },
  { provide: UserService, useValue: { currentUser: sampleUser } },
  { provide: LocalizationService, useValue: { setLanguage: () => {} } },
  { provide: NotificationService, useValue: { openSnackBar: () => {} } },
];

const meta: Meta<EditUserDialogComponent> = {
  title: 'Pages / User Settings / Account / Edit User Dialog',
  component: EditUserDialogComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<EditUserDialogComponent>;

export const OwnAccount: Story = {
  name: 'Shows "Edit my profile" title when editing own account',
  decorators: [
    applicationConfig({
      providers: [...sharedProviders, { provide: MAT_DIALOG_DATA, useValue: { user: sampleUser, isOwnAccount: true } }],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Dialog title is "Edit my profile"', async () => {
      await expect(canvas.getByText('Edit my profile')).toBeInTheDocument();
    });
    await step('Update button is present', async () => {
      await expect(canvas.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });
    await step('Cancel button is present', async () => {
      await expect(canvas.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  },
};

export const OtherUserAccount: Story = {
  name: 'Shows "Edit user" title when editing another user\'s account',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        { provide: MAT_DIALOG_DATA, useValue: { user: sampleUser, isOwnAccount: false } },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Dialog title is "Edit user"', async () => {
      await expect(canvas.getByText('Edit user')).toBeInTheDocument();
    });
  },
};
