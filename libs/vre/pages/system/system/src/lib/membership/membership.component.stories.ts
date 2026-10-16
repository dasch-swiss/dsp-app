import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, fn, userEvent, within } from 'storybook/test';
import { MembershipComponent } from './membership.component';
import { MEMBER_PROJECT_IRI, makeMembershipProviders } from './membership.stories.helpers';

const USER_IRI = 'http://rdfh.ch/users/testuser';

const addMembership = fn(() => of({}));
const removeMembership = fn(() => of({}));

const meta: Meta<MembershipComponent> = {
  title: 'Pages / System / Users / Membership',
  component: MembershipComponent,
  decorators: [
    applicationConfig({
      providers: makeMembershipProviders({
        postAdminUsersIriUseririProjectMembershipsProjectiri: addMembership,
        deleteAdminUsersIriUseririProjectMembershipsProjectiri: removeMembership,
      } as never),
    }),
  ],
  beforeEach: () => {
    addMembership.mockClear();
    removeMembership.mockClear();
  },
  args: { userId: USER_IRI },
  argTypes: {
    userId: {
      description: 'IRI of the user whose project memberships are managed.',
      control: 'text',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
    closeDialog: {
      description: 'Emitted when the surrounding dialog should close.',
      table: { category: 'Events', type: { summary: 'EventEmitter<void>' } },
    },
  },
};
export default meta;
type Story = StoryObj<MembershipComponent>;

export const ShowsProjectsAndAdminRole: Story = {
  name: 'Shows the projects the user is member of and their admin role',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Membership count is shown', async () => {
      await expect(await canvas.findByText(/This user is member of 1 project/)).toBeInTheDocument();
    });
    await step('Member project and admin role are shown', async () => {
      await expect(canvas.getByText('Alpha Project (alpha)')).toBeInTheDocument();
      await expect(canvas.getByText('Project admin')).toBeInTheDocument();
    });
    await step('Add button is disabled until a project is selected', async () => {
      await expect(canvas.getByRole('button', { name: 'Button to add user to project' })).toBeDisabled();
    });
  },
};

export const OffersOnlyProjectsTheUserCanJoin: Story = {
  name: 'Offers only projects the user is not yet member of, and adds the user to one',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Open the project select', async () => {
      await userEvent.click(await canvas.findByRole('combobox'));
    });
    await step('Only Beta is offered — not the member project or the system project', async () => {
      await expect(await body.findByRole('option', { name: 'Beta Project (beta)' })).toBeInTheDocument();
      await expect(body.getAllByRole('option')).toHaveLength(1);
    });
    await step('Select Beta and add the user', async () => {
      await userEvent.click(body.getByRole('option', { name: 'Beta Project (beta)' }));
      await userEvent.click(canvas.getByRole('button', { name: 'Button to add user to project' }));
    });
    await step('The membership is created', async () => {
      await expect(addMembership).toHaveBeenCalledWith(USER_IRI, 'http://rdfh.ch/projects/0002');
    });
  },
};

export const RemovesUserFromProject: Story = {
  name: 'Removes the user from a project',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click remove on the member project', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: 'Button to remove user from project' }));
    });
    await step('The membership is deleted', async () => {
      await expect(removeMembership).toHaveBeenCalledWith(USER_IRI, MEMBER_PROJECT_IRI);
    });
  },
};
