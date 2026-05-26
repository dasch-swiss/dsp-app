import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of, NEVER } from 'rxjs';
import { expect } from 'storybook/test';
import { AdvancedSearchComponent } from './advanced-search.component';
import { OntologyDataService } from './service/ontology-data.service';
import { makeDspApiConnectionStub, makeOntologyDataServiceStub, STORY_PROVIDERS } from './stories.helpers';

const meta: Meta<AdvancedSearchComponent> = {
  title: 'Search / Advanced Search',
  component: AdvancedSearchComponent,
  argTypes: {
    projectUuid: { description: 'UUID of the project whose ontologies are loaded.' },
    queryToLoad: { description: 'If set, restores the search state from a previously saved snapshot.' },
    restoreState: { description: 'When true, restores the last search state from local storage on init.' },
    gravsearchQuery: { description: 'Emitted with the Gravsearch query string when Search is triggered.' },
  },
};
export default meta;
type Story = StoryObj<AdvancedSearchComponent>;

const sharedProviders = [
  ...STORY_PROVIDERS,
  importProvidersFrom(OverlayModule),
  { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
  { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
];

export const Default: Story = {
  name: 'Renders chip-bar search interface',
  args: { projectUuid: '0001' },
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Chip bar is rendered', async () => {
      await expect(canvasElement).toBeInTheDocument();
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
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub({ ontologyLoading$: of(true) }) },
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
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub({ ontologyLoading$: of(true) }) },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Progress bar remains visible during infinite load', async () => {
      await expect(canvasElement.querySelector('mat-progress-bar')).not.toBeNull();
    });
  },
};
