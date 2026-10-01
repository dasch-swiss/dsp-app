import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, fn, userEvent, within } from 'storybook/test';
import { provideSearchFilters } from '../../providers';
import { SearchFilterState } from '../../search-filter-state';
import { OntologyDataService } from '../../service/ontology-data.service';
import {
  SEARCH_FILTER_SERVICE_STUBS,
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
    density: {
      description:
        'Control sizing. `compact` (30px controls, 13px text) is the Data tab treatment for a narrow split column; `standard` is Material default sizing.',
    },
    searchFieldWidth: { description: 'CSS width of the fulltext field. The Data tab passes a narrower value.' },
    searchLabelKey: { description: 'Translation key for the fulltext field label.' },
    searchPlaceholderKey: { description: 'Translation key for the fulltext field placeholder.' },
  },
};
export default meta;
type Story = StoryObj<AdvancedSearchBarComponent>;

const baseProviders = [
  ...STORY_PROVIDERS,
  importProvidersFrom(OverlayModule),
  { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
  ...provideSearchFilters(),
  ...SEARCH_FILTER_SERVICE_STUBS,
  { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
];

export const Empty: Story = {
  name: 'Shows chip bar with no active filters',
  args: { projectUuid: '0001' },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
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
        ...provideSearchFilters(),
        ...SEARCH_FILTER_SERVICE_STUBS,
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub({ ontologyLoading$: of(true) }) },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Progress bar is visible', async () => {
      await expect(canvasElement.querySelector('mat-progress-bar')).not.toBeNull();
    });
    await step('Chip bar content is hidden during loading', async () => {
      await expect(canvasElement.querySelector('app-add-filter-button')).toBeNull();
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

// Emits an active search state (a fulltext term) so the Reset button shows, and spies on reset.
const reset = fn().mockName('reset');
const activeSearchState = {
  params$: of({ q: 'foo' }),
  readParams: () => ({ q: 'foo' }),
  writeState: () => {},
  clearAll: reset,
  encodeFilters: () => '',
  decodeFilters: () => [],
  filters$: of([]),
  fulltextTerm$: of('foo'),
  ontologyIri$: of(undefined),
  resourceClassIri$: of(undefined),
  hasActiveState$: of(true),
  setFulltextTerm: () => {},
  setFilters: () => {},
  reset,
};

const activeStateStub = {
  provide: SearchFilterState,
  useValue: activeSearchState as unknown as SearchFilterState,
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
        ...provideSearchFilters(),
        ...SEARCH_FILTER_SERVICE_STUBS,
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
        // Override the default (empty) stub last so active state wins.
        activeStateStub,
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    reset.mockClear();
    await step('Reset button is visible', async () => {
      await expect(canvas.getByRole('button', { name: /Reset/i })).toBeTruthy();
    });
    await step('Clicking Reset clears the search state', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Reset/i }));
      await expect(reset).toHaveBeenCalled();
    });
  },
};

// A state carrying a term, with a spy on the clear path.
const setFulltextTerm = fn().mockName('setFulltextTerm');
const termStateStub = {
  provide: SearchFilterState,
  useValue: {
    ...activeSearchState,
    setFulltextTerm,
  } as unknown as SearchFilterState,
};

export const ShowsClearControlWhenTermIsSet: Story = {
  name: 'Search field offers a clear control once a term is entered',
  args: { projectUuid: '0001' },
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
        ...provideSearchFilters(),
        ...SEARCH_FILTER_SERVICE_STUBS,
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
        termStateStub,
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    setFulltextTerm.mockClear();
    await step('Clear control is rendered while the field holds a term', async () => {
      await expect(canvasElement.querySelector('[data-cy="clear-search-btn"]')).not.toBeNull();
    });
    await step('Clicking it clears the term immediately, without waiting out the debounce', async () => {
      await userEvent.click(canvasElement.querySelector('[data-cy="clear-search-btn"]') as HTMLElement);
      await expect(setFulltextTerm).toHaveBeenCalledWith(undefined);
    });
  },
};

export const HidesClearControlWhenEmpty: Story = {
  name: 'Search field shows the search icon, not a clear control, when empty',
  args: { projectUuid: '0001' },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('No clear control is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="clear-search-btn"]')).toBeNull();
    });
  },
};

export const CompactDensityForTheDataTab: Story = {
  name: 'Compact density shrinks the controls for a narrow column',
  args: { projectUuid: '0001', density: 'compact', searchFieldWidth: '260px' },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('The host carries the compact class, so the density tokens apply', async () => {
      await expect(canvasElement.querySelector('app-advanced-search-bar.compact')).not.toBeNull();
    });
    await step('The search field honours the narrower width', async () => {
      const field = canvasElement.querySelector('mat-form-field') as HTMLElement;
      await expect(field.style.width).toBe('260px');
    });
  },
};
