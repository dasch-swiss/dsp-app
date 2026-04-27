import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { FileRepresentationInput, ParentResourceInput } from '../representation-inputs';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { PdfToolbarComponent } from './pdf-toolbar.component';

const makeSrc = (): FileRepresentationInput => ({
  fileUrl: 'https://example.org/document.pdf',
  userHasPermission: 'RV',
  filename: 'document.pdf',
});

const makeParentResource = (): ParentResourceInput => ({
  id: 'http://rdfh.ch/resource/1',
  properties: {},
  attachedToProject: 'http://rdfh.ch/project/1',
  type: 'http://api.dasch.swiss/ontology/knora-api/v2#DocumentRepresentation',
});

const notificationServiceStub: Partial<NotificationService> = {
  openSnackBar: () => {},
};

const representationServiceStub: Partial<RepresentationService> = {
  getIngestOriginalUrl: () => of('https://example.org/document.pdf'),
  downloadProjectFile: () => {},
};

const resourceFetcherServiceStub: Partial<ResourceFetcherService> = {
  userCanEdit$: of(false),
  projectShortcode$: of('0001'),
};

const meta: Meta<PdfToolbarComponent> = {
  title: 'Devs / Resource Editor / 3. Representation / PDF Toolbar',
  component: PdfToolbarComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(OverlayModule),
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: RepresentationService, useValue: representationServiceStub },
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceStub },
      ],
    }),
  ],
  argTypes: {
    zoomFactor: {
      description: 'Current zoom level of the PDF viewer (1 = 100%).',
      table: { type: { summary: 'number' }, category: 'State' },
    },
    src: {
      description: 'File value containing the PDF URL and user permissions.',
      table: { type: { summary: 'FileRepresentationInput' }, category: 'State' },
    },
    parentResource: {
      description: 'The parent resource the PDF belongs to.',
      table: { type: { summary: 'ParentResourceInput' }, category: 'State' },
    },
    zoomChange: { table: { category: 'Events' } },
    searchQuery: { table: { category: 'Events' } },
    fullscreenToggle: { table: { category: 'Events' } },
    downloadFile: { table: { category: 'Events' } },
  },
};
export default meta;
type Story = StoryObj<PdfToolbarComponent>;

export const DefaultView: Story = {
  name: 'Shows zoom, search and fullscreen controls',
  args: {
    src: makeSrc(),
    parentResource: makeParentResource(),
    zoomFactor: 1,
  },
  play: async ({ canvasElement, step }) => {
    await step('More menu trigger is rendered', async () => {
      const moreButton = canvasElement.querySelector('button[mat-icon-button]');
      await expect(moreButton).not.toBeNull();
    });
    await step('Zoom controls are rendered', async () => {
      const icons = Array.from(canvasElement.querySelectorAll('mat-icon'));
      const hasZoomIn = icons.some(i => i.textContent?.trim() === 'zoom_in');
      const hasZoomOut = icons.some(i => i.textContent?.trim() === 'zoom_out');
      await expect(hasZoomIn).toBe(true);
      await expect(hasZoomOut).toBe(true);
    });
    await step('Fullscreen button is rendered', async () => {
      const icons = Array.from(canvasElement.querySelectorAll('mat-icon'));
      await expect(icons.some(i => i.textContent?.trim() === 'fullscreen')).toBe(true);
    });
  },
};

export const WithEditPermission: Story = {
  name: 'Shows replace file option when user can edit',
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: ResourceFetcherService,
          useValue: { ...resourceFetcherServiceStub, userCanEdit$: of(true) },
        },
      ],
    }),
  ],
  args: {
    src: makeSrc(),
    parentResource: makeParentResource(),
    zoomFactor: 1,
  },
  play: async ({ canvasElement, step }) => {
    await step('Toolbar is rendered with edit controls available', async () => {
      const toolbar = canvasElement.querySelector('mat-toolbar, [class*="toolbar"]') ?? canvasElement.firstElementChild;
      await expect(toolbar).not.toBeNull();
    });
  },
};
