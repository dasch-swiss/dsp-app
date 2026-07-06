import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';
import { provideAdvancedSearch } from '../../providers';
import { OntologyDataService } from '../../service/ontology-data.service';
import { QueryExecutionService } from '../../service/query-execution.service';
import {
  ADVANCED_SEARCH_SERVICE_STUBS,
  makeDspApiConnectionStub,
  makeOntologyDataServiceStub,
  makeQueryExecutionServiceStub,
  SAMPLE_RESOURCE_CLASSES,
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
  { provide: QueryExecutionService, useValue: makeQueryExecutionServiceStub() },
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

export const WithActiveFilters: Story = {
  name: 'Shows no filter chips before a filter is confirmed',
  args: { projectUuid: '0001' },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('No filter chips rendered before confirming a filter', async () => {
      await expect(canvasElement.querySelector('app-filter-chip')).toBeNull();
    });
    await step('Add filter button is present', async () => {
      await expect(canvasElement.querySelector('app-add-filter-button')).not.toBeNull();
    });
  },
};

export const SearchDisabled: Story = {
  name: 'Renders chip bar when form is incomplete',
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
        { provide: QueryExecutionService, useValue: makeQueryExecutionServiceStub() },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Chip bar is rendered', async () => {
      await expect(canvasElement.querySelector('app-data-model-chip')).not.toBeNull();
    });
    await step('Fulltext input is present', async () => {
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
        { provide: QueryExecutionService, useValue: makeQueryExecutionServiceStub() },
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
