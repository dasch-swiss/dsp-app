import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { DspResource, ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateModule } from '@ngx-translate/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';
import { ResourceFetcherService } from './representations/resource-fetcher.service';

import { ResourceComponent } from './resource.component';
import { appConfigServiceStub, notificationServiceStub } from './stories.helpers';

const makeResource = (): DspResource =>
  ({
    res: {
      id: 'http://rdfh.ch/resource/1',
      type: 'http://example.org/Thing',
      label: 'Test Resource',
      attachedToProject: 'http://rdfh.ch/projects/test',
      attachedToUser: 'http://rdfh.ch/users/test',
      userHasPermission: 'CR',
      properties: {},
      entityInfo: {
        classes: {
          'http://example.org/Thing': { label: 'Thing', comment: '' },
        },
      },
    },
    resProps: [],
    incomingAnnotations: [],
  }) as unknown as DspResource;

const meta: Meta<ResourceComponent> = {
  title: 'Devs / Resource Editor / Resource / Resource',
  component: ResourceComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(RouterModule.forRoot([]), TranslateModule.forRoot(), OverlayModule),
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              search: {
                doSearchStillImageRepresentationsCount: () => of({ numberOfResults: 0 }),
                doSearchIncomingLinks: () => of({ resources: [], mayHaveMoreResults: false }),
              },
              res: {
                getResource: () => of(null),
                canDeleteResource: () => of({ canDo: true }),
                getResourcePermissions: () => of([]),
              },
            },
          },
        },
        {
          provide: AppConfigService,
          useValue: appConfigServiceStub,
        },
        { provide: UserService, useValue: { user$: of(null) } },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: ResourceService, useValue: { getResourcePath: () => '/project/test/resource/1' } },
        {
          provide: ProjectApiService,
          useValue: {
            get: () =>
              of({ project: { id: 'http://rdfh.ch/projects/test', shortname: 'test', longname: 'Test Project' } }),
          },
        },
        {
          provide: ResourceFetcherService,
          useValue: {
            userCanEdit$: of(false),
            userCanDelete$: of(false),
            resource$: of(undefined),
            projectShortcode$: of('0001'),
            scrollToTop$: of(),
          },
        },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The DSP resource to display.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceComponent>;

export const ObjectWithoutRepresentation: Story = {
  name: 'Shows resource header and tabs for object without file representation',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Resource header is rendered', async () => {
      const header = canvasElement.querySelector('app-resource-header');
      await expect(header).not.toBeNull();
    });
  },
};
