import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { OrderByService } from '../service/order-by.service';
import { QueryExecutionService } from '../service/query-execution.service';
import { SearchStateService } from '../service/search-state.service';
import {
  makeDspApiConnectionStub,
  makeOrderByServiceStub,
  makeQueryExecutionServiceStub,
  makeSearchStateServiceStub,
  STORY_PROVIDERS,
} from '../stories.helpers';
import { AdvancedSearchFooterComponent } from './advanced-search-footer.component';

const meta: Meta<AdvancedSearchFooterComponent> = {
  title: 'Search / Advanced Search / 3. Footer',
  component: AdvancedSearchFooterComponent,
  argTypes: {
    searchTriggered: { description: 'Emitted when Search button is clicked.' },
    resetTriggered: { description: 'Emitted when Reset button is clicked.' },
    restorePreviousSearch: { description: 'Emitted when Use previous search button is clicked.' },
  },
};
export default meta;
type Story = StoryObj<AdvancedSearchFooterComponent>;

const sharedProviders = [
  ...STORY_PROVIDERS,
  importProvidersFrom(OverlayModule),
  { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
  { provide: SearchStateService, useValue: makeSearchStateServiceStub() },
  { provide: QueryExecutionService, useValue: makeQueryExecutionServiceStub() },
  { provide: OrderByService, useValue: makeOrderByServiceStub() },
];

export const SearchEnabled: Story = {
  name: 'Shows enabled search button when form is valid',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Search button is enabled', async () => {
      const searchButton = canvas.getByText('Search');
      await expect(searchButton).toBeInTheDocument();
    });
    await step('Reset button is visible', async () => {
      await expect(canvas.getByText('Reset')).toBeInTheDocument();
    });
    await step('Use previous search button is visible', async () => {
      await expect(canvas.getByText('Use previous search')).toBeInTheDocument();
    });
  },
};

export const SearchDisabled: Story = {
  name: 'Disables search button when form state is invalid',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: SearchStateService,
          useValue: makeSearchStateServiceStub({ isFormStateValidAndComplete$: of(false) }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Search button is disabled', async () => {
      const searchButton = canvas.getByText('Search').closest('button');
      await expect(searchButton).toBeDisabled();
    });
  },
};

export const QueryExecuting: Story = {
  name: 'Shows loading state on search button while query is executing',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        { provide: QueryExecutionService, useValue: makeQueryExecutionServiceStub({ queryIsExecuting: true }) },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Footer component renders', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};
