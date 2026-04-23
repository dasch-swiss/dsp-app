import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { VectorImageToolbarComponent } from './vector-image-toolbar.component';
import { makeResourceFetcherServiceStub, notificationServiceStub } from '../../stories.helpers';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/1',
    attachedToProject: 'http://rdfh.ch/project/1',
    type: 'http://api.dasch.swiss/ontology/knora-api/v2#StillImageRepresentation',
    properties: {
      [Constants.HasStillImageFileValue]: [
        {
          type: 'http://api.dasch.swiss/ontology/knora-api/v2#StillImageFileValue',
          fileUrl: 'https://example.org/image.svg',
          arkUrl: 'http://ark.dasch.swiss/ark:/72163/1/1',
          userHasPermission: 'RV',
        },
      ],
    },
  }) as any;

const representationServiceStub: Partial<RepresentationService> = {
  downloadProjectFile: () => {},
};

const meta: Meta<VectorImageToolbarComponent> = {
  title: 'Devs / Resource Editor / Representation / Vector Image Toolbar',
  component: VectorImageToolbarComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(OverlayModule),
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: RepresentationService, useValue: representationServiceStub },
        { provide: ResourceFetcherService, useValue: makeResourceFetcherServiceStub() },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The parent ReadResource containing the vector image file value.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
    zoomIn: { table: { category: 'Events' } },
    zoomOut: { table: { category: 'Events' } },
    resetZoom: { table: { category: 'Events' } },
    fullscreen: { table: { category: 'Events' } },
    backgroundChange: { table: { category: 'Events' } },
  },
};
export default meta;
type Story = StoryObj<VectorImageToolbarComponent>;

export const DefaultView: Story = {
  name: 'Shows share, download, background and zoom controls',
  args: {
    resource: makeResource(),
  },
  play: async ({ canvasElement, step }) => {
    await step('Share button is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="vector-image-share-button"]')).not.toBeNull();
    });
    await step('Download button is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="vector-image-download-button"]')).not.toBeNull();
    });
    await step('Zoom controls are rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="vector-zoom-in"]')).not.toBeNull();
      await expect(canvasElement.querySelector('[data-cy="vector-zoom-out"]')).not.toBeNull();
      await expect(canvasElement.querySelector('[data-cy="vector-zoom-reset"]')).not.toBeNull();
    });
    await step('Fullscreen button is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="vector-fullscreen"]')).not.toBeNull();
    });
  },
};

export const WithEditPermission: Story = {
  name: 'Shows replace file option in more menu when user can edit',
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: ResourceFetcherService,
          useValue: makeResourceFetcherServiceStub({ userCanEdit: true }),
        },
      ],
    }),
  ],
  args: {
    resource: makeResource(),
  },
  play: async ({ canvasElement, step }) => {
    await step('More menu trigger is present', async () => {
      await expect(canvasElement.querySelector('[data-cy="more-vert-vector-button"]')).not.toBeNull();
    });
  },
};
