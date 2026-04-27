import { Cardinality } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { PropertyValuesComponent } from './property-values.component';

const makeEditModeData = () => ({
  resource: {
    id: 'http://rdfh.ch/resource/1',
    type: 'http://example.org/Thing',
    attachedToProject: 'http://rdfh.ch/projects/test',
    userHasPermission: 'CR',
  } as any,
  values: [
    {
      id: 'http://rdfh.ch/values/1',
      type: 'http://api.knora.org/ontology/knora-api/v2#IntValue',
      intValueAsInt: 42,
      valueHasComment: null,
      property: 'http://example.org/prop',
      userHasPermission: 'RV',
      uuid: 'uuid-1',
      valueCreationDate: '2024-06-15T10:00:00Z',
    } as any,
  ],
});

const makeMyProperty = () => ({
  guiDef: {
    cardinality: Cardinality._0_n,
    isInherited: false,
    propertyIndex: 'http://example.org/prop',
    propertyDefinition: {
      label: 'Integer Value',
      id: 'http://example.org/prop',
      objectType: 'http://api.knora.org/ontology/knora-api/v2#IntValue',
    } as any,
  } as any,
  propDef: {
    label: 'Integer Value',
    id: 'http://example.org/prop',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#IntValue',
  } as any,
  values: makeEditModeData().values,
});

const meta: Meta<PropertyValuesComponent> = {
  title:
    'Devs / Resource Editor / 4. Properties / Properties Display / Property Value / Properties Display / Property Values',
  component: PropertyValuesComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: ResourceFetcherService, useValue: { resourceVersion: null, reload: () => {} } },
        { provide: ResourceService, useValue: { getProjectShortcode: () => 'test' } },
        {
          provide: DspApiConnectionToken,
          useValue: { v2: { values: { createValue: () => of({}), updateValue: () => of({}) } } },
        },
        { provide: NotificationService, useValue: { openSnackBar: () => {} } },
      ],
    }),
  ],
  argTypes: {
    editModeData: {
      description: 'Resource and its values for the property being displayed.',
      table: { type: { summary: '{ resource: ReadResource; values: ReadValue[] }' }, category: 'State' },
    },
    myProperty: {
      description: 'Property info including definition, GUI configuration and cardinality.',
      table: { type: { summary: 'PropertyInfoValues' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<PropertyValuesComponent>;

export const WithValues: Story = {
  name: 'Shows property values list with add button',
  args: {
    editModeData: makeEditModeData(),
    myProperty: makeMyProperty(),
  },
  play: async ({ canvasElement, step }) => {
    await step('Add property value button is rendered', async () => {
      const addButton = canvasElement.querySelector('[data-cy="add-property-value-button"]');
      await expect(addButton).not.toBeNull();
    });
  },
};
