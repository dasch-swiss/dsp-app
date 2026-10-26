import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { APIV2ApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../../../representation/resource-fetcher.service';
import { notificationServiceStub } from '../../../stories.helpers';
import { DraggableValueListComponent } from './draggable-value-list.component';

const makeValues = () =>
  [
    { id: 'http://rdfh.ch/values/1', type: 'http://api.knora.org/ontology/knora-api/v2#IntValue', intValueAsInt: 1 },
    { id: 'http://rdfh.ch/values/2', type: 'http://api.knora.org/ontology/knora-api/v2#IntValue', intValueAsInt: 2 },
  ] as any[];

const meta: Meta<DraggableValueListComponent> = {
  title:
    'Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Property Value / Draggable Value List',
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
  },
};
export default meta;
type Story = StoryObj<DraggableValueListComponent>;

export const WithDragHandles: Story = {
  name: 'Lets each item carry the handle that moves its row',
  args: {
    values: makeValues(),
    resourceIri: 'http://rdfh.ch/resource/1',
    propertyIri: 'http://example.org/prop',
    disabled: false,
  },
  render: args => ({
    props: args,
    moduleMetadata: { imports: [CdkDragHandle] },
    template: `
      <app-draggable-value-list
        [values]="values"
        [resourceIri]="resourceIri"
        [propertyIri]="propertyIri"
        [disabled]="disabled">
        <ng-template let-value let-index="index">
          <div data-cy="value-item">
            Value {{ index + 1 }}
            <span cdkDragHandle data-cy="item-handle">move</span>
          </div>
        </ng-template>
      </app-draggable-value-list>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step("Each item's own handle is rendered", async () => {
      await expect(canvasElement.querySelectorAll('[data-cy="item-handle"]').length).toBe(2);
    });
    await step('The handle moves its row', async () => {
      const handle = canvasElement.querySelectorAll('[data-cy="item-handle"]')[0] as HTMLElement;
      const box = handle.getBoundingClientRect();
      const at = (y: number) => ({ bubbles: true, clientX: box.left + 2, clientY: y, buttons: 1, detail: 1 });
      handle.dispatchEvent(new MouseEvent('mousedown', at(box.top + 2)));
      document.dispatchEvent(new MouseEvent('mousemove', at(box.top + 10)));
      document.dispatchEvent(new MouseEvent('mousemove', at(box.top + 20)));
      await expect(document.querySelector('.cdk-drag-preview')).not.toBeNull();
      document.dispatchEvent(new MouseEvent('mouseup', at(box.top + 20)));
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
  },
  render: args => ({
    props: args,
    template: `
      <app-draggable-value-list
        [values]="values"
        [resourceIri]="resourceIri"
        [propertyIri]="propertyIri"
        [disabled]="disabled">
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

export const SingleValueIsNotDraggable: Story = {
  name: 'Keeps a single value undraggable so its text stays selectable',
  args: {
    values: [makeValues()[0]],
    resourceIri: 'http://rdfh.ch/resource/1',
    propertyIri: 'http://example.org/prop',
    disabled: false,
  },
  render: args => ({
    props: args,
    template: `
      <app-draggable-value-list
        [values]="values"
        [resourceIri]="resourceIri"
        [propertyIri]="propertyIri"
        [disabled]="disabled">
        <ng-template let-value let-index="index">
          <div data-cy="value-item">Value {{ index + 1 }}</div>
        </ng-template>
      </app-draggable-value-list>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('The single value is rendered', async () => {
      const items = canvasElement.querySelectorAll('[data-cy="value-item"]');
      await expect(items.length).toBe(1);
    });
    await step('No drag handle is rendered', async () => {
      const handles = canvasElement.querySelectorAll('[cdkdraghandle]');
      await expect(handles.length).toBe(0);
    });
    await step('The row is drag-disabled, so mousedown does not swallow text selection', async () => {
      const rows = canvasElement.querySelectorAll('.value-row');
      await expect(rows.length).toBe(1);
      await expect(rows[0].classList.contains('cdk-drag-disabled')).toBe(true);
    });
  },
};
