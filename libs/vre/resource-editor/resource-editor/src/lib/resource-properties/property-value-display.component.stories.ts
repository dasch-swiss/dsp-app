import { BehaviorSubject } from 'rxjs';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { PropertiesDisplayService } from './properties-display.service';
import { PropertyValueDisplayComponent } from './property-value-display.component';
import { PropertyValueService } from './property-value.service';

const makePropertyValueServiceStub = (): Partial<PropertyValueService> => ({
  propertyDefinition: {
    label: 'Description',
    id: 'http://example.org/prop',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
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
        type: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
        valueCreationDate: '2024-06-15T10:00:00Z',
        valueHasComment: null,
        uuid: 'uuid-1',
        userHasPermission: 'RV',
        property: 'http://example.org/prop',
      } as any,
    ],
  },
  lastOpenedItem$: new BehaviorSubject<number | null>(null) as any,
  toggleOpenedValue: () => {},
});

const meta: Meta<PropertyValueDisplayComponent> = {
  title: 'Devs / Resource Editor / Resource Properties / Property Value Display',
  component: PropertyValueDisplayComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: PropertyValueService, useValue: makePropertyValueServiceStub() },
        { provide: PropertiesDisplayService, useValue: { showComments$: of(false) } },
      ],
    }),
  ],
  argTypes: {
    index: {
      description: 'Index of the value to display from PropertyValueService.editModeData.values.',
      table: { type: { summary: 'number' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<PropertyValueDisplayComponent>;

export const DefaultView: Story = {
  name: 'Shows property value container',
  args: { index: 0 },
  play: async ({ canvasElement, step }) => {
    await step('Property value container is rendered', async () => {
      const valueEl = canvasElement.querySelector('[data-cy="property-value"]');
      await expect(valueEl).not.toBeNull();
    });
  },
};
