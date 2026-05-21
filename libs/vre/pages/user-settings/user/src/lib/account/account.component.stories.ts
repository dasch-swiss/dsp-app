import { MatDialog } from '@angular/material/dialog';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AuthService, UserService } from '@dasch-swiss/vre/core/session';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { makeUserServiceStub, STORY_PROVIDERS } from '../stories.helpers';
import { AccountComponent } from './account.component';

const baseProviders = [
  ...STORY_PROVIDERS,
  { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(false) }) } },
  { provide: DialogService, useValue: { afterConfirmation: () => of(true) } },
  { provide: UserApiService, useValue: { delete: () => of({}) } },
  { provide: AuthService, useValue: { logout: () => {} } },
];

const meta: Meta<AccountComponent> = {
  title: 'Pages / User Settings / Account',
  component: AccountComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<AccountComponent>;

export const DefaultView: Story = {
  name: 'Shows edit profile, edit password, and delete account actions',
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Edit my profile action is visible', async () => {
      await expect(canvas.getByText('Edit my profile')).toBeInTheDocument();
    });
    await step('Edit my password action is visible', async () => {
      await expect(canvas.getByText('Edit my password')).toBeInTheDocument();
    });
    await step('Suspend account action is visible', async () => {
      await expect(canvas.getByText('Suspend user account now')).toBeInTheDocument();
    });
  },
};

export const OpensEditProfileDialog: Story = {
  name: 'Opens edit profile dialog when edit action is clicked',
  decorators: [
    applicationConfig({
      providers: [
        ...baseProviders,
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(true) }) } },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click "Edit my profile"', async () => {
      await userEvent.click(canvas.getByText('Edit my profile'));
    });
    await step('Component is still in the DOM after action', async () => {
      await expect(canvas.getByText('Edit my profile')).toBeInTheDocument();
    });
  },
};
