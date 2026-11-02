import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { BehaviorSubject } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { DataClassUrlStateService, DataClassView } from './data-class-url-state.service';
import { DataClassViewToggleComponent } from './data-class-view-toggle.component';

class UrlStateStub {
  readonly view$ = new BehaviorSubject<DataClassView>('list');
  /** Recorded, not mocked: `jest` is not in the stories tsconfig's types. */
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

/**
 * No `STORY_PROVIDERS` decorator: its `TranslateLoader` overrides the real `en.json`, so the tab
 * names would render as raw keys.
 */
const meta: Meta<DataClassViewToggleComponent> = {
  title: 'Data Browser / View Toggle / List and Table',
  component: DataClassViewToggleComponent,
  argTypes: {
    // No inputs or outputs: the view is URL state, read from `DataClassUrlStateService`.
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
