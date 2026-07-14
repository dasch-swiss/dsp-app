import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, fn, userEvent, within } from 'storybook/test';
import { provideAdvancedSearch } from '../../providers';
import { OntologyDataService } from '../../service/ontology-data.service';
import { SearchUrlSyncService } from '../../service/search-url-sync.service';
import {
  ADVANCED_SEARCH_SERVICE_STUBS,
  makeDspApiConnectionStub,
  makeOntologyDataServiceStub,
  STORY_PROVIDERS,
} from '../../stories.helpers';
import { AdvancedSearchBarComponent } from './advanced-search-bar.component';

const meta: Meta<AdvancedSearchBarComponent> = {
  title: 'Search / Advanced Search / Search Bar',
  component: AdvancedSearchBarComponent,
  argTypes: {
    projectUuid: { description: 'UUID of the project whose ontologies are loaded.' },
  },
};
export default meta;
type Story = StoryObj<AdvancedSearchBarComponent>;

const baseProviders = [
  ...STORY_PROVIDERS,
  importProvidersFrom(OverlayModule),
  { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
  ...provideAdvancedSearch(),
  ...ADVANCED_SEARCH_SERVICE_STUBS,
  { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
];

export const Empty: Story = {
  name: 'Shows chip bar with no active filters',
  args: { projectUuid: '0001' },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Data model chip is rendered', async () => {
      await expect(canvasElement.querySelector('app-data-model-chip')).not.toBeNull();
    });
    await step('Resource class chip is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-class-chip')).not.toBeNull();
    });
    await step('Add filter button is rendered', async () => {
      await expect(canvasElement.querySelector('app-add-filter-button')).not.toBeNull();
    });
    await step('Fulltext search input is rendered', async () => {
      await expect(canvasElement.querySelector('input[matInput]')).not.toBeNull();
    });
  },
};

export const LoadingState: Story = {
  name: 'Shows progress bar while ontologies are loading',
  args: { projectUuid: '0001' },
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
        ...provideAdvancedSearch(),
        ...ADVANCED_SEARCH_SERVICE_STUBS,
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub({ ontologyLoading$: of(true) }) },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Progress bar is visible', async () => {
      await expect(canvasElement.querySelector('mat-progress-bar')).not.toBeNull();
    });
    await step('Chip bar content is hidden during loading', async () => {
      await expect(canvasElement.querySelector('app-data-model-chip')).toBeNull();
    });
  },
};

export const HidesResetWhenNoActiveState: Story = {
  name: 'Reset button is hidden when nothing is set',
  args: { projectUuid: '0001' },
  // The default url-sync stub emits empty params (`of({})`), so hasActiveState$ is false.
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('No Reset button is rendered', async () => {
      const buttons = Array.from(canvasElement.querySelectorAll('button'));
      await expect(buttons.some(b => b.textContent?.includes('Reset'))).toBe(false);
    });
  },
};

// Emits an active search state (a fulltext term) so the Reset button shows, and spies on clearAll.
const clearAll = fn().mockName('clearAll');
const activeUrlSyncStub = {
  provide: SearchUrlSyncService,
  useValue: {
    params$: of({ q: 'foo' }),
    readParams: () => ({ q: 'foo' }),
    writeState: () => {},
    clearAll,
    encodeFilters: () => '',
    decodeFilters: () => [],
  } as Partial<SearchUrlSyncService>,
};

export const ShowsResetWhenActiveAndClearsOnClick: Story = {
  name: 'Reset button shows when a search is active and clears everything on click',
  args: { projectUuid: '0001' },
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
        ...provideAdvancedSearch(),
        ...ADVANCED_SEARCH_SERVICE_STUBS,
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
        // Override the default (empty) url-sync stub last so active state wins.
        activeUrlSyncStub,
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    clearAll.mockClear();
    await step('Reset button is visible', async () => {
      await expect(canvas.getByRole('button', { name: /Reset/i })).toBeTruthy();
    });
    await step('Clicking Reset calls clearAll', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Reset/i }));
      await expect(clearAll).toHaveBeenCalled();
    });
  },
};
