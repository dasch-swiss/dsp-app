import { MatDialog } from '@angular/material/dialog';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { UserService } from '@dasch-swiss/vre/core/session';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, fn, userEvent, within } from 'storybook/test';
import { makeReadUser, makeUserServiceStub, STORY_PROVIDERS } from '../../stories.helpers';
import { UsersTabService } from '../users-tab.service';
import { UsersListComponent } from './users-list.component';

const openDialog = fn(() => ({ afterClosed: () => of(false) }));

const baseProviders = [
  ...STORY_PROVIDERS,
  { provide: MatDialog, useValue: { open: openDialog } },
  { provide: DialogService, useValue: { afterConfirmation: () => of(true) } },
  {
    provide: UserApiService,
    useValue: { updateSystemAdminMembership: () => of({}), delete: () => of({}), updateStatus: () => of({}) },
  },
  { provide: UsersTabService, useValue: { reloadUsers: () => {} } },
];

const sysAdminProviders = [
  ...baseProviders,
  { provide: UserService, useValue: makeUserServiceStub({ isSysAdmin$: of(true) }) },
];

// Usernames sort the opposite way to family names, so a re-sort is observable.
const users = [
  makeReadUser({ id: 'http://rdfh.ch/users/a', username: 'aaron', givenName: 'Aaron', familyName: 'Zimmer' }),
  makeReadUser({ id: 'http://rdfh.ch/users/z', username: 'zoe', givenName: 'Zoe', familyName: 'Albrecht' }),
];

const rowNames = (canvasElement: HTMLElement) =>
  Array.from(canvasElement.querySelectorAll('app-users-list-row')).map(row => row.textContent ?? '');

const meta: Meta<UsersListComponent> = {
  title: 'Pages / System / Users / Users List',
  component: UsersListComponent,
  // The sort key is persisted; reset it so every story starts sorted by username.
  beforeEach: () => localStorage.removeItem('sortUsersBy'),
  argTypes: {
    list: {
      description: 'The users to list. They are sorted by the selected sort key.',
      control: 'object',
      table: { type: { summary: 'ReadUser[]' }, category: 'Content' },
    },
    isButtonEnabledToCreateNewUser: {
      description: 'Shows the "Create a new user" button when true and the current user is a system admin.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Behavior' },
    },
  },
};
export default meta;
type Story = StoryObj<UsersListComponent>;

export const ShowsUserCountAndRows: Story = {
  name: 'Shows the user count and one row per user',
  decorators: [applicationConfig({ providers: baseProviders })],
  args: { list: users },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('User count is shown', async () => {
      await expect(await canvas.findByTestId('user-count')).toHaveTextContent('2 Users');
    });
    await step('Users are sorted by username', async () => {
      const rows = rowNames(canvasElement);
      await expect(rows[0]).toContain('Aaron Zimmer');
      await expect(rows[1]).toContain('Zoe Albrecht');
    });
    await step('Create button is hidden for non system admins', async () => {
      await expect(canvas.queryByRole('button', { name: 'Create a new user' })).toBeNull();
    });
  },
};

export const ShowsEmptyListAsNothing: Story = {
  name: 'Renders nothing when the list is empty',
  decorators: [applicationConfig({ providers: baseProviders })],
  args: { list: [] },
  play: async ({ canvasElement, step }) => {
    await step('No user count and no rows are rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="user-count"]')).toBeNull();
      await expect(canvasElement.querySelector('app-users-list-row')).toBeNull();
    });
  },
};

export const ResortsWhenSortKeyChanges: Story = {
  name: 'Re-sorts the list when another sort key is chosen',
  decorators: [applicationConfig({ providers: baseProviders })],
  args: { list: users },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Sort by last name', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /Sort by/ }));
      await userEvent.click(await within(document.body).findByRole('menuitem', { name: 'Last name' }));
    });
    await step('Users are now sorted by family name', async () => {
      const rows = rowNames(canvasElement);
      await expect(rows[0]).toContain('Zoe Albrecht');
      await expect(rows[1]).toContain('Aaron Zimmer');
    });
  },
};

export const OpensCreateUserDialogForSystemAdmin: Story = {
  name: 'Opens the create user dialog when a system admin clicks the create button',
  decorators: [applicationConfig({ providers: sysAdminProviders })],
  args: { list: users, isButtonEnabledToCreateNewUser: true },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    openDialog.mockClear();
    await step('Click "Create a new user"', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: 'Create a new user' }));
    });
    await step('The dialog is opened', async () => {
      await expect(openDialog).toHaveBeenCalledOnce();
    });
  },
};
