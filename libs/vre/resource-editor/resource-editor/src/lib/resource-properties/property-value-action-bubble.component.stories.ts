import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { PropertyValueActionBubbleComponent } from './property-value-action-bubble.component';
import { PropertyValueService } from './property-value.service';

const makePropertyValueServiceStub = (valuesCount = 2): Partial<PropertyValueService> => ({
  cardinality: 0 as any, // _0_n — not required
  editModeData: {
    resource: { id: 'http://rdfh.ch/resource/1', type: 'http://example.org/Thing' } as any,
    values: Array.from({ length: valuesCount }, (_, i) => ({
      id: `http://rdfh.ch/values/${i}`,
      type: 'http://api.knora.org/ontology/knora-api/v2#IntValue',
      userHasPermission: 'RV',
      valueCreationDate: '2024-06-15T10:00:00Z',
      valueHasComment: null,
      uuid: `uuid-${i}`,
    })) as any,
  },
});

const makeResourceFetcherServiceStub = (): Partial<ResourceFetcherService> => ({
  resourceVersion: null,
  resource$: of({
    res: {
      attachedToUser: 'http://rdfh.ch/users/test-user',
    },
  } as any),
});

const meta: Meta<PropertyValueActionBubbleComponent> = {
  title: 'Devs / Resource Editor / Resource Properties / Property Value Action Bubble',
  component: PropertyValueActionBubbleComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: PropertyValueService, useValue: makePropertyValueServiceStub() },
        { provide: ResourceFetcherService, useValue: makeResourceFetcherServiceStub() },
      ],
    }),
  ],
  argTypes: {
    date: {
      description: 'Creation date of the value displayed in the info tooltip.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    editAction: {
      description: 'Emitted when the edit button is clicked.',
      table: { type: { summary: 'EventEmitter' }, category: 'Events' },
    },
    deleteAction: {
      description: 'Emitted when the delete button is clicked.',
      table: { type: { summary: 'EventEmitter' }, category: 'Events' },
    },
  },
};
export default meta;
type Story = StoryObj<PropertyValueActionBubbleComponent>;

export const DefaultView: Story = {
  name: 'Shows action bubble container',
  args: {
    date: '2024-06-15T10:00:00Z',
  },
  play: async ({ canvasElement, step }) => {
    await step('Action bubble container is rendered', async () => {
      const bubble = canvasElement.querySelector('[data-cy="action-bubble"]');
      await expect(bubble).not.toBeNull();
    });
  },
};
