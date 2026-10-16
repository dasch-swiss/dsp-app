import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { makeMembershipProviders } from '../membership/membership.stories.helpers';
import { makeReadUser } from '../stories.helpers';
import { ManageProjectMembershipDialogComponent } from './manage-project-membership-dialog.component';

const meta: Meta<ManageProjectMembershipDialogComponent> = {
  title: 'Pages / System / Users / Manage Project Membership Dialog',
  component: ManageProjectMembershipDialogComponent,
  argTypes: {},
  decorators: [
    applicationConfig({
      providers: [
        ...makeMembershipProviders(),
        { provide: MAT_DIALOG_DATA, useValue: { user: makeReadUser() } },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<ManageProjectMembershipDialogComponent>;

export const ShowsUserMemberships: Story = {
  name: "Shows the user's name and their project memberships",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Header shows the username and purpose', async () => {
      await expect(await canvas.findByText('testuser')).toBeInTheDocument();
      await expect(canvas.getByText('Manage project membership')).toBeInTheDocument();
    });
    await step('Membership list is rendered', async () => {
      await expect(await canvas.findByText('Alpha Project (alpha)')).toBeInTheDocument();
    });
    await step('Close button is available', async () => {
      await expect(canvas.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });
  },
};
