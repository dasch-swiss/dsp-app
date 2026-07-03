import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { OntologyDataService } from '../../service/ontology-data.service';
import { PropertyFormManager } from '../../service/property-form.manager';
import { DerivedSearchState, SearchDerivationService } from '../../service/search-derivation.service';
import {
  makeOntologyDataServiceStub,
  makeSearchDerivationServiceStub,
  SAMPLE_RESOURCE_CLASSES,
  STORY_PROVIDERS,
} from '../../stories.helpers';
import { ResourceClassChipComponent } from './resource-class-chip.component';

const derivationWithClass = (resourceClass: DerivedSearchState['resourceClass']) => ({
  provide: SearchDerivationService,
  useValue: makeSearchDerivationServiceStub({
    searchState$: of({ resourceClass, statements: [], orderByItems: [] }),
  }),
});

const meta: Meta<ResourceClassChipComponent> = {
  title: 'Search / Advanced Search / Chip Bar / 2. Resource Class Chip',
  component: ResourceClassChipComponent,
};
export default meta;
type Story = StoryObj<ResourceClassChipComponent>;

const baseProviders = [
  ...STORY_PROVIDERS,
  importProvidersFrom(OverlayModule),
  { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
  derivationWithClass(null),
  PropertyFormManager,
];

export const ShowsAllResourceClasses: Story = {
  name: 'Shows "All resource classes" when no class is selected',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
        derivationWithClass(null),
        PropertyFormManager,
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Button shows "All resource classes"', async () => {
      await expect(canvas.getByText('All resource classes', { exact: false })).toBeTruthy();
    });
  },
};

export const ShowsSelectedClass: Story = {
  name: 'Shows selected resource class label on button',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
        derivationWithClass(SAMPLE_RESOURCE_CLASSES[0]),
        PropertyFormManager,
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Button shows selected class label', async () => {
      await expect(canvas.getByText(SAMPLE_RESOURCE_CLASSES[0].labels[0].value, { exact: false })).toBeTruthy();
    });
  },
};

export const OpensPopoverOnClick: Story = {
  name: 'Opens resource class picker popover on click',
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click the chip button', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('Class list is visible in the overlay', async () => {
      const overlay = document.querySelector('mat-selection-list');
      await expect(overlay).not.toBeNull();
    });
  },
};

export const ListsAllClasses: Story = {
  name: 'Lists all resource classes plus "All" option in popover',
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click to open popover', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('"All resource classes" option is present', async () => {
      await expect(document.body.textContent).toContain('All resource classes');
    });
    await step('Each resource class is shown as an option', async () => {
      const options = document.querySelectorAll('mat-list-option');
      await expect(options.length).toBe(SAMPLE_RESOURCE_CLASSES.length + 1);
    });
  },
};
