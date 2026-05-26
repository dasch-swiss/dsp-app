import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ProjectSidenavCollapseButtonComponent } from './project-sidenav-collapse-button.component';

const meta: Meta<ProjectSidenavCollapseButtonComponent> = {
  title: 'Pages / Project / Sidenav / Collapse Button',
  component: ProjectSidenavCollapseButtonComponent,
  argTypes: {
    expand: {
      description: 'When true the sidenav is collapsed and the button points right; when false it points left.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, category: 'State' },
    },
    toggleSidenav: {
      description: 'Emitted when the button is clicked.',
      table: { category: 'Events', type: { summary: 'EventEmitter<void>' } },
    },
  },
};
export default meta;
type Story = StoryObj<ProjectSidenavCollapseButtonComponent>;

export const Collapsed: Story = {
  name: 'Shows chevron_right icon when sidenav is collapsed',
  args: { expand: true },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Right-pointing chevron is displayed', async () => {
      await expect(canvas.getByText('chevron_right')).toBeInTheDocument();
    });
  },
};

export const Expanded: Story = {
  name: 'Shows chevron_left icon when sidenav is expanded',
  args: { expand: false },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Left-pointing chevron is displayed', async () => {
      await expect(canvas.getByText('chevron_left')).toBeInTheDocument();
    });
  },
};

const toggleSpy = fn();

export const EmitsOnClick: Story = {
  name: 'Emits toggleSidenav when button is clicked',
  render: () => ({
    props: { expand: false, toggleSidenav: toggleSpy },
    template: `<app-project-sidenav-collapse-button [expand]="expand" (toggleSidenav)="toggleSidenav()"></app-project-sidenav-collapse-button>`,
  }),
  play: async ({ canvasElement, step }) => {
    toggleSpy.mockClear();
    await step('Click the collapse button', async () => {
      await userEvent.click(canvasElement.querySelector('button') as HTMLElement);
    });
    await step('toggleSidenav output was emitted', async () => {
      await expect(toggleSpy).toHaveBeenCalledTimes(1);
    });
  },
};
