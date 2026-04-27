import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { BehaviorSubject } from 'rxjs';
import { expect } from 'storybook/test';

import { PropertyValueEditComponent } from './property-value-edit.component';
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
});

const meta: Meta<PropertyValueEditComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Property Value Edit',
  component: PropertyValueEditComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: PropertyValueService, useValue: makePropertyValueServiceStub() },
        { provide: ResourceService, useValue: { getProjectShortcode: () => 'test' } },
      ],
    }),
  ],
  argTypes: {
    readValue: {
      description: 'Existing ReadValue to populate the edit form, or undefined when adding a new value.',
      table: { type: { summary: 'ReadValue | undefined' }, category: 'State' },
    },
    afterEdit: {
      description: 'Emitted with the form group when the user saves.',
      table: { type: { summary: 'EventEmitter<FormValueGroup>' }, category: 'Events' },
    },
    afterUndo: {
      description: 'Emitted when the user clicks undo to cancel editing.',
      table: { type: { summary: 'EventEmitter' }, category: 'Events' },
    },
  },
};
export default meta;
type Story = StoryObj<PropertyValueEditComponent>;

export const EditExistingValue: Story = {
  name: 'Shows edit form with save and undo buttons for existing value',
  args: {
    readValue: {
      id: 'http://rdfh.ch/values/1',
      type: 'http://api.knora.org/ontology/knora-api/v2#IntValue',
      intValueAsInt: 42,
      valueHasComment: null,
    } as any,
  },
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

export const AddNewValue: Story = {
  name: 'Shows edit form for new value with undefined readValue',
  args: {
    readValue: undefined,
  },
  play: async ({ canvasElement, step }) => {
    await step('Save button is rendered for new value form', async () => {
      const saveButton = canvasElement.querySelector('[data-cy="save-button"]');
      await expect(saveButton).not.toBeNull();
    });
  },
};
