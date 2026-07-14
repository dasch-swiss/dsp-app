import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { OntologyDataService } from '../../service/ontology-data.service';
import {
  makeOntologyDataServiceStub,
  PROPERTY_FORM_MANAGER_STORY_PROVIDERS,
  STORY_PROVIDERS,
} from '../../stories.helpers';
import { AddFilterButtonComponent } from './add-filter-button.component';

const meta: Meta<AddFilterButtonComponent> = {
  title: 'Search / Advanced Search / Search bar / 4. Add Filter Button',
  component: AddFilterButtonComponent,
  argTypes: {
    filterConfirmed: { description: 'Emitted with the new statement ID when the filter is confirmed.' },
  },
};
export default meta;
type Story = StoryObj<AddFilterButtonComponent>;

const baseProviders = [
  ...STORY_PROVIDERS,
  importProvidersFrom(OverlayModule),
  { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
  ...PROPERTY_FORM_MANAGER_STORY_PROVIDERS,
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
  name: 'Opens filter editor popover on click',
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click Add filter button', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('Filter editor popover appears', async () => {
      const popover = document.querySelector('app-filter-editor-popover');
      await expect(popover).not.toBeNull();
    });
  },
};

export const PassesClassIriToPickerWhenClassSelected: Story = {
  name: 'Opens filter editor when resource class is selected',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
        ...PROPERTY_FORM_MANAGER_STORY_PROVIDERS,
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click to open filter editor', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('Filter editor popover is rendered in overlay', async () => {
      await expect(document.querySelector('app-filter-editor-popover')).not.toBeNull();
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
        ...PROPERTY_FORM_MANAGER_STORY_PROVIDERS,
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Click Add filter without a class selected', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('Filter editor popover still opens', async () => {
      await expect(document.querySelector('app-filter-editor-popover')).not.toBeNull();
    });
  },
};
