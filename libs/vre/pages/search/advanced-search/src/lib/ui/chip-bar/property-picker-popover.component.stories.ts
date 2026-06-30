import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { IriLabelPair, Predicate } from '../../model';
import { OntologyDataService } from '../../service/ontology-data.service';
import { STORY_PROVIDERS } from '../../stories.helpers';
import { toLabels } from '../../util/labels';
import { PropertyPickerPopoverComponent } from './property-picker-popover.component';

const SAMPLE_PROPERTIES: IriLabelPair[] = [
  { iri: 'http://ex.org/hasTitle', labels: toLabels('Title'), comments: [] },
  { iri: 'http://ex.org/hasAuthor', labels: toLabels('Author'), comments: [] },
  { iri: 'http://ex.org/hasDate', labels: toLabels('Date'), comments: [] },
];

const makeOntologyStub = (properties: IriLabelPair[] = SAMPLE_PROPERTIES) => ({
  getProperties$: () => of(properties as Predicate[]),
  ontologies$: of([]),
  selectedOntology$: of(null),
  ontologyLoading$: of(false),
  resourceClasses$: of([]),
  selectedOntology: null,
  classIris: [],
  init: () => {},
  setOntology: () => {},
  getResourceClassObjectsForProperty$: () => of([]),
  getSubclassesOfResourceClass$: () => of([]),
});

const meta: Meta<PropertyPickerPopoverComponent> = {
  title: 'Search / Advanced Search / Chip Bar / 3b. Filter Editor Popover / Property Picker Popover',
  component: PropertyPickerPopoverComponent,
  argTypes: {
    subjectClassIri: { description: 'IRI of the subject class to filter properties for.' },
    propertySelected: { description: 'Emitted when a property is picked.' },
  },
};
export default meta;
type Story = StoryObj<PropertyPickerPopoverComponent>;

const baseProviders = [
  ...STORY_PROVIDERS,
  importProvidersFrom(OverlayModule),
  { provide: OntologyDataService, useValue: makeOntologyStub() },
];

export const ShowsAllProperties: Story = {
  name: 'Shows all available properties in the list',
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Property list options are rendered', async () => {
      const options = canvasElement.querySelectorAll('mat-list-option');
      await expect(options.length).toBe(SAMPLE_PROPERTIES.length);
    });
  },
};

export const ShowsSearchInput: Story = {
  name: 'Shows search input for filtering properties',
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Search input is present', async () => {
      const input = canvasElement.querySelector('input[matInput]');
      await expect(input).not.toBeNull();
    });
  },
};

export const FiltersPropertiesBySearchTerm: Story = {
  name: 'Filters property list when user types in the search field',
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Type search term into the input', async () => {
      await userEvent.type(canvas.getByRole('textbox'), 'Title');
    });
    await step('Only matching properties are shown', async () => {
      const options = canvasElement.querySelectorAll('mat-list-option');
      await expect(options.length).toBe(1);
    });
  },
};

export const EmptyPropertyList: Story = {
  name: 'Shows empty list when no properties are available',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: OntologyDataService, useValue: makeOntologyStub([]) },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('No list options are rendered', async () => {
      const options = canvasElement.querySelectorAll('mat-list-option');
      await expect(options.length).toBe(0);
    });
  },
};

export const FiltersToSingleResultOnSearch: Story = {
  name: 'Selecting a property clears the search and filters the list to one result',
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Type a unique search term', async () => {
      await userEvent.type(canvas.getByRole('textbox'), 'Author');
    });
    await step('Only one matching property is shown', async () => {
      const options = canvasElement.querySelectorAll('mat-list-option');
      await expect(options.length).toBe(1);
    });
    await step('The shown option matches the search term', async () => {
      await expect(canvasElement.textContent).toContain('Author');
    });
  },
};

export const NoResultsAfterSearch: Story = {
  name: 'Shows empty list when search term matches no properties',
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Type a term that matches nothing', async () => {
      await userEvent.type(canvas.getByRole('textbox'), 'zzznomatch');
    });
    await step('No list options are shown', async () => {
      const options = canvasElement.querySelectorAll('mat-list-option');
      await expect(options.length).toBe(0);
    });
  },
};
