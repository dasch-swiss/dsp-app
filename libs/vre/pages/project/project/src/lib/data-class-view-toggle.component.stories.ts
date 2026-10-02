import { STORY_PROVIDERS } from '@dasch-swiss/vre/pages/search/search-filters';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { BehaviorSubject } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { DataClassUrlStateService, DataClassView } from './data-class-url-state.service';
import { DataClassViewToggleComponent } from './data-class-view-toggle.component';

/**
 * The toggle reads and writes the URL, so the stories stand a subject in for the real service
 * rather than driving the Router. What matters here is that the component reflects the state it is
 * given and writes the state it is asked to — the URL plumbing itself is the service's business.
 */
class UrlStateStub {
  readonly view$ = new BehaviorSubject<DataClassView>('list');
  /** Recorded rather than mocked: `jest` is not in the stories tsconfig's types. */
  readonly writes: DataClassView[] = [];

  setView(view: DataClassView): void {
    this.writes.push(view);
    this.view$.next(view);
  }
}

const withView = (view: DataClassView) => {
  const stub = new UrlStateStub();
  stub.view$.next(view);
  return stub;
};

const story = (stub: UrlStateStub) => [
  applicationConfig({ providers: [{ provide: DataClassUrlStateService, useValue: stub }] }),
];

/** Held outside the story so its `play` can assert on what the click did or did not write. */
let activeTabStub: UrlStateStub;

const meta: Meta<DataClassViewToggleComponent> = {
  title: 'Data Browser / View Toggle / List and Table',
  component: DataClassViewToggleComponent,
  decorators: [applicationConfig({ providers: STORY_PROVIDERS })],
  argTypes: {
    // No inputs or outputs: the component is bound to `DataClassUrlStateService` rather than to a
    // parent, because the view is URL state and a parent holding it would be a second source.
    view: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<DataClassViewToggleComponent>;

export const MarksListActiveByDefault: Story = {
  decorators: story(withView('list')),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: /List/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: /Table/ })).toHaveAttribute('aria-pressed', 'false');
  },
};

export const MarksTableActiveWhenTheUrlAsksForIt: Story = {
  decorators: story(withView('table')),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: /Table/ })).toHaveAttribute('aria-pressed', 'true');
  },
};

export const SwitchesToTableWhenTableIsClicked: Story = {
  decorators: story(withView('list')),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /Table/ }));

    await expect(canvas.getByRole('button', { name: /Table/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: /List/ })).toHaveAttribute('aria-pressed', 'false');
  },
};

/**
 * `setView` pushes a history entry, so clicking the tab you are already on must not write — Back
 * would otherwise have a no-op navigation to undo.
 */
export const WritesNothingWhenTheActiveTabIsClickedAgain: Story = {
  decorators: (() => {
    activeTabStub = withView('table');
    return story(activeTabStub);
  })(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /Table/ }));

    await expect(canvas.getByRole('button', { name: /Table/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(activeTabStub.writes).toHaveLength(0);
  },
};
