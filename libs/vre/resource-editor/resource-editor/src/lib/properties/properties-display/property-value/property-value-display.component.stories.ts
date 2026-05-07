import { importProvidersFrom, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { BehaviorSubject, of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../../../representation/resource-fetcher.service';
import { GeonameService } from '../template-switcher/geoname.service';
import { FootnoteService } from '../footnotes/footnote.service';
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
  title:
    'Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Property Value / Properties Display / Property Value Display',
  component: PropertyValueDisplayComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(RouterModule.forRoot([])),
        { provide: PropertyValueService, useValue: makePropertyValueServiceStub() },
        { provide: PropertiesDisplayService, useValue: { showComments$: of(false) } },
        { provide: ResourceService, useValue: { getResourcePath: (iri: string) => iri } },
        { provide: GeonameService, useValue: { resolveGeonameID: () => of(null) } },
        { provide: FootnoteService, useValue: { reloadToken: signal(0) } },
        {
          provide: DspApiConnectionToken,
          useValue: { v2: { list: { getNode: () => of({}), getList: () => of({}) } } },
        },
        { provide: ResourceFetcherService, useValue: { resource$: of(undefined), projectShortcode$: of('0001') } },
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
