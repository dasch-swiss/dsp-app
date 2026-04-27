import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { BehaviorSubject, of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { PropertyValueUpdateComponent } from './property-value-update.component';
import { PropertyValueService } from './property-value.service';

const makePropertyValueServiceStub = (): Partial<PropertyValueService> => ({
  propertyDefinition: {
    label: 'Integer Value',
    id: 'http://example.org/prop',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#IntValue',
  } as any,
  editModeData: {
    resource: {
      id: 'http://rdfh.ch/resource/1',
      type: 'http://example.org/Thing',
      attachedToProject: 'http://rdfh.ch/projects/test',
    } as any,
    values: [
      {
        id: 'http://rdfh.ch/values/1',
        type: 'http://api.knora.org/ontology/knora-api/v2#IntValue',
        intValueAsInt: 42,
        valueHasComment: null,
        property: 'http://example.org/prop',
      } as any,
    ],
  },
  lastOpenedItem$: new BehaviorSubject<number | null>(0) as any,
  toggleOpenedValue: () => {},
});

const meta: Meta<PropertyValueUpdateComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Property Value / Property Value Update',
  component: PropertyValueUpdateComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: PropertyValueService, useValue: makePropertyValueServiceStub() },
        { provide: ResourceFetcherService, useValue: { reload: () => {} } },
        { provide: ResourceService, useValue: { getProjectShortcode: () => 'test' } },
        { provide: DspApiConnectionToken, useValue: { v2: { values: { updateValue: () => of({}) } } } },
      ],
    }),
  ],
  argTypes: {
    index: {
      description: 'Index of the value in PropertyValueService.editModeData.values to update.',
      table: { type: { summary: 'number' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<PropertyValueUpdateComponent>;

export const DefaultView: Story = {
  name: 'Shows edit form with save and undo buttons',
  args: { index: 0 },
  play: async ({ canvasElement, step }) => {
    await step('Save button is rendered', async () => {
      const saveButton = canvasElement.querySelector('[data-cy="save-button"]');
      await expect(saveButton).not.toBeNull();
    });
    await step('Toggle comment button is rendered', async () => {
      const commentButton = canvasElement.querySelector('[data-cy="toggle-comment-button"]');
      await expect(commentButton).not.toBeNull();
    });
  },
};
