import { APIV2ApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { notificationServiceStub } from '../stories.helpers';
import { DraggableValueListComponent } from './draggable-value-list.component';

const makeValues = () =>
  [
    { id: 'http://rdfh.ch/values/1', type: 'http://api.knora.org/ontology/knora-api/v2#IntValue', intValueAsInt: 1 },
    { id: 'http://rdfh.ch/values/2', type: 'http://api.knora.org/ontology/knora-api/v2#IntValue', intValueAsInt: 2 },
  ] as any[];

const meta: Meta<DraggableValueListComponent> = {
  title: 'Devs / Resource Editor / Resource Properties / Draggable Value List',
  component: DraggableValueListComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: ResourceFetcherService, useValue: { reload: () => {} } },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: APIV2ApiService, useValue: { putV2ValuesOrder: () => of({}) } },
      ],
    }),
  ],
  argTypes: {
    values: {
      description: 'List of ReadValue items to render in the draggable list.',
      table: { type: { summary: 'ReadValue[]' }, category: 'State' },
    },
    resourceIri: {
      description: 'IRI of the parent resource, used when reordering values.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    propertyIri: {
      description: 'IRI of the property, used when reordering values.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    disabled: {
      description: 'When true, drag-and-drop is disabled.',
      table: { type: { summary: 'boolean' }, category: 'State' },
    },
    showHandle: {
      description: 'When true, shows a drag handle icon on each item.',
      table: { type: { summary: 'boolean' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<DraggableValueListComponent>;

export const WithDragHandles: Story = {
  name: 'Shows drag handles when reordering is enabled',
  args: {
    values: makeValues(),
    resourceIri: 'http://rdfh.ch/resource/1',
    propertyIri: 'http://example.org/prop',
    disabled: false,
    showHandle: true,
  },
  render: args => ({
    props: args,
    template: `
      <app-draggable-value-list
        [values]="values"
        [resourceIri]="resourceIri"
        [propertyIri]="propertyIri"
        [disabled]="disabled"
        [showHandle]="showHandle">
        <ng-template let-value let-index="index">
          <div data-cy="value-item">Value {{ index + 1 }}</div>
        </ng-template>
      </app-draggable-value-list>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Drag handles are rendered', async () => {
      const handles = canvasElement.querySelectorAll('[cdkdraghandle]');
      await expect(handles.length).toBeGreaterThan(0);
    });
    await step('Value items are rendered', async () => {
      const items = canvasElement.querySelectorAll('[data-cy="value-item"]');
      await expect(items.length).toBe(2);
    });
  },
};

export const Disabled: Story = {
  name: 'Shows list without drag handles when disabled',
  args: {
    values: makeValues(),
    resourceIri: 'http://rdfh.ch/resource/1',
    propertyIri: 'http://example.org/prop',
    disabled: true,
    showHandle: false,
  },
  render: args => ({
    props: args,
    template: `
      <app-draggable-value-list
        [values]="values"
        [resourceIri]="resourceIri"
        [propertyIri]="propertyIri"
        [disabled]="disabled"
        [showHandle]="showHandle">
        <ng-template let-value let-index="index">
          <div data-cy="value-item">Value {{ index + 1 }}</div>
        </ng-template>
      </app-draggable-value-list>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Value items are rendered', async () => {
      const items = canvasElement.querySelectorAll('[data-cy="value-item"]');
      await expect(items.length).toBe(2);
    });
    await step('No drag handles are shown', async () => {
      const handles = canvasElement.querySelectorAll('[cdkdraghandle]');
      await expect(handles.length).toBe(0);
    });
  },
};
