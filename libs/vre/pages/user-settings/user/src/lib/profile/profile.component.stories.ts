import { UserService } from '@dasch-swiss/vre/core/session';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { makeReadUser, makeSystemAdminUser, makeUserServiceStub, STORY_PROVIDERS } from '../stories.helpers';
import { ProfileComponent } from './profile.component';

const meta: Meta<ProfileComponent> = {
  title: 'Pages / User Settings / 1. Profile',
  component: ProfileComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<ProfileComponent>;

export const RegularUser: Story = {
  name: 'Shows user name, username, and language chip for a regular user',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        { provide: UserService, useValue: makeUserServiceStub({ isSysAdmin$: of(false) }) },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Full name is displayed', async () => {
      await expect(canvas.getByText('Jane Doe')).toBeInTheDocument();
    });
    await step('Username is displayed', async () => {
      await expect(canvas.getByText('(testuser)')).toBeInTheDocument();
    });
    await step('Language chip is displayed', async () => {
      await expect(canvas.getByText('en')).toBeInTheDocument();
    });
    await step('System admin badge is not shown', async () => {
      await expect(canvas.queryByText('System admin')).toBeNull();
    });
  },
};

export const SystemAdmin: Story = {
  name: 'Shows system admin badge for system admin user',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        {
          provide: UserService,
          useValue: makeUserServiceStub({
            user$: of(makeSystemAdminUser()),
            isSysAdmin$: of(true),
          }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('System admin badge is displayed', async () => {
      await expect(canvas.getByText('System admin')).toBeInTheDocument();
    });
  },
};

export const DifferentLanguage: Story = {
  name: 'Shows the correct language chip when user language is not English',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        {
          provide: UserService,
          useValue: makeUserServiceStub({
            user$: of(makeReadUser({ lang: 'de', givenName: 'Hans', familyName: 'Müller', username: 'hmueller' })),
          }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Language chip shows "de"', async () => {
      await expect(canvas.getByText('de')).toBeInTheDocument();
    });
    await step('User name is displayed', async () => {
      await expect(canvas.getByText('Hans Müller')).toBeInTheDocument();
    });
  },
};
