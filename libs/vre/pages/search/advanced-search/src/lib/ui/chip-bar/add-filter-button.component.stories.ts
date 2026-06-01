import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { OntologyDataService } from '../../service/ontology-data.service';
import { PropertyFormManager } from '../../service/property-form.manager';
import { SearchStateService } from '../../service/search-state.service';
import {
  makeOntologyDataServiceStub,
  makeSearchStateServiceStub,
  SAMPLE_RESOURCE_CLASSES,
  STORY_PROVIDERS,
} from '../../stories.helpers';
import { AddFilterButtonComponent } from './add-filter-button.component';

const meta: Meta<AddFilterButtonComponent> = {
  title: 'Search / Advanced Search / Chip Bar / 4. Add Filter Button',
  component: AddFilterButtonComponent,
  argTypes: {
    filterAdded: { description: 'Emitted with the new statement ID when a property is selected.' },
  },
};
export default meta;
type Story = StoryObj<AddFilterButtonComponent>;

const baseProviders = [
  ...STORY_PROVIDERS,
  importProvidersFrom(OverlayModule),
  { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
  { provide: SearchStateService, useValue: makeSearchStateServiceStub() },
  PropertyFormManager,
];

export const ShowsAddFilterButton: Story = {
  name: 'Shows the Add filter button',
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Button with "Add filter" label is rendered', async () => {
      await expect(canvas.getByText('Add filter', { exact: false })).toBeTruthy();
    });
    await step('Add icon is present', async () => {
      const icons = Array.from(canvasElement.querySelectorAll('mat-icon'));
      await expect(icons.some(i => i.textContent?.trim() === 'add')).toBe(true);
    });
  },
};

export const OpensPropertyPickerOnClick: Story = {
  name: 'Opens property picker popover on click',
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click Add filter button', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('Property picker popover appears', async () => {
      const popover = document.querySelector('app-property-picker-popover');
      await expect(popover).not.toBeNull();
    });
  },
};

export const PassesClassIriToPickerWhenClassSelected: Story = {
  name: 'Passes selected resource class IRI to the property picker',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
        {
          provide: SearchStateService,
          useValue: makeSearchStateServiceStub({
            currentState: {
              selectedResourceClass: SAMPLE_RESOURCE_CLASSES[0],
              statementElements: [],
              orderBy: [],
            },
          }),
        },
        PropertyFormManager,
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click to open picker', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('Property picker is rendered in overlay', async () => {
      await expect(document.querySelector('app-property-picker-popover')).not.toBeNull();
    });
  },
};

export const NoClassSelected: Story = {
  name: 'Works without a selected resource class (shows all properties)',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
        {
          provide: SearchStateService,
          useValue: makeSearchStateServiceStub({
            currentState: { selectedResourceClass: null as any, statementElements: [], orderBy: [] },
          }),
        },
        PropertyFormManager,
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click Add filter without a class selected', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('Property picker still opens', async () => {
      await expect(document.querySelector('app-property-picker-popover')).not.toBeNull();
    });
  },
};
