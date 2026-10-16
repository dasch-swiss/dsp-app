import { MatDialog } from '@angular/material/dialog';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { makeReadUser, STORY_PROVIDERS } from '../stories.helpers';
import { UsersTabComponent } from './users-tab.component';

const users = [
  makeReadUser({ id: 'http://rdfh.ch/users/alice', username: 'alice', givenName: 'Alice', familyName: 'Active' }),
  makeReadUser({ id: 'http://rdfh.ch/users/bob', username: 'bob', givenName: 'Bob', familyName: 'Active' }),
  makeReadUser({
    id: 'http://rdfh.ch/users/carol',
    username: 'carol',
    givenName: 'Carol',
    familyName: 'Suspended',
    status: false,
  }),
];

const meta: Meta<UsersTabComponent> = {
  title: 'Pages / System / Users / Users Tab',
  component: UsersTabComponent,
  argTypes: {},
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        // UsersTabComponent provides its own UsersTabService, which loads users from this stub.
        { provide: UserApiService, useValue: { list: () => of({ users }) } },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(false) }) } },
        { provide: DialogService, useValue: { afterConfirmation: () => of(true) } },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<UsersTabComponent>;

export const ShowsActiveUsersByDefault: Story = {
  name: 'Shows active users by default',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Active and inactive counts are shown', async () => {
      await expect(await canvas.findByText('Active users (2)')).toBeInTheDocument();
      await expect(canvas.getByText('Inactive users (1)')).toBeInTheDocument();
    });
    await step('Only active users are listed', async () => {
      await expect(canvas.getByText('Alice Active')).toBeInTheDocument();
      await expect(canvas.getByText('Bob Active')).toBeInTheDocument();
      await expect(canvas.queryByText('Carol Suspended')).toBeNull();
    });
  },
};

export const ShowsInactiveUsersWhenSelected: Story = {
  name: 'Shows inactive users when the inactive chip is selected',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Select the inactive users chip', async () => {
      await userEvent.click(await canvas.findByText('Inactive users (1)'));
    });
    await step('Only inactive users are listed', async () => {
      await expect(await canvas.findByText('Carol Suspended')).toBeInTheDocument();
      await expect(canvas.queryByText('Alice Active')).toBeNull();
    });
  },
};
