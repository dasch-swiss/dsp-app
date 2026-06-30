import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { IriLabelPair, Predicate } from '../../../../model';
import { OntologyDataService } from '../../../../service/ontology-data.service';
import { makeOntologyDataServiceStub, SAMPLE_RESOURCE_CLASSES, STORY_PROVIDERS } from '../../../../stories.helpers';
import { toLabels } from '../../../../util/labels';
import { ResourceValueComponent } from './resource-value.component';

const meta: Meta<ResourceValueComponent> = {
  title: 'Search / Advanced Search / Value Inputs / Resource Value',
  component: ResourceValueComponent,
  argTypes: {
    selectedResource: { description: 'The currently selected resource class.' },
    selectedPredicate: { description: 'The predicate used to filter available resource classes.' },
    selectedResourceChange: { description: 'Emitted when a resource class is selected.' },
  },
};
export default meta;
type Story = StoryObj<ResourceValueComponent>;

export const ShowsResourceClassDropdown: Story = {
  name: 'Shows resource class dropdown with available options',
  decorators: [
    applicationConfig({
      providers: [...STORY_PROVIDERS, { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() }],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Resource class select is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="resource-class-select"]')).not.toBeNull();
    });
  },
};

export const ShowsSelectedResource: Story = {
  name: 'Shows pre-selected resource class label in the dropdown trigger',
  args: { selectedResource: SAMPLE_RESOURCE_CLASSES[0] },
  decorators: [
    applicationConfig({
      providers: [...STORY_PROVIDERS, { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() }],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Select trigger shows the pre-selected class label', async () => {
      const trigger = canvasElement.querySelector('.mat-mdc-select-value-text');
      await expect(trigger?.textContent).toContain(SAMPLE_RESOURCE_CLASSES[0].labels[0].value);
    });
  },
};

export const EmptyAvailableClasses: Story = {
  name: 'Shows empty dropdown when no resource classes are available',
  args: {
    selectedPredicate: new Predicate(
      'http://ex.org/hasPart',
      toLabels('Has Part'),
      'http://api.knora.org/ontology/knora-api/v2#LinkValue',
      true
    ),
  },
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        {
          provide: OntologyDataService,
          useValue: makeOntologyDataServiceStub({
            getResourceClassObjectsForProperty$: () => of([] as IriLabelPair[]),
          }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Resource class select is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="resource-class-select"]')).not.toBeNull();
    });
    await step('No options are listed in the dropdown', async () => {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole('combobox'));
      const options = document.querySelectorAll('mat-option');
      await expect(options.length).toBe(0);
    });
  },
};
