import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of, NEVER } from 'rxjs';
import { expect } from 'storybook/test';
import { AdvancedSearchComponent } from './advanced-search.component';
import { provideAdvancedSearch } from './providers';
import { OntologyDataService } from './service/ontology-data.service';
import { QueryExecutionService } from './service/query-execution.service';
import {
  ADVANCED_SEARCH_SERVICE_STUBS,
  makeDspApiConnectionStub,
  makeOntologyDataServiceStub,
  makeQueryExecutionServiceStub,
  STORY_PROVIDERS,
} from './stories.helpers';

const meta: Meta<AdvancedSearchComponent> = {
  title: 'Search / Advanced Search',
  component: AdvancedSearchComponent,
  argTypes: {
    projectUuid: { description: 'UUID of the project whose ontologies are loaded.' },
  },
};
export default meta;
type Story = StoryObj<AdvancedSearchComponent>;

const sharedProviders = [
  ...STORY_PROVIDERS,
  importProvidersFrom(OverlayModule),
  { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
  ...provideAdvancedSearch(),
  ...ADVANCED_SEARCH_SERVICE_STUBS,
  { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
  { provide: QueryExecutionService, useValue: makeQueryExecutionServiceStub() },
];

export const Default: Story = {
  name: 'Renders chip-bar search interface',
  args: { projectUuid: '0001' },
  decorators: [applicationConfig({ providers: sharedProviders })],
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

export const LoadingOntologies: Story = {
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
    await step('Progress bar is shown', async () => {
      await expect(canvasElement.querySelector('mat-progress-bar')).not.toBeNull();
    });
  },
};

export const OntologyLoadError: Story = {
  name: 'Shows loading state when API call never resolves',
  args: { projectUuid: '0001' },
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        {
          provide: DspApiConnectionToken,
          useValue: makeDspApiConnectionStub({
            onto: {
              getOntologiesByProjectIri: () => NEVER,
              getOntology: () => NEVER,
            },
          }),
        },
        ...provideAdvancedSearch(),
        ...ADVANCED_SEARCH_SERVICE_STUBS,
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub({ ontologyLoading$: of(true) }) },
        { provide: QueryExecutionService, useValue: makeQueryExecutionServiceStub() },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Progress bar remains visible during infinite load', async () => {
      await expect(canvasElement.querySelector('mat-progress-bar')).not.toBeNull();
    });
  },
};
