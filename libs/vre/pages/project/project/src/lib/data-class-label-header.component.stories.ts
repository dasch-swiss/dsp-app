import { STORY_PROVIDERS } from '@dasch-swiss/vre/pages/search/search-filters';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { BehaviorSubject } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { DataClassLabelHeaderComponent } from './data-class-label-header.component';
import { DataClassUrlStateService } from './data-class-url-state.service';

/**
 * The sort direction is page state, not an input, so each story supplies its own stub of the URL
 * service rather than setting args. `setSortDescending` writes back into the same subject, which is
 * what the real service does by way of the URL.
 */
const stateStub = (descending: boolean) => {
  const sortDescending$ = new BehaviorSubject(descending);
  return {
    sortDescending$,
    setSortDescending: (value: boolean) => sortDescending$.next(value),
  };
};

const meta: Meta<DataClassLabelHeaderComponent> = {
  title: 'Data Browser / Label Header / Sorting',
  component: DataClassLabelHeaderComponent,
  decorators: [applicationConfig({ providers: STORY_PROVIDERS })],
};

export default meta;
type Story = StoryObj<DataClassLabelHeaderComponent>;

export const ShowsAscendingByDefault: Story = {
  decorators: [applicationConfig({ providers: [{ provide: DataClassUrlStateService, useValue: stateStub(false) }] })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('A–Z')).toBeInTheDocument();
    await expect(canvasElement.querySelector('[role="columnheader"]')).toHaveAttribute('aria-sort', 'ascending');
    // The name describes what activating it will do, not where the sort currently stands.
    await expect(canvas.getByRole('button', { name: 'Sort by label, Z to A' })).toBeInTheDocument();
  },
};

export const ShowsDescendingWhenSorted: Story = {
  decorators: [applicationConfig({ providers: [{ provide: DataClassUrlStateService, useValue: stateStub(true) }] })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Z–A')).toBeInTheDocument();
    await expect(canvasElement.querySelector('[role="columnheader"]')).toHaveAttribute('aria-sort', 'descending');
    await expect(canvas.getByRole('button', { name: 'Sort by label, A to Z' })).toBeInTheDocument();
  },
};

export const RetainsFocusAfterToggling: Story = {
  decorators: [applicationConfig({ providers: [{ provide: DataClassUrlStateService, useValue: stateStub(false) }] })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Sort by label, Z to A' });

    toggle.focus();
    await userEvent.click(toggle);

    // Toggling re-renders the icon, the direction text and the accessible name. A keyboard user who
    // tabbed here must still be here afterwards, or sorting twice becomes impossible without a mouse.
    await expect(canvasElement.querySelector('[role="columnheader"]')).toHaveAttribute('aria-sort', 'descending');
    await expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'Sort by label, A to Z' }));
  },
};
