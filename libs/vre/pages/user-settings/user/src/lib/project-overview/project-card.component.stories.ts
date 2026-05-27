import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { makeStoredProject, STORY_PROVIDERS } from '../stories.helpers';
import { ProjectCardComponent } from './project-card.component';

const meta: Meta<ProjectCardComponent> = {
  title: 'Pages / User Settings / Project Card',
  component: ProjectCardComponent,
  argTypes: {
    project: {
      description: 'The project to display in the card.',
      control: 'object',
      table: { type: { summary: 'StoredProject' }, category: 'Content' },
    },
    index: {
      description: 'Position index of the card in the grid, used for animation staggering.',
      control: 'number',
      table: { type: { summary: 'number' }, category: 'Content' },
    },
  },
};
export default meta;
type Story = StoryObj<ProjectCardComponent>;

export const DefaultCard: Story = {
  name: 'Shows project name, shortname and shortcode',
  decorators: [applicationConfig({ providers: STORY_PROVIDERS })],
  args: {
    project: makeStoredProject({ longname: 'Incunabula', shortname: 'incunabula', shortcode: '0801' }),
    index: 0,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Project longname is displayed', async () => {
      await expect(canvas.getByText('Incunabula')).toBeInTheDocument();
    });
    await step('Shortname and shortcode are displayed', async () => {
      await expect(canvas.getByText('incunabula')).toBeInTheDocument();
      await expect(canvas.getByText('0801')).toBeInTheDocument();
    });
  },
};

export const LongProjectName: Story = {
  name: 'Renders card with a long project name without overflow',
  decorators: [applicationConfig({ providers: STORY_PROVIDERS })],
  args: {
    project: makeStoredProject({
      longname: 'Bernstein — The Memory of Paper: Watermarks in the Middle Ages and Early Modern Period',
      shortname: 'bernstein',
      shortcode: '0803',
    }),
    index: 1,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Card wrapper is present', async () => {
      await expect(canvas.getByTestId('project-card')).toBeInTheDocument();
    });
  },
};
