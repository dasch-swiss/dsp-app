import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { NEVER, of } from 'rxjs';
import { expect } from 'storybook/test';
import { AdvancedSearchComponent } from './advanced-search.component';
import { OntologyDataService } from './service/ontology-data.service';
import { makeDspApiConnectionStub, makeOntologyDataServiceStub, STORY_PROVIDERS } from './stories.helpers';

const meta: Meta<AdvancedSearchComponent> = {
  title: 'Search / Advanced Search',
  component: AdvancedSearchComponent,
  argTypes: {
    projectUuid: { description: 'UUID of the project whose ontologies are loaded.' },
    isVerticalDirection: { description: 'Controls the layout direction toggle button.' },
    queryToLoad: { description: 'If set, restores the search state from a previously saved snapshot.' },
    restoreState: { description: 'When true, restores the last search state from local storage on init.' },
    toggleDirection: { description: 'Emitted when the layout direction toggle is clicked.' },
    gravsearchQuery: { description: 'Emitted with the Gravsearch query string when Search is triggered.' },
  },
};
export default meta;
type Story = StoryObj<AdvancedSearchComponent>;

const sharedProviders = [
  ...STORY_PROVIDERS,
  importProvidersFrom(OverlayModule),
  { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
  {
    provide: OntologyDataService,
    useValue: makeOntologyDataServiceStub(),
  },
];

export const HorizontalLayout: Story = {
  name: 'Renders advanced search form in horizontal layout',
  args: { projectUuid: '0001', isVerticalDirection: false },
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Header is rendered', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};

export const VerticalLayout: Story = {
  name: 'Renders advanced search form in vertical layout',
  args: { projectUuid: '0001', isVerticalDirection: true },
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Component renders in vertical layout', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};

export const LoadingOntologies: Story = {
  name: 'Shows progress bar while ontologies are loading',
  args: { projectUuid: '0001', isVerticalDirection: false },
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
        {
          provide: OntologyDataService,
          useValue: makeOntologyDataServiceStub({ ontologyLoading$: of(true) }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Progress bar is shown', async () => {
      await expect(canvasElement.querySelector('mat-progress-bar')).not.toBeNull();
    });
    await step('Form fields are hidden during loading', async () => {
      await expect(canvasElement.querySelector('app-resource-value')).toBeNull();
    });
  },
};

export const OntologyLoadError: Story = {
  name: 'Shows form without ontology content when API call never resolves',
  args: { projectUuid: '0001', isVerticalDirection: false },
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
        {
          provide: OntologyDataService,
          useValue: makeOntologyDataServiceStub({ ontologyLoading$: of(true) }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Progress bar remains visible during infinite load', async () => {
      await expect(canvasElement.querySelector('mat-progress-bar')).not.toBeNull();
    });
  },
};
