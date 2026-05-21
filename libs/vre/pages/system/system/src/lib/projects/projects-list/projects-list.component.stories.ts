import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { StoredProject } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AppConfigService } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { AllProjectsService } from '@dasch-swiss/vre/pages/user-settings/user';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { makeUserServiceStub, STORY_PROVIDERS } from '../../stories.helpers';
import { ProjectsListComponent } from './projects-list.component';

const makeProject = (partial: Partial<StoredProject> = {}): StoredProject =>
  ({
    id: 'http://rdfh.ch/projects/0001',
    shortcode: '0001',
    shortname: 'test',
    longname: 'Test Project',
    status: true,
    selfjoin: false,
    description: [],
    keywords: [],
    ontologies: [],
    logo: null,
    ...partial,
  }) as StoredProject;

const sharedProviders = [
  ...STORY_PROVIDERS,
  { provide: AppConfigService, useValue: { dspFeatureFlagsConfig: { allowEraseProjects: false } } },
  { provide: ProjectApiService, useValue: { update: () => of({}), delete: () => of({}) } },
  { provide: NotificationService, useValue: { openSnackBar: () => {} } },
  { provide: DialogService, useValue: { afterConfirmation: () => of(true) } },
  { provide: AllProjectsService, useValue: { allActiveProjects$: of([]), allInactiveProjects$: of([]) } },
];

const meta: Meta<ProjectsListComponent> = {
  title: 'Pages / System / Projects / Projects List',
  component: ProjectsListComponent,
  argTypes: {
    projectsList: {
      description: 'The list of projects to display.',
      control: 'object',
      table: { type: { summary: 'StoredProject[]' }, category: 'Content' },
    },
    isUserActive: {
      description: 'Whether the list shows active projects. Affects available row actions.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, category: 'State' },
    },
    createNewButtonEnabled: {
      description: 'Shows the "Create new project" button when true and user is sys admin.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Behavior' },
    },
    refreshParent: {
      description: 'Emitted after a project is activated, deactivated, or erased.',
      table: { category: 'Events', type: { summary: 'EventEmitter<void>' } },
    },
  },
};
export default meta;
type Story = StoryObj<ProjectsListComponent>;

export const ActiveProjects: Story = {
  name: 'Shows list of active projects with project count',
  decorators: [applicationConfig({ providers: sharedProviders })],
  args: {
    isUserActive: true,
    projectsList: [
      makeProject({ longname: 'Alpha Project', shortcode: '0001', shortname: 'alpha' }),
      makeProject({ id: 'http://rdfh.ch/projects/0002', longname: 'Beta Project', shortcode: '0002', shortname: 'beta' }),
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Project count header is displayed', async () => {
      await expect(canvas.getByText(/2.*project/i)).toBeInTheDocument();
    });
    await step('Both project names are listed', async () => {
      await expect(canvas.getByText('Alpha Project')).toBeInTheDocument();
      await expect(canvas.getByText('Beta Project')).toBeInTheDocument();
    });
  },
};

export const SingleProject: Story = {
  name: 'Shows singular project count label for one project',
  decorators: [applicationConfig({ providers: sharedProviders })],
  args: {
    isUserActive: true,
    projectsList: [makeProject()],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Singular label is used', async () => {
      await expect(canvas.getByText(/1.*project/i)).toBeInTheDocument();
    });
  },
};

export const InactiveProjects: Story = {
  name: 'Shows lock icon for inactive projects',
  decorators: [applicationConfig({ providers: sharedProviders })],
  args: {
    isUserActive: false,
    projectsList: [makeProject({ status: false })],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Lock icon is shown for inactive project', async () => {
      await expect(canvas.getByText('lock')).toBeInTheDocument();
    });
  },
};

export const WithCreateButton: Story = {
  name: 'Shows create button for sys admin with create permission',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        { provide: UserService, useValue: makeUserServiceStub({ isSysAdmin$: of(true) }) },
      ],
    }),
  ],
  args: {
    isUserActive: true,
    createNewButtonEnabled: true,
    projectsList: [makeProject()],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Create new project button is visible', async () => {
      await expect(canvas.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });
  },
};
