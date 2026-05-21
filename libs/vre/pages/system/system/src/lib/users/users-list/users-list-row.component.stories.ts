import { MatDialog } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { UserService } from '@dasch-swiss/vre/core/session';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { makeReadUser, makeSystemAdminUser, makeUserServiceStub, STORY_PROVIDERS } from '../../stories.helpers';
import { UsersTabService } from '../users-tab.service';
import { UsersListRowComponent } from './users-list-row.component';

const baseProviders = [
  ...STORY_PROVIDERS,
  { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(false) }) } },
  { provide: DialogService, useValue: { afterConfirmation: () => of(true) } },
  {
    provide: UserApiService,
    useValue: { updateSystemAdminMembership: () => of({}), delete: () => of({}), updateStatus: () => of({}) },
  },
  { provide: UsersTabService, useValue: { reloadUsers: () => {} } },
];

const meta: Meta<UsersListRowComponent> = {
  title: 'Pages / System / Users / Users List Row',
  component: UsersListRowComponent,
  argTypes: {
    user: {
      description: 'The user to render in this row.',
      control: 'object',
      table: { type: { summary: 'ReadUser' }, category: 'Content' },
    },
  },
};
export default meta;
type Story = StoryObj<UsersListRowComponent>;

export const RegularUser: Story = {
  name: 'Shows regular user without system admin badge',
  decorators: [applicationConfig({ providers: baseProviders })],
  args: {
    user: makeReadUser(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('User name is visible', async () => {
      await expect(canvas.getByText('Jane Doe')).toBeInTheDocument();
    });
    await step('System admin badge is not shown', async () => {
      await expect(canvas.queryByText('System admin')).toBeNull();
    });
  },
};

export const SystemAdminUser: Story = {
  name: 'Shows system admin badge for system admin user',
  decorators: [applicationConfig({ providers: baseProviders })],
  args: {
    user: makeSystemAdminUser(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('User name is visible', async () => {
      await expect(canvas.getByText('Jane Doe')).toBeInTheDocument();
    });
    await step('System admin badge is displayed', async () => {
      await expect(canvas.getByText('System admin')).toBeInTheDocument();
    });
  },
};

export const WithActionMenuVisible: Story = {
  name: 'Shows action menu button when current user is system admin',
  decorators: [
    applicationConfig({
      providers: [
        ...baseProviders,
        { provide: UserService, useValue: makeUserServiceStub({ isSysAdmin$: of(true) }) },
      ],
    }),
  ],
  args: {
    user: makeReadUser(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Action menu button is visible', async () => {
      await expect(canvas.getByTestId('user-menu')).toBeInTheDocument();
    });
  },
};
