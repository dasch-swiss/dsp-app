import { MatDialog } from '@angular/material/dialog';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { UserService } from '@dasch-swiss/vre/core/session';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { makeReadProject, makeReadUser, makeUserServiceStub, STORY_PROVIDERS } from '../stories.helpers';
import { CollaborationPageService } from './collaboration/collaboration-page.service';
import { ProjectMembersRowMenuComponent } from './project-members-row-menu.component';

const baseProviders = [
  ...STORY_PROVIDERS,
  { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(false) }) } },
  { provide: DialogService, useValue: { afterConfirmation: () => of(true) } },
  {
    provide: UserApiService,
    useValue: { removeFromProjectMembership: () => of({}), addToProjectMembership: () => of({}) },
  },
  {
    provide: AdminAPIApiService,
    useValue: { deleteAdminUsersIriUseririProjectMembershipsProjectiri: () => of({}) },
  },
  { provide: CollaborationPageService, useValue: { reloadProjectMembers: () => {} } },
];

const meta: Meta<ProjectMembersRowMenuComponent> = {
  title: 'Pages / Project / Settings Tab / Members / Members Row Menu',
  component: ProjectMembersRowMenuComponent,
  argTypes: {
    user: {
      description: 'The project member this menu acts on.',
      control: 'object',
      table: { type: { summary: 'ReadUser' }, category: 'Content' },
    },
    project: {
      description: 'The current project context.',
      control: 'object',
      table: { type: { summary: 'ReadProject' }, category: 'Content' },
    },
  },
};
export default meta;
type Story = StoryObj<ProjectMembersRowMenuComponent>;

export const DefaultMenu: Story = {
  name: 'Shows menu trigger button for any project member',
  decorators: [applicationConfig({ providers: baseProviders })],
  args: {
    user: makeReadUser(),
    project: makeReadProject(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Menu trigger button is visible', async () => {
      await expect(canvas.getByTestId('user-menu')).toBeInTheDocument();
    });
  },
};

export const OpensMenuWithActions: Story = {
  name: 'Shows remove member action when menu is opened',
  decorators: [applicationConfig({ providers: baseProviders })],
  args: {
    user: makeReadUser(),
    project: makeReadProject(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click the menu trigger', async () => {
      await userEvent.click(canvas.getByTestId('user-menu'));
    });
    await step('Remove member action is visible', async () => {
      await expect(within(document.body).getByTestId('remove-member-button')).toBeInTheDocument();
    });
  },
};

export const SysAdminSeesEditActions: Story = {
  name: 'Shows edit and change password actions for system admin',
  decorators: [
    applicationConfig({
      providers: [...baseProviders, { provide: UserService, useValue: makeUserServiceStub({ isSysAdmin$: of(true) }) }],
    }),
  ],
  args: {
    user: makeReadUser(),
    project: makeReadProject(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click the menu trigger', async () => {
      await userEvent.click(canvas.getByTestId('user-menu'));
    });
    await step('Edit member action is visible for sysadmin', async () => {
      await expect(within(document.body).getByText('Edit member')).toBeInTheDocument();
    });
    await step("Change member's password action is visible", async () => {
      await expect(within(document.body).getByText("Change member's password")).toBeInTheDocument();
    });
  },
};
