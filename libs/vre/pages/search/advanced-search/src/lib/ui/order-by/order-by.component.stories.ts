import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { OrderByItem } from '../../model';
import { SearchDerivationService } from '../../service/search-derivation.service';
import { makeSearchDerivationServiceStub, STORY_PROVIDERS } from '../../stories.helpers';
import { toLabels } from '../../util/labels';
import { OrderByComponent } from './order-by.component';

const SAMPLE_ORDER_BY_ITEMS: OrderByItem[] = [
  new OrderByItem('prop1', toLabels('Title')),
  new OrderByItem('prop2', toLabels('Author')),
  new OrderByItem('prop3', toLabels('Date')),
];

const meta: Meta<OrderByComponent> = {
  title: 'Search / Advanced Search / Chip Bar / 5. Order By',
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
        { provide: SearchDerivationService, useValue: makeSearchDerivationServiceStub() },
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
          provide: SearchDerivationService,
          useValue: makeSearchDerivationServiceStub({ orderByItems$: of(SAMPLE_ORDER_BY_ITEMS) }),
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
          provide: SearchDerivationService,
          useValue: makeSearchDerivationServiceStub({ orderByItems$: of(SAMPLE_ORDER_BY_ITEMS) }),
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
          provide: SearchDerivationService,
          useValue: makeSearchDerivationServiceStub({
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
