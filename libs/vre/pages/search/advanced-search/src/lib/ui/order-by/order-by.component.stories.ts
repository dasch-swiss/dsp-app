import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, fn, userEvent, within } from 'storybook/test';
import { OrderByItem } from '../../model';
import { DerivedSearchStateService } from '../../service/derived-search-state.service';
import { SearchUrlSyncService } from '../../service/search-url-sync.service';
import { makeDerivedSearchStateServiceStub, STORY_PROVIDERS } from '../../stories.helpers';
import { toLabels } from '../../util/labels';
import { OrderByComponent } from './order-by.component';

const SAMPLE_ORDER_BY_ITEMS: OrderByItem[] = [
  new OrderByItem('prop1', toLabels('Title')),
  new OrderByItem('prop2', toLabels('Author')),
  new OrderByItem('prop3', toLabels('Date')),
];

// Shared spy for the direction-toggle story: a module-level reference the provider can close over,
// mock-cleared inside the play run so the assertion sees only that run's calls.
const writeState = fn().mockName('writeState');

const meta: Meta<OrderByComponent> = {
  title: 'Search / Advanced Search / Search bar / 5. Order By',
  component: OrderByComponent,
};
export default meta;
type Story = StoryObj<OrderByComponent>;

export const DisabledWhenNoItems: Story = {
  name: 'Button is disabled when there are no orderable properties',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: DerivedSearchStateService, useValue: makeDerivedSearchStateServiceStub() },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Order by button is disabled', async () => {
      const btn = canvasElement.querySelector('button');
      await expect(btn?.hasAttribute('disabled')).toBe(true);
    });
  },
};

export const EnabledWithItems: Story = {
  name: 'Button is enabled when orderable properties exist',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        {
          provide: DerivedSearchStateService,
          useValue: makeDerivedSearchStateServiceStub({ orderByItems$: of(SAMPLE_ORDER_BY_ITEMS) }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Order by button is enabled', async () => {
      const btn = canvasElement.querySelector('button');
      await expect(btn?.hasAttribute('disabled')).toBe(false);
    });
  },
};

export const OpensPopoverOnClick: Story = {
  name: 'Opens order-by list popover when clicked',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        {
          provide: DerivedSearchStateService,
          useValue: makeDerivedSearchStateServiceStub({ orderByItems$: of(SAMPLE_ORDER_BY_ITEMS) }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click Order by button', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('Selection list is visible in the overlay', async () => {
      const list = document.querySelector('mat-selection-list');
      await expect(list).not.toBeNull();
    });
    await step('All orderable properties appear as options', async () => {
      const options = document.querySelectorAll('mat-list-option');
      await expect(options.length).toBe(SAMPLE_ORDER_BY_ITEMS.length);
    });
  },
};

export const ShowsDisabledItemWithTooltip: Story = {
  name: 'Shows disabled items for non-orderable properties',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        {
          provide: DerivedSearchStateService,
          useValue: makeDerivedSearchStateServiceStub({
            orderByItems$: of([
              new OrderByItem('prop1', toLabels('Title')),
              new OrderByItem('prop2', toLabels('Link (disabled)'), true),
            ]),
          }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click to open', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('Disabled item is present', async () => {
      const options = Array.from(document.querySelectorAll('mat-list-option'));
      await expect(
        options.some(o => o.hasAttribute('disabled') || o.classList.contains('mdc-list-item--disabled'))
      ).toBe(true);
    });
  },
};

export const ShowsAscendingArrowForActiveItem: Story = {
  name: 'Ascending arrow shows on the trigger button and active item by default',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        {
          provide: DerivedSearchStateService,
          useValue: makeDerivedSearchStateServiceStub({
            orderByItems$: of([new OrderByItem('prop1', toLabels('Title'), false, true, 'asc')]),
          }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Trigger button shows the ascending (upward) arrow while closed', async () => {
      const icons = Array.from(canvasElement.querySelectorAll('.direction-icon mat-icon')).map(i =>
        i.textContent?.trim()
      );
      await expect(icons).toContain('arrow_upward');
      await expect(icons).not.toContain('arrow_downward');
    });
    await step('Open the popover', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('Active item shows the ascending (upward) arrow', async () => {
      const icons = Array.from(document.querySelectorAll('mat-list-option mat-icon')).map(i => i.textContent?.trim());
      await expect(icons).toContain('arrow_upward');
      await expect(icons).not.toContain('arrow_downward');
    });
  },
};

export const ShowsDescendingArrowWhenDirectionIsDesc: Story = {
  name: 'Descending arrow shows on the trigger button and active item when direction is desc',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        {
          provide: DerivedSearchStateService,
          useValue: makeDerivedSearchStateServiceStub({
            orderByItems$: of([new OrderByItem('prop1', toLabels('Title'), false, true, 'desc')]),
          }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Trigger button shows the descending (downward) arrow while closed', async () => {
      const icons = Array.from(canvasElement.querySelectorAll('.direction-icon mat-icon')).map(i =>
        i.textContent?.trim()
      );
      await expect(icons).toContain('arrow_downward');
      await expect(icons).not.toContain('arrow_upward');
    });
    await step('Open the popover', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('Active item shows the descending (downward) arrow', async () => {
      const icons = Array.from(document.querySelectorAll('mat-list-option mat-icon')).map(i => i.textContent?.trim());
      await expect(icons).toContain('arrow_downward');
      await expect(icons).not.toContain('arrow_upward');
    });
  },
};

export const TogglingDirectionWritesFlippedOrderDir: Story = {
  name: 'Clicking the arrow flips the sort direction to desc in the URL',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        {
          provide: DerivedSearchStateService,
          useValue: makeDerivedSearchStateServiceStub({
            orderByItems$: of([new OrderByItem('prop1', toLabels('Title'), false, true, 'asc')]),
          }),
        },
        // Override the no-op stub with a spy so we can assert what the toggle writes to the URL.
        { provide: SearchUrlSyncService, useValue: { params$: of({}), writeState } as Partial<SearchUrlSyncService> },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    writeState.mockClear();
    await step('Open the popover', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('Click the ascending arrow on the active item', async () => {
      const arrow = Array.from(document.querySelectorAll('mat-list-option button')).find(
        b => b.querySelector('mat-icon')?.textContent?.trim() === 'arrow_upward'
      );
      await userEvent.click(arrow as HTMLElement);
    });
    await step('URL is updated with orderBy and orderDir=desc', async () => {
      await expect(writeState).toHaveBeenCalledWith({ orderBy: 'prop1', orderDir: 'desc' }, { replaceUrl: false });
    });
  },
};
