import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
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
    await step('Tooltip says "expand"', async () => {
      await expect(canvas.getByTestId('side-panel-collapse-btn')).toBeInTheDocument();
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

export const EmitsOnClick: Story = {
  name: 'Emits toggleSidenav when button is clicked',
  args: { expand: false },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click the collapse button', async () => {
      await userEvent.click(canvas.getByTestId('side-panel-collapse-btn'));
    });
    await step('Button is still present after click', async () => {
      await expect(canvas.getByTestId('side-panel-collapse-btn')).toBeInTheDocument();
    });
  },
};
