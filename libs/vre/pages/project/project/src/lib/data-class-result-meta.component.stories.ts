import { STORY_PROVIDERS } from '@dasch-swiss/vre/pages/search/search-filters';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { DataClassResultMetaComponent } from './data-class-result-meta.component';

/**
 * The count and page position are page state rather than inputs, so each story seeds a real
 * `ResourceResultService` instead of setting args.
 */
const seeded = (total: number | null, pageIndex = 0) => {
  const service = new ResourceResultService();
  service.numberOfResults = total;
  service.updatePageIndex(pageIndex);
  return service;
};

const meta: Meta<DataClassResultMetaComponent> = {
  title: 'Data Browser / Result Meta / Pagination',
  component: DataClassResultMetaComponent,
  decorators: [applicationConfig({ providers: STORY_PROVIDERS })],
};

export default meta;
type Story = StoryObj<DataClassResultMetaComponent>;

export const ShowsRangeAndPagerOnTheFirstPage: Story = {
  decorators: [applicationConfig({ providers: [{ provide: ResourceResultService, useValue: seeded(4024, 0) }] })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('1 – 25 of 4024')).toBeInTheDocument();
    await expect(canvas.getByRole('spinbutton', { name: 'Page number' })).toHaveValue(1);
    await expect(canvas.getByText('of 161')).toBeInTheDocument();
  },
};

export const DisablesTheStartControlsOnTheFirstPage: Story = {
  decorators: [applicationConfig({ providers: [{ provide: ResourceResultService, useValue: seeded(4024, 0) }] })],
  play: async ({ canvasElement }) => {
    // Rendered, not hidden: a pager that changes width at its edges moves the next target under
    // the cursor just as you reach for it.
    const buttons = [...canvasElement.querySelectorAll('[data-cy=result-pager] button')];
    await expect(buttons).toHaveLength(4);
    await expect(buttons[0]).toBeDisabled();
    await expect(buttons[1]).toBeDisabled();
    await expect(buttons[3]).toBeEnabled();
  },
};

export const ClampsTheRangeOnAPartialLastPage: Story = {
  decorators: [applicationConfig({ providers: [{ provide: ResourceResultService, useValue: seeded(4024, 160) }] })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('4001 – 4024 of 4024')).toBeInTheDocument();
  },
};

export const OmitsThePagerWhenEverythingFitsOnOnePage: Story = {
  decorators: [applicationConfig({ providers: [{ provide: ResourceResultService, useValue: seeded(19, 0) }] })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('1 – 19 of 19')).toBeInTheDocument();
    await expect(canvasElement.querySelector('[data-cy=result-pager]')).toBeNull();
  },
};

export const AdvancesThePageWhenNextIsClicked: Story = {
  decorators: [applicationConfig({ providers: [{ provide: ResourceResultService, useValue: seeded(4024, 0) }] })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));

    await expect(canvas.getByText('26 – 50 of 4024')).toBeInTheDocument();
    await expect(canvas.getByRole('spinbutton', { name: 'Page number' })).toHaveValue(2);
  },
};

export const GoesToATypedPageOnEnter: Story = {
  decorators: [applicationConfig({ providers: [{ provide: ResourceResultService, useValue: seeded(4024, 0) }] })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('spinbutton', { name: 'Page number' });

    await userEvent.click(input);
    await userEvent.keyboard('12{Enter}');

    await expect(canvas.getByText('276 – 300 of 4024')).toBeInTheDocument();
    await expect(input).toHaveValue(12);
  },
};

/** "999" means "as far as it goes", not an empty page. */
export const ClampsATypedPageBeyondTheLastToTheLast: Story = {
  decorators: [applicationConfig({ providers: [{ provide: ResourceResultService, useValue: seeded(4024, 0) }] })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('spinbutton', { name: 'Page number' });

    await userEvent.click(input);
    await userEvent.keyboard('999{Enter}');

    await expect(canvas.getByText('4001 – 4024 of 4024')).toBeInTheDocument();
    await expect(input).toHaveValue(161);
  },
};

/** Typing without Enter changes nothing, and leaving the field shows the page the table is on. */
export const RestoresTheCurrentPageWhenLeftWithoutEnter: Story = {
  decorators: [applicationConfig({ providers: [{ provide: ResourceResultService, useValue: seeded(4024, 0) }] })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('spinbutton', { name: 'Page number' });

    await userEvent.click(input);
    await userEvent.keyboard('7');
    await userEvent.tab();

    await expect(canvas.getByText('1 – 25 of 4024')).toBeInTheDocument();
    await expect(input).toHaveValue(1);
  },
};

/** Results already on screen and the next ones on their way, as after a filter or page change. */
const refreshing = () => {
  const service = seeded(4024, 0);
  service.markLoaded();
  service.markLoading();
  return service;
};

/**
 * The count and pager describe the results being replaced, so they wait with them: greyed, and
 * not clickable into a page of a result set that is about to change.
 */
export const GreysAndLocksThePagerWhileResultsReload: Story = {
  decorators: [applicationConfig({ providers: [{ provide: ResourceResultService, useValue: refreshing() }] })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvasElement.querySelector('.result-meta')).toHaveClass('is-refreshing');
    for (const button of Array.from(canvasElement.querySelectorAll('[data-cy=result-pager] button'))) {
      await expect(button).toBeDisabled();
    }
    await expect(canvas.getByRole('spinbutton', { name: 'Page number' })).toBeDisabled();
  },
};

export const StatesTheCountIsUnavailableWhenTheCountQueryFailed: Story = {
  decorators: [applicationConfig({ providers: [{ provide: ResourceResultService, useValue: seeded(null, 0) }] })],
  play: async ({ canvasElement }) => {
    // The pager cannot be sized against an unknown total, so paging goes away rather than guessing.
    await expect(canvasElement.querySelector('[data-cy=count-unavailable]')).not.toBeNull();
    await expect(canvasElement.querySelector('[data-cy=result-pager]')).toBeNull();
  },
};
