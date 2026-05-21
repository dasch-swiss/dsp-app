import { ActivatedRoute } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { makeProjectPageServiceStub, STORY_PROVIDERS } from './stories.helpers';
import { ProjectNavigationTabsComponent } from './project-navigation-tabs.component';

const activatedRouteStub = {
  snapshot: { children: [{ url: [{ path: 'data' }] }] },
};

const meta: Meta<ProjectNavigationTabsComponent> = {
  title: 'Pages / Project / Navigation Tabs',
  component: ProjectNavigationTabsComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<ProjectNavigationTabsComponent>;

export const RegularMember: Story = {
  name: 'Shows Data, Search, and Data Models tabs for a regular member',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        { provide: ProjectPageService, useValue: makeProjectPageServiceStub({ hasProjectAdminRights$: of(false) }) },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Data tab is visible', async () => {
      await expect(canvas.getByText('Data')).toBeInTheDocument();
    });
    await step('Search tab is visible', async () => {
      await expect(canvas.getByText('Search')).toBeInTheDocument();
    });
    await step('Data models tab is visible', async () => {
      await expect(canvas.getByText('Data models')).toBeInTheDocument();
    });
    await step('Settings tab is not shown for non-admin', async () => {
      await expect(canvas.queryByText('Settings')).toBeNull();
    });
  },
};

export const ProjectAdmin: Story = {
  name: 'Shows Settings tab for a project admin',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        { provide: ProjectPageService, useValue: makeProjectPageServiceStub({ hasProjectAdminRights$: of(true) }) },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Settings tab is visible for admin', async () => {
      await expect(canvas.getByText('Settings')).toBeInTheDocument();
    });
  },
};
