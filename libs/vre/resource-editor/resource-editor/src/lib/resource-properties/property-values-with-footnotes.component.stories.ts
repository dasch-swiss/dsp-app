import { Cardinality } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { PropertyValuesWithFootnotesComponent } from './property-values-with-footnotes.component';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/1',
    type: 'http://example.org/Thing',
    attachedToProject: 'http://rdfh.ch/projects/test',
    userHasPermission: 'RV',
  }) as any;

const makeProp = () => ({
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

const meta: Meta<PropertyValuesWithFootnotesComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Property Value / Property Values With Footnotes',
  component: PropertyValuesWithFootnotesComponent,
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
    prop: {
      description: 'Property info including definition, GUI configuration and values.',
      table: { type: { summary: 'PropertyInfoValues' }, category: 'State' },
    },
    resource: {
      description: 'The parent resource this property belongs to.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<PropertyValuesWithFootnotesComponent>;

export const WithValues: Story = {
  name: 'Shows property values without footnotes when none present',
  args: {
    prop: makeProp(),
    resource: makeResource(),
  },
  play: async ({ canvasElement, step }) => {
    await step('Property values component is rendered', async () => {
      const propertyValues = canvasElement.querySelector('app-property-values');
      await expect(propertyValues).not.toBeNull();
    });
    await step('Footnotes component is not rendered when no footnotes', async () => {
      const footnotes = canvasElement.querySelector('app-footnotes');
      await expect(footnotes).toBeNull();
    });
  },
};
