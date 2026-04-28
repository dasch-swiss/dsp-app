import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of, throwError } from 'rxjs';
import { expect } from 'storybook/test';

import { FileRepresentationInput, ParentResourceInput } from '../representation-inputs';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { TextComponent } from './text.component';

const makeSrc = (): FileRepresentationInput => ({
  fileUrl: 'https://example.org/document.txt',
  userHasPermission: 'RV',
  filename: 'document.txt',
});

const makeParentResource = (): ParentResourceInput => ({
  id: 'http://rdfh.ch/resource/1',
  properties: {},
  attachedToProject: 'http://rdfh.ch/project/1',
  type: 'http://api.dasch.swiss/ontology/knora-api/v2#TextRepresentation',
});

const representationServiceStub: Partial<RepresentationService> = {
  getFileInfo: () => of({ originalFilename: 'document.txt' }),
};

const resourceFetcherServiceStub: Partial<ResourceFetcherService> = {
  userCanEdit$: of(false),
  projectShortcode$: of('0001'),
};

const meta: Meta<TextComponent> = {
  title: 'Resource Editor / 3. Representation / Text',
  component: TextComponent,
  decorators: [
    story => {
      const s = story();
      return {
        ...s,
        template: `<div style="height: 400px; background-color: black">${s.template ?? '<app-text [src]="src" [parentResource]="parentResource" />'}</div>`,
      };
    },
    applicationConfig({
      providers: [
        { provide: RepresentationService, useValue: representationServiceStub },
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceStub },
      ],
    }),
  ],
  argTypes: {
    src: {
      description: 'File value containing the text file URL.',
      table: { type: { summary: 'FileRepresentationInput' }, category: 'State' },
    },
    parentResource: {
      description: 'The parent resource the text file belongs to.',
      table: { type: { summary: 'ParentResourceInput' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<TextComponent>;

export const Default: Story = {
  name: 'Shows text filename with download button',
  args: {
    src: makeSrc(),
    parentResource: makeParentResource(),
  },
  play: async ({ canvasElement, step }) => {
    await step('Filename is displayed', async () => {
      const msg = canvasElement.querySelector('app-centered-message');
      await expect(msg).not.toBeNull();
    });
  },
};

export const WithError: Story = {
  name: 'Shows error message when text file fails to load',
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: RepresentationService,
          useValue: { getFileInfo: () => throwError(() => new Error('load failed')) } as Partial<RepresentationService>,
        },
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceStub },
      ],
    }),
  ],
  args: {
    src: makeSrc(),
    parentResource: makeParentResource(),
  },
  play: async ({ canvasElement, step }) => {
    await step('Error message component is rendered', async () => {
      const errMsg = canvasElement.querySelector('app-representation-error-message');
      await expect(errMsg).not.toBeNull();
    });
  },
};
