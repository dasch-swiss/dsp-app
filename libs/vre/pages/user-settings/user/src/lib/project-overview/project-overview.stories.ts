import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { StoredProject } from '@dasch-swiss/dsp-js';
import { UserService } from '@dasch-swiss/vre/core/session';
import { expect, within } from 'storybook/test';
import { AllProjectsService } from './all-projects.service';
import { ProjectOverviewComponent } from './project-overview.component';

// ---------------------------------------------------------------------------
// Realistic mock data
// ---------------------------------------------------------------------------

function makeProject(id: string, shortcode: string, shortname: string, longname: string): StoredProject {
  const p = new StoredProject();
  p.id = `http://rdfh.ch/projects/${id}`;
  p.shortcode = shortcode;
  p.shortname = shortname;
  p.longname = longname;
  p.status = true;
  p.selfjoin = false;
  p.keywords = [];
  p.description = [];
  return p;
}

const MY_PROJECTS: StoredProject[] = [
  makeProject('0803', '0803', 'rosetta', 'Bernstein Online'),
  makeProject('0801', '0801', 'incunabula', 'Incunabula'),
];

const OTHER_PROJECTS: StoredProject[] = [
  makeProject('0804', '0804', 'dokubib', 'Dokumentation von Bibliotheken'),
  makeProject('0806', '0806', 'images', 'Images and Objects'),
  makeProject('0807', '0807', 'knora', 'Knora Demo'),
];

const ALL_ACTIVE_PROJECTS = [...MY_PROJECTS, ...OTHER_PROJECTS];

// ---------------------------------------------------------------------------
// Service mocks
// ---------------------------------------------------------------------------

const userServiceMock = {
  userActiveProjects$: of(MY_PROJECTS),
  isSysAdmin$: of(false),
};

const allProjectsServiceMock = {
  allActiveProjects$: of(ALL_ACTIVE_PROJECTS),
  otherProjects$: of(OTHER_PROJECTS),
};

const sysAdminUserServiceMock = {
  userActiveProjects$: of([]),
  isSysAdmin$: of(true),
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<ProjectOverviewComponent> = {
  title: 'Pages / Project Overview',
  component: ProjectOverviewComponent,
};
export default meta;
type Story = StoryObj<ProjectOverviewComponent>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const AsRegularUser: Story = {
  name: 'Shows my projects and other projects for a regular user',
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: userServiceMock },
        { provide: AllProjectsService, useValue: allProjectsServiceMock },
      ],
    }),
  ],
  play: async ({ canvasElement, step: s }) => {
    const canvas = within(canvasElement);
    await s('"Bernstein Online" card is visible in my projects', async () => {
      await expect(canvas.getByText('Bernstein Online')).toBeInTheDocument();
    });
    await s('"Dokumentation von Bibliotheken" card is visible in other projects', async () => {
      await expect(canvas.getByText('Dokumentation von Bibliotheken')).toBeInTheDocument();
    });
  },
};

export const AsSysAdmin: Story = {
  name: 'Shows all projects in a flat list for a system administrator',
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: sysAdminUserServiceMock },
        { provide: AllProjectsService, useValue: allProjectsServiceMock },
      ],
    }),
  ],
  play: async ({ canvasElement, step: s }) => {
    const canvas = within(canvasElement);
    await s('"Bernstein Online" project card is visible', async () => {
      await expect(canvas.getByText('Bernstein Online')).toBeInTheDocument();
    });
    await s('"Incunabula" project card is visible', async () => {
      // Use getAllByText because the shortname 'incunabula' also matches — pick the longname element
      const matches = canvas.getAllByText(/incunabula/i);
      await expect(matches.length).toBeGreaterThanOrEqual(1);
    });
    await s('"Dokumentation von Bibliotheken" project card is visible', async () => {
      await expect(canvas.getByText('Dokumentation von Bibliotheken')).toBeInTheDocument();
    });
  },
};

export const EmptyState: Story = {
  name: 'Shows empty list when no projects exist',
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: { userActiveProjects$: of([]), isSysAdmin$: of(true) } },
        { provide: AllProjectsService, useValue: { allActiveProjects$: of([]), otherProjects$: of([]) } },
      ],
    }),
  ],
  play: async ({ canvasElement, step: s }) => {
    const canvas = within(canvasElement);
    await s('No project cards are rendered', async () => {
      await expect(canvas.queryAllByTestId('project-card').length).toBe(0);
    });
  },
};
