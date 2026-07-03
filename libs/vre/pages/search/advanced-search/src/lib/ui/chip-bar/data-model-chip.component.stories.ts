import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { OntologyDataService } from '../../service/ontology-data.service';
import { makeOntologyDataServiceStub, SAMPLE_ONTOLOGIES, STORY_PROVIDERS } from '../../stories.helpers';
import { DataModelChipComponent } from './data-model-chip.component';

const meta: Meta<DataModelChipComponent> = {
  title: 'Search / Advanced Search / Chip Bar / 1. Data Model Chip',
  component: DataModelChipComponent,
};
export default meta;
type Story = StoryObj<DataModelChipComponent>;

const baseProviders = [
  ...STORY_PROVIDERS,
  importProvidersFrom(OverlayModule),
  { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
];

export const ShowsSelectedOntology: Story = {
  name: 'Shows the currently selected ontology label',
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Button shows ontology label', async () => {
      await expect(canvas.getByText(SAMPLE_ONTOLOGIES[0].labels[0].value, { exact: false })).toBeTruthy();
    });
  },
};

export const ShowsDropdownArrow: Story = {
  name: 'Shows dropdown arrow icon on button',
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Arrow icon is present', async () => {
      const icons = canvasElement.querySelectorAll('mat-icon');
      const iconTexts = Array.from(icons).map(i => i.textContent?.trim());
      await expect(iconTexts).toContain('arrow_drop_down');
    });
  },
};

export const OpensPopoverOnClick: Story = {
  name: 'Opens ontology picker popover on click',
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click the chip button', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('Ontology list options are visible in the overlay', async () => {
      const overlay = document.querySelector('mat-selection-list');
      await expect(overlay).not.toBeNull();
    });
  },
};

export const WithMultipleOntologies: Story = {
  name: 'Lists all available ontologies in popover',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        {
          provide: OntologyDataService,
          useValue: makeOntologyDataServiceStub({
            ontologies$: of(SAMPLE_ONTOLOGIES),
          }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click to open popover', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('All ontologies appear as list options', async () => {
      const options = document.querySelectorAll('mat-list-option');
      await expect(options.length).toBe(SAMPLE_ONTOLOGIES.length);
    });
  },
};
