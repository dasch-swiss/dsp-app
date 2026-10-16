import { Cardinality } from '@dasch-swiss/dsp-js';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, waitFor } from 'storybook/test';

import { ResourceFetcherService } from '../../../representation/resource-fetcher.service';
import { PropertyValueActionBubbleComponent } from './property-value-action-bubble.component';
import { PropertyValueService } from './property-value.service';

const DATE = '2024-06-15T10:00:00Z';

const makePropertyValueServiceStub = (
  permission: string,
  cardinality: Cardinality,
  valuesCount = 2
): Partial<PropertyValueService> => ({
  cardinality,
  editModeData: {
    resource: { id: 'http://rdfh.ch/resource/1', type: 'http://example.org/Thing' } as any,
    values: Array.from({ length: valuesCount }, (_, i) => ({
      id: `http://rdfh.ch/values/${i}`,
      type: 'http://api.knora.org/ontology/knora-api/v2#IntValue',
      userHasPermission: permission,
      valueCreationDate: DATE,
      valueHasComment: null,
      uuid: `uuid-${i}`,
    })) as any,
  },
});

const makeResourceFetcherServiceStub = (resourceVersion: string | null = null): Partial<ResourceFetcherService> => ({
  resourceVersion,
  resource$: of({ res: { attachedToUser: 'http://rdfh.ch/users/test-user' } } as any),
});

const meta: Meta<PropertyValueActionBubbleComponent> = {
  title:
    'Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Property Value / Properties Display / Property Value Action Bubble',
  component: PropertyValueActionBubbleComponent,
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

export const EditAndDeleteVisible: Story = {
  name: 'Shows edit and delete buttons when user has CR permission',
  args: { date: DATE },
  decorators: [
    applicationConfig({
      providers: [
        { provide: PropertyValueService, useValue: makePropertyValueServiceStub('CR', Cardinality._0_n) },
        { provide: ResourceFetcherService, useValue: makeResourceFetcherServiceStub() },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Edit button is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="edit-button"]')).not.toBeNull();
    });
    await step('Delete button is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="delete-button"]')).not.toBeNull();
    });
    await step('Delete button is enabled', async () => {
      const btn = canvasElement.querySelector('[data-cy="delete-button"]') as HTMLButtonElement;
      await expect(btn.disabled).toBe(false);
    });
  },
};

export const DeleteDisabledWhenLastRequiredValue: Story = {
  name: 'Disables delete button when value is the last one of a required property',
  args: { date: DATE },
  decorators: [
    applicationConfig({
      providers: [
        { provide: PropertyValueService, useValue: makePropertyValueServiceStub('CR', Cardinality._1, 1) },
        { provide: ResourceFetcherService, useValue: makeResourceFetcherServiceStub() },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Delete button is rendered but disabled', async () => {
      const btn = canvasElement.querySelector('[data-cy="delete-button"]') as HTMLButtonElement;
      await expect(btn.disabled).toBe(true);
    });
  },
};

export const NoButtonsForReadOnlyUser: Story = {
  name: 'Hides edit and delete buttons when user only has restricted view permission',
  args: { date: DATE },
  decorators: [
    applicationConfig({
      providers: [
        { provide: PropertyValueService, useValue: makePropertyValueServiceStub('RV', Cardinality._0_n) },
        { provide: ResourceFetcherService, useValue: makeResourceFetcherServiceStub() },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Edit button is not rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="edit-button"]')).toBeNull();
    });
    await step('Delete button is not rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="delete-button"]')).toBeNull();
    });
  },
};

export const NoButtonsInHistoricalVersion: Story = {
  name: 'Hides edit and delete buttons when viewing a historical resource version',
  args: { date: DATE },
  decorators: [
    applicationConfig({
      providers: [
        { provide: PropertyValueService, useValue: makePropertyValueServiceStub('CR', Cardinality._0_n) },
        { provide: ResourceFetcherService, useValue: makeResourceFetcherServiceStub('20240615T100000Z') },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Edit button is not rendered in version mode', async () => {
      await expect(canvasElement.querySelector('[data-cy="edit-button"]')).toBeNull();
    });
    await step('Delete button is not rendered in version mode', async () => {
      await expect(canvasElement.querySelector('[data-cy="delete-button"]')).toBeNull();
    });
  },
};

/** Who created the value, and when, rides in the Edit button's tooltip rather than a button of its own. */
export const CreationInfoInTheEditTooltip: Story = {
  name: 'Carries the creation info in the edit tooltip, with no separate info button',
  args: { date: DATE },
  decorators: [
    applicationConfig({
      providers: [
        { provide: PropertyValueService, useValue: makePropertyValueServiceStub('CR', Cardinality._0_n) },
        { provide: ResourceFetcherService, useValue: makeResourceFetcherServiceStub() },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('There is no info button beside Edit', async () => {
      await expect(canvasElement.querySelector('[data-cy="info-button"]')).toBeNull();
    });
    await step('Hovering Edit shows who created the value', async () => {
      await userEvent.hover(canvasElement.querySelector('[data-cy="edit-button"]') as HTMLElement);
      await waitFor(() => expect(document.querySelector('.mat-mdc-tooltip')).toHaveTextContent(/test-user/));
    });
  },
};

/** Without an Edit button to carry it, the creation info gets a button of its own. */
export const InfoButtonForReadOnlyUser: Story = {
  name: 'Shows an info button when the user cannot edit',
  args: { date: DATE },
  decorators: [
    applicationConfig({
      providers: [
        { provide: PropertyValueService, useValue: makePropertyValueServiceStub('V', Cardinality._0_n) },
        { provide: ResourceFetcherService, useValue: makeResourceFetcherServiceStub() },
      ],
    }),
  ],
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-cy="edit-button"]')).toBeNull();
    await expect(canvasElement.querySelector('[data-cy="info-button"]')).not.toBeNull();
  },
};
