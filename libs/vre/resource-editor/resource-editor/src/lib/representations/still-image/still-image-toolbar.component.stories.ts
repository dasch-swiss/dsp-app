import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { Constants, ReadStillImageFileValue } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { makeResourceFetcherServiceStub, notificationServiceStub } from '../../stories.helpers';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { OpenSeaDragonService } from './open-sea-dragon.service';
import { StillImageToolbarComponent } from './still-image-toolbar.component';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/1',
    attachedToProject: 'http://rdfh.ch/project/1',
    type: 'http://api.dasch.swiss/ontology/knora-api/v2#StillImageRepresentation',
    properties: {
      [Constants.HasStillImageFileValue]: [
        {
          type: Constants.StillImageFileValue,
          fileUrl: 'https://example.org/image.jpx',
          arkUrl: 'http://ark.dasch.swiss/ark:/72163/1/1',
          userHasPermission: 'RV',
        } as unknown as ReadStillImageFileValue,
      ],
    },
  }) as any;

const representationServiceStub: Partial<RepresentationService> = {
  downloadProjectFile: () => {},
};

const osdServiceStub: Partial<OpenSeaDragonService> = {
  drawing: false,
  zoom: () => {},
  viewer: {
    viewport: { goHome: () => {} },
    setFullScreen: () => {},
  } as any,
};

const meta: Meta<StillImageToolbarComponent> = {
  title: 'Resource Editor / Resource / Still Image / Still Image Toolbar',
  component: StillImageToolbarComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(OverlayModule),
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: RepresentationService, useValue: representationServiceStub },
        { provide: ResourceFetcherService, useValue: makeResourceFetcherServiceStub() },
        { provide: OpenSeaDragonService, useValue: osdServiceStub },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The parent ReadResource containing the still image file value.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
    compoundMode: {
      description: 'Whether compound navigation is shown in the toolbar.',
      table: { type: { summary: 'boolean' }, category: 'State' },
    },
    isPng: {
      description: 'Whether the image is currently displayed as PNG (vs JPG).',
      table: { type: { summary: 'boolean' }, category: 'State' },
    },
    imageIsPng: {
      description: 'Emitted when the user switches between JPG and PNG.',
      table: { category: 'Events', type: { summary: 'EventEmitter<boolean>' } },
    },
  },
};
export default meta;
type Story = StoryObj<StillImageToolbarComponent>;

export const DefaultView: Story = {
  name: 'Shows share, download and zoom controls for a standard image',
  args: {
    resource: makeResource(),
    compoundMode: false,
    isPng: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('Share button is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="still-image-share-button"]')).not.toBeNull();
    });
    await step('Download button is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="still-image-download-button"]')).not.toBeNull();
    });
    await step('Zoom controls are rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="zoom-in"]')).not.toBeNull();
      await expect(canvasElement.querySelector('[data-cy="zoom-out"]')).not.toBeNull();
      await expect(canvasElement.querySelector('[data-cy="zoom-reset"]')).not.toBeNull();
    });
    await step('Fullscreen button is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="fullscreen"]')).not.toBeNull();
    });
  },
};

export const WithEditPermission: Story = {
  name: 'Shows draw-region button when user can edit',
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: ResourceFetcherService,
          useValue: makeResourceFetcherServiceStub({ userCanEdit: true }),
        },
        { provide: OpenSeaDragonService, useValue: osdServiceStub },
      ],
    }),
  ],
  args: {
    resource: makeResource(),
    compoundMode: false,
    isPng: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('Draw region button is visible for editors', async () => {
      await expect(canvasElement.querySelector('[data-cy="still-image-region-button"]')).not.toBeNull();
    });
  },
};

export const WithoutEditPermission: Story = {
  name: 'Hides draw-region button for read-only users',
  args: {
    resource: makeResource(),
    compoundMode: false,
    isPng: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('Draw region button is not rendered for read-only users', async () => {
      await expect(canvasElement.querySelector('[data-cy="still-image-region-button"]')).toBeNull();
    });
  },
};
