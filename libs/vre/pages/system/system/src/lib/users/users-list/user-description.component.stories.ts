import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { makeReadUser, STORY_PROVIDERS } from '../../stories.helpers';
import { UserDescriptionComponent } from './user-description.component';

const meta: Meta<UserDescriptionComponent> = {
  title: 'Pages / System / Users / User Description',
  component: UserDescriptionComponent,
  argTypes: {
    user: {
      description: 'The user object to display.',
      control: 'object',
      table: { type: { summary: 'ReadUser' }, category: 'Content' },
    },
  },
};
export default meta;
type Story = StoryObj<UserDescriptionComponent>;

export const DefaultUser: Story = {
  name: 'Shows user full name, username, and email',
  decorators: [applicationConfig({ providers: STORY_PROVIDERS })],
  args: {
    user: makeReadUser(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Full name is displayed', async () => {
      await expect(canvas.getByText('Jane Doe')).toBeInTheDocument();
    });
    await step('Username and email are displayed', async () => {
      await expect(canvas.getByText(/testuser.*test@example\.com/)).toBeInTheDocument();
    });
  },
};

export const LongName: Story = {
  name: 'Renders user with a long name without overflow issues',
  decorators: [applicationConfig({ providers: STORY_PROVIDERS })],
  args: {
    user: makeReadUser({
      givenName: 'Bartholomew-Alexander',
      familyName: 'Vandenberghe-Hutchinson',
      username: 'bvandenberghe',
      email: 'b.vandenberghe@institution.example.com',
    }),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Full name is visible', async () => {
      await expect(canvas.getByText('Bartholomew-Alexander Vandenberghe-Hutchinson')).toBeInTheDocument();
    });
  },
};
