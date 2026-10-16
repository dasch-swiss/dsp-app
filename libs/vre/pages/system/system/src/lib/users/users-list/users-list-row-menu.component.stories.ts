import { MatDialog } from '@angular/material/dialog';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { UserService } from '@dasch-swiss/vre/core/session';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, fn, userEvent, within } from 'storybook/test';
import { makeReadUser, makeSystemAdminUser, makeUserServiceStub, STORY_PROVIDERS } from '../../stories.helpers';
import { UsersTabService } from '../users-tab.service';
import { UsersListRowMenuComponent } from './users-list-row-menu.component';

const updateStatus = fn(() => of({}));
const reloadUsers = fn();

const providers = (isSysAdmin: boolean) => [
  ...STORY_PROVIDERS,
  { provide: UserService, useValue: makeUserServiceStub({ isSysAdmin$: of(isSysAdmin) }) },
  { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(false) }) } },
  { provide: DialogService, useValue: { afterConfirmation: () => of(true) } },
  {
    provide: UserApiService,
    useValue: { updateSystemAdminMembership: () => of({}), delete: () => of({}), updateStatus },
  },
  { provide: UsersTabService, useValue: { reloadUsers } },
];

const openMenu = async (canvasElement: HTMLElement) => {
  await userEvent.click(await within(canvasElement).findByTestId('user-menu'));
  return within(document.body);
};

const meta: Meta<UsersListRowMenuComponent> = {
  title: 'Pages / System / Users / Users List Row Menu',
  component: UsersListRowMenuComponent,
  argTypes: {
    user: {
      description: 'The user the menu actions apply to.',
      control: 'object',
      table: { type: { summary: 'ReadUser' }, category: 'Content' },
    },
  },
};
export default meta;
type Story = StoryObj<UsersListRowMenuComponent>;

export const HiddenForNonSystemAdmin: Story = {
  name: 'Hides the menu button from non system admins',
  decorators: [applicationConfig({ providers: providers(false) })],
  args: { user: makeReadUser() },
  play: async ({ canvasElement, step }) => {
    await step('Menu button is not rendered', async () => {
      await expect(within(canvasElement).queryByTestId('user-menu')).toBeNull();
    });
  },
};

export const ShowsActionsForActiveUser: Story = {
  name: 'Shows edit, password, membership, admin and suspend actions for an active user',
  decorators: [applicationConfig({ providers: providers(true) })],
  args: { user: makeReadUser() },
  play: async ({ canvasElement, step }) => {
    const body = await openMenu(canvasElement);
    await step('All active-user actions are listed', async () => {
      await expect(await body.findByRole('menuitem', { name: 'Edit user' })).toBeInTheDocument();
      await expect(body.getByRole('menuitem', { name: "Change user's password" })).toBeInTheDocument();
      await expect(body.getByRole('menuitem', { name: 'Manage project membership' })).toBeInTheDocument();
      await expect(body.getByRole('menuitem', { name: /Add as system admin/ })).toBeInTheDocument();
      await expect(body.getByRole('menuitem', { name: /Suspend user/ })).toBeInTheDocument();
    });
    await step('Reactivate is not offered', async () => {
      await expect(body.queryByRole('menuitem', { name: 'Reactivate user' })).toBeNull();
    });
  },
};

export const OffersRemovingSystemAdmin: Story = {
  name: 'Offers to remove the system admin role from a system admin',
  decorators: [applicationConfig({ providers: providers(true) })],
  args: { user: makeSystemAdminUser() },
  play: async ({ canvasElement, step }) => {
    const body = await openMenu(canvasElement);
    await step('"Remove as system admin" is offered', async () => {
      await expect(await body.findByRole('menuitem', { name: /Remove as system admin/ })).toBeInTheDocument();
    });
  },
};

export const ReactivatesSuspendedUser: Story = {
  name: 'Reactivates a suspended user and reloads the list',
  decorators: [applicationConfig({ providers: providers(true) })],
  args: { user: makeReadUser({ status: false }) },
  play: async ({ canvasElement, step }) => {
    updateStatus.mockClear();
    reloadUsers.mockClear();
    const body = await openMenu(canvasElement);
    await step('Only "Reactivate user" is offered', async () => {
      await expect(body.queryByRole('menuitem', { name: 'Edit user' })).toBeNull();
      await userEvent.click(await body.findByRole('menuitem', { name: 'Reactivate user' }));
    });
    await step('The user is reactivated and the list reloads', async () => {
      await expect(updateStatus).toHaveBeenCalledWith('http://rdfh.ch/users/testuser', true);
      await expect(reloadUsers).toHaveBeenCalledOnce();
    });
  },
};
