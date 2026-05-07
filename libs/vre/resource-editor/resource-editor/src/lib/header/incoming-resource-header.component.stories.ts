import { importProvidersFrom } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { IncomingResourceHeaderComponent } from './incoming-resource-header.component';
import { ResourceFetcherService } from '../representation/resource-fetcher.service';
import { PropertiesDisplayService } from '../properties/properties-display/property-value/properties-display.service';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/2',
    type: 'http://example.org/Thing',
    label: 'Incoming Resource Label',
    attachedToProject: 'http://rdfh.ch/projects/test',
    attachedToUser: 'http://rdfh.ch/users/test-user',
    creationDate: '2024-06-15T10:00:00.000Z',
    userHasPermission: 'RV',
    versionArkUrl: 'ark:/99999/1/incoming',
    entityInfo: {
      classes: {
        'http://example.org/Thing': { label: 'Thing', comment: '', getResourcePropertiesList: () => [] },
      },
    },
    getValues: () => [],
    properties: {},
  }) as any;

const meta: Meta<IncomingResourceHeaderComponent> = {
  title: 'Resource Editor / 4. Properties / Resource Default Tabs / Incoming Resource Header',
  component: IncomingResourceHeaderComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(RouterModule.forRoot([])),
        {
          provide: ResourceFetcherService,
          useValue: {
            userCanEdit$: of(false),
            userCanDelete$: of(false),
            attachedUser$: of({ givenName: 'Jane', familyName: 'Doe', username: 'jane.doe' }),
          },
        },
        {
          provide: ProjectApiService,
          useValue: {
            get: () =>
              of({ project: { id: 'http://rdfh.ch/projects/test', shortname: 'test', longname: 'Test Project' } }),
          },
        },
        {
          provide: PropertiesDisplayService,
          useValue: {
            showAllProperties$: of(false),
            showComments$: of(false),
            toggleShowProperties: () => {},
            toggleShowComments: () => {},
          },
        },
        { provide: UserService, useValue: { user$: of(null) } },
        { provide: ResourceService, useValue: { getResourcePath: (iri: string) => iri } },
        { provide: DspApiConnectionToken, useValue: { v2: { res: { canDeleteResource: () => of({ canDo: true }) } } } },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The incoming resource to display in the header.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<IncomingResourceHeaderComponent>;

export const DefaultView: Story = {
  name: 'Shows incoming resource label and actions',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Resource label is displayed', async () => {
      const label = canvasElement.querySelector('[data-cy="resource-header-label"]');
      await expect(label?.textContent?.trim()).toBe('Incoming Resource Label');
    });
    await step('Show all properties button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="show-all-properties"]');
      await expect(button).not.toBeNull();
    });
  },
};
