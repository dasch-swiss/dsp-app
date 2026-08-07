import { Visibility } from '@dasch-swiss/vre/3rd-party-services/open-api';
import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { VisibilityCellComponent } from './visibility-cell.component';

const meta: Meta<VisibilityCellComponent> = {
  title: 'Project Settings / View Restrictions / Visibility Cell',
  component: VisibilityCellComponent,
  argTypes: {
    visibility: {
      description:
        'How visible the item is to this audience. `Visible` deliberately renders no icon (to cut ' +
        'visual density) and relies on the accessible label instead.',
      control: 'select',
      options: [Visibility.Hidden, Visibility.RestrictedView, Visibility.Visible, undefined],
      table: { category: 'Inputs', type: { summary: 'Visibility | undefined' } },
    },
  },
};
export default meta;
type Story = StoryObj<VisibilityCellComponent>;

export const Hidden: Story = {
  name: 'Shows a crossed-out eye when the item is hidden',
  args: { visibility: Visibility.Hidden },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Renders the visibility_off icon', async () => {
      await expect(canvasElement.querySelector('mat-icon')?.textContent?.trim()).toBe('visibility_off');
    });
    await step('Cell is labelled "Hidden" for assistive tech', async () => {
      await expect(canvas.getByLabelText('Hidden')).toBeInTheDocument();
    });
  },
};

export const RestrictedView: Story = {
  name: 'Shows a blur icon when the item is only available in restricted view',
  args: { visibility: Visibility.RestrictedView },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Renders the blur_on icon', async () => {
      await expect(canvasElement.querySelector('mat-icon')?.textContent?.trim()).toBe('blur_on');
    });
    await step('Cell is labelled "Restricted view"', async () => {
      await expect(canvas.getByLabelText('Restricted view')).toBeInTheDocument();
    });
  },
};

export const VisibleRendersNoIconButStaysLabelled: Story = {
  name: 'Renders no icon when visible but still exposes an accessible label',
  args: { visibility: Visibility.Visible },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('No icon is rendered, keeping the matrix visually sparse', async () => {
      await expect(canvasElement.querySelector('mat-icon')).toBeNull();
    });
    await step('The cell is still named, so it is not an empty cell to a screen reader', async () => {
      await expect(canvas.getByLabelText('Visible')).toBeInTheDocument();
    });
  },
};

export const UndefinedIsTreatedAsVisible: Story = {
  name: 'Treats a missing visibility as visible',
  args: { visibility: undefined },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Falls back to the visible state', async () => {
      await expect(canvasElement.querySelector('mat-icon')).toBeNull();
      await expect(canvas.getByLabelText('Visible')).toBeInTheDocument();
    });
  },
};
