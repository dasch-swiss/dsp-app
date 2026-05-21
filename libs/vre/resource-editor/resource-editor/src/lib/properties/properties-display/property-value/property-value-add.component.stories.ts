import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { BehaviorSubject, of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../../../representation/resource-fetcher.service';
import { notificationServiceStub } from '../../../stories.helpers';
import { PropertyValueAddComponent } from './property-value-add.component';
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
    values: [] as any,
  },
  lastOpenedItem$: new BehaviorSubject<number | null>(null) as any,
  toggleOpenedValue: () => {},
});

const meta: Meta<PropertyValueAddComponent> = {
  title:
    'Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Property Value / Properties Display / Property Value Add',
  component: PropertyValueAddComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: PropertyValueService, useValue: makePropertyValueServiceStub() },
        { provide: ResourceFetcherService, useValue: { reload: () => {} } },
        { provide: ResourceService, useValue: { getProjectShortcode: () => 'test' } },
        { provide: DspApiConnectionToken, useValue: { v2: { values: { createValue: () => of({}) } } } },
        { provide: NotificationService, useValue: notificationServiceStub },
      ],
    }),
  ],
  argTypes: {
    stopAdding: {
      description: 'Emitted when the user cancels or successfully adds a value.',
      table: { type: { summary: 'EventEmitter<void>' }, category: 'Events' },
    },
  },
};
export default meta;
type Story = StoryObj<PropertyValueAddComponent>;

export const DefaultView: Story = {
  name: 'Shows add form with save and undo buttons',
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
