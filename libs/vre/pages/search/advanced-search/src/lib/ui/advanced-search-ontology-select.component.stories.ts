import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';
import { OntologyDataService } from '../service/ontology-data.service';
import { SearchStateService } from '../service/search-state.service';
import {
  makeOntologyDataServiceStub,
  makeSearchStateServiceStub,
  SAMPLE_ONTOLOGIES,
  STORY_PROVIDERS,
} from '../stories.helpers';
import { AdvancedSearchOntologySelectComponent } from './advanced-search-ontology-select.component';

const meta: Meta<AdvancedSearchOntologySelectComponent> = {
  title: 'Search / Advanced Search / 2a. Ontology Select',
  component: AdvancedSearchOntologySelectComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<AdvancedSearchOntologySelectComponent>;

const sharedProviders = [
  ...STORY_PROVIDERS,
  { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
  { provide: SearchStateService, useValue: makeSearchStateServiceStub() },
];

export const WithOntologies: Story = {
  name: 'Renders data model select with available ontologies',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Data model select is rendered', async () => {
      await expect(canvasElement.querySelector('mat-select')).not.toBeNull();
    });
  },
};

export const SingleOntology: Story = {
  name: 'Renders select with a single ontology option',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: OntologyDataService,
          useValue: makeOntologyDataServiceStub({ ontologies$: of([SAMPLE_ONTOLOGIES[0]]) }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Select is rendered', async () => {
      await expect(canvasElement.querySelector('mat-select')).not.toBeNull();
    });
  },
};

export const NoOntologies: Story = {
  name: 'Renders empty select when project has no ontologies',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: OntologyDataService,
          useValue: makeOntologyDataServiceStub({ ontologies$: of([]) }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Select is rendered without options', async () => {
      await expect(canvasElement.querySelector('mat-select')).not.toBeNull();
    });
  },
};
