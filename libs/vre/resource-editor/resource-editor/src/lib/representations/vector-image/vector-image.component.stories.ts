import { provideHttpClient } from '@angular/common/http';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { Constants, ReadResource, ReadStillImageVectorFileValue } from '@dasch-swiss/dsp-js';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { NEVER } from 'rxjs';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { VectorImageComponent } from './vector-image.component';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Minimal SVG encoded as a data: URI so no network request is needed.
const INLINE_SVG_URL =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
      '<rect width="400" height="300" fill="#2a2a2a"/>' +
      '<circle cx="200" cy="150" r="80" fill="none" stroke="#4fc3f7" stroke-width="4"/>' +
      '<line x1="50" y1="50" x2="350" y2="250" stroke="#ef9a9a" stroke-width="2"/>' +
      '<text x="200" y="155" text-anchor="middle" fill="white" font-size="18">SVG Vector</text>' +
      '</svg>'
  );

const makeVectorResource = (fileUrl = INLINE_SVG_URL): ReadResource =>
  ({
    id: 'http://rdfh.ch/resource/vector-1',
    attachedToProject: 'http://rdfh.ch/project/1',
    attachedToUser: 'http://rdfh.ch/user/1',
    userHasPermission: 'RV',
    properties: {
      [Constants.HasStillImageFileValue]: [
        {
          type: Constants.StillImageVectorFileValue,
          id: 'http://rdfh.ch/value/vector-1',
          fileUrl,
          filename: 'diagram.svg',
          userHasPermission: 'RV',
        } as unknown as ReadStillImageVectorFileValue,
      ],
    },
  }) as unknown as ReadResource;

const makeEmptyResource = (): ReadResource =>
  ({
    id: 'http://rdfh.ch/resource/vector-empty',
    attachedToProject: 'http://rdfh.ch/project/1',
    attachedToUser: 'http://rdfh.ch/user/1',
    userHasPermission: 'RV',
    properties: {},
  }) as unknown as ReadResource;

// ---------------------------------------------------------------------------
// Shared providers
// ---------------------------------------------------------------------------

const sharedProviders = [
  provideHttpClient(),
  { provide: AppConfigService, useValue: { dspApiConfig: { apiUrl: '' }, dspAppConfig: { iriBase: 'http://rdfh.ch' } } },
  { provide: DspApiConnectionToken, useValue: { v2: { res: { getResource: () => NEVER } } } },
  { provide: ResourceFetcherService, useValue: { userCanEdit$: of(false), projectShortcode$: of('0001') } },
  { provide: RepresentationService, useValue: { downloadProjectFile: () => {}, getFileInfo: () => of({ originalFilename: 'diagram.svg' }) } },
  { provide: NotificationService, useValue: { openSnackBar: () => {} } },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<VectorImageComponent> = {
  title: 'Devs / Resource Editor / Representation / Vector Image',
  component: VectorImageComponent,
  decorators: [
    applicationConfig({ providers: sharedProviders }),
    story => {
      const s = story();
      return {
        ...s,
        template: `<div style="height: 500px; background-color: #1a1a1a; display: flex; flex-direction: column">${s.template ?? '<app-vector-image [resource]="resource" [compoundMode]="compoundMode" />'}</div>`,
      };
    },
  ],
  argTypes: {
    resource: {
      description: 'The ReadResource containing the vector image file value.',
      table: { type: { summary: 'ReadResource' }, category: 'Inputs' },
    },
    compoundMode: {
      description: 'When true, shows compound navigation arrows and slider.',
      table: { type: { summary: 'boolean' }, category: 'Inputs' },
    },
  },
};
export default meta;
type Story = StoryObj<VectorImageComponent>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const WithSvg: Story = {
  name: 'Renders an SVG vector image',
  args: {
    resource: makeVectorResource(),
    compoundMode: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('Vector container is rendered', async () => {
      await expect(canvasElement.querySelector('.vector-container')).not.toBeNull();
    });
    await step('No error message is shown', async () => {
      await expect(canvasElement.querySelector('app-no-results-found')).toBeNull();
    });
  },
};

export const CompoundMode: Story = {
  name: 'Shows compound navigation arrows when in compound mode',
  args: {
    resource: makeVectorResource(),
    compoundMode: true,
  },
  play: async ({ canvasElement, step }) => {
    await step('Compound arrow navigation components are rendered', async () => {
      const arrows = canvasElement.querySelectorAll('app-compound-arrow-navigation');
      await expect(arrows.length).toBe(2);
    });
  },
};

export const NoImage: Story = {
  name: 'Shows error message when the resource has no vector image file value',
  args: {
    resource: makeEmptyResource(),
    compoundMode: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('Error message component is rendered', async () => {
      await expect(canvasElement.querySelector('app-no-results-found')).not.toBeNull();
    });
    await step('Vector container is not rendered', async () => {
      await expect(canvasElement.querySelector('.vector-container')).toBeNull();
    });
  },
};
