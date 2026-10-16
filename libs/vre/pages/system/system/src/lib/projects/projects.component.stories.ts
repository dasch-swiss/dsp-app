import { StoredProject } from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { AllProjectsService } from '@dasch-swiss/vre/pages/user-settings/user';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { makeUserServiceStub, STORY_PROVIDERS } from '../stories.helpers';
import { ProjectsComponent } from './projects.component';

const makeProject = (shortcode: string, longname: string): StoredProject =>
  ({
    id: `http://rdfh.ch/projects/${shortcode}`,
    shortcode,
    shortname: longname.toLowerCase(),
    longname,
    status: true,
    selfjoin: false,
    description: [],
    keywords: [],
    ontologies: [],
    logo: null,
  }) as unknown as StoredProject;

const providers = [
  ...STORY_PROVIDERS,
  { provide: AppConfigService, useValue: { dspFeatureFlagsConfig: { allowEraseProjects: false } } },
  { provide: NotificationService, useValue: { openSnackBar: () => {} } },
  {
    provide: AllProjectsService,
    useValue: { allProjects$: of([makeProject('0001', 'Alpha Project'), makeProject('0002', 'Beta Project')]) },
  },
  {
    provide: UserService,
    useValue: {
      ...makeUserServiceStub(),
      userProjects$: of([makeProject('0003', 'My Project')]),
      reloadUser: () => of(undefined),
    },
  },
];

const meta: Meta<ProjectsComponent> = {
  title: 'Pages / System / Projects / Projects',
  component: ProjectsComponent,
  decorators: [applicationConfig({ providers })],
  argTypes: {
    isUsersProjects: {
      description: "Lists only the current user's projects when true, otherwise all projects in DSP.",
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Behavior' },
    },
  },
};
export default meta;
type Story = StoryObj<ProjectsComponent>;

export const ShowsAllProjects: Story = {
  name: 'Shows all projects in DSP',
  args: { isUsersProjects: false },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('All projects are listed', async () => {
      await expect(await canvas.findByText('Alpha Project')).toBeInTheDocument();
      await expect(canvas.getByText('Beta Project')).toBeInTheDocument();
    });
    await step("The user's own project is not listed", async () => {
      await expect(canvas.queryByText('My Project')).toBeNull();
    });
  },
};

export const ShowsOnlyUsersProjects: Story = {
  name: "Shows only the current user's projects",
  args: { isUsersProjects: true },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("The user's project is listed", async () => {
      await expect(await canvas.findByText('My Project')).toBeInTheDocument();
    });
    await step('Other projects are not listed', async () => {
      await expect(canvas.queryByText('Alpha Project')).toBeNull();
    });
  },
};
