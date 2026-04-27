import { importProvidersFrom } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { RegionService } from '../representations/region.service';
import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { AnnotationToolbarComponent } from './annotation-toolbar.component';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/annotation/1',
    type: 'http://api.knora.org/ontology/knora-api/v2#Region',
    label: 'My Region',
    versionArkUrl: 'ark:/99999/1/annotation',
    userHasPermission: 'D',
    entityInfo: { classes: {} },
    properties: {},
    getValues: () => [],
  }) as any;

const meta: Meta<AnnotationToolbarComponent> = {
  title: 'Devs / Resource Editor / Properties / Properties Display / Annotation Toolbar',
  component: AnnotationToolbarComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(RouterModule.forRoot([])),
        { provide: NotificationService, useValue: { openSnackBar: () => {} } },
        {
          provide: RegionService,
          useValue: { selectRegion: () => {}, setHighlightedRegionClicked: () => {}, updateRegions$: () => of([]) },
        },
        {
          provide: ResourceFetcherService,
          useValue: {
            userCanDelete$: of(false),
            userCanEdit$: of(false),
            projectIri$: of('http://rdfh.ch/projects/test'),
            reload: () => {},
            scrollToTop: () => {},
          },
        },
        { provide: ResourceService, useValue: { getResourcePath: () => '/project/test/resource/1' } },
        {
          provide: DspApiConnectionToken,
          useValue: { v2: { res: { canDeleteResource: () => of({ canDo: false }) } } },
        },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The annotation (region) resource to display toolbar actions for.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
    parentResourceId: {
      description: 'IRI of the parent resource containing this annotation.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<AnnotationToolbarComponent>;

export const DefaultView: Story = {
  name: 'Shows annotation toolbar with open-in-new and share buttons',
  args: {
    resource: makeResource(),
    parentResourceId: 'http://rdfh.ch/resource/1',
  },
  play: async ({ canvasElement, step }) => {
    await step('Open in new window button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="open-in-new-window-button"]');
      await expect(button).not.toBeNull();
    });
    await step('Share button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="share-button"]');
      await expect(button).not.toBeNull();
    });
  },
};
