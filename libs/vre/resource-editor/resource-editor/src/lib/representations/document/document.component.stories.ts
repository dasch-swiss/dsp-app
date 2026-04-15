import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { FileRepresentationInput, ParentResourceInput } from '../representation-inputs';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { DocumentComponent } from './document.component';

const makeSrc = (): FileRepresentationInput => ({
  fileUrl: 'https://example.org/document.docx',
  userHasPermission: 'RV',
  filename: 'document.docx',
});

const makeParentResource = (): ParentResourceInput => ({
  id: 'http://rdfh.ch/resource/1',
  properties: {},
  attachedToProject: 'http://rdfh.ch/project/1',
  type: 'http://api.dasch.swiss/ontology/knora-api/v2#DocumentRepresentation',
});

const representationServiceStub: Partial<RepresentationService> = {
  getFileInfo: () => of({ originalFilename: 'document.docx' }),
};

const resourceFetcherServiceStub: Partial<ResourceFetcherService> = {
  userCanEdit$: of(false),
  projectShortcode$: of('0001'),
};

const meta: Meta<DocumentComponent> = {
  title: 'Devs / Resource Editor / Representation / Document',
  component: DocumentComponent,
  decorators: [
    story => {
      const s = story();
      return {
        ...s,
        template: `<div style="height: 400px; background-color: black">${s.template ?? '<app-document [src]="src" [parentResource]="parentResource" />'}</div>`,
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
      description: 'File value containing the document URL.',
      table: { type: { summary: 'FileRepresentationInput' }, category: 'State' },
    },
    parentResource: {
      description: 'The parent resource the document belongs to.',
      table: { type: { summary: 'ParentResourceInput' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<DocumentComponent>;

export const Default: Story = {
  name: 'Shows document filename with download button',
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
  name: 'Shows error message when document fails to load',
  decorators: [
    applicationConfig({
      providers: [
{
          provide: RepresentationService,
          useValue: { getFileInfo: () => { throw new Error('load failed'); } } as Partial<RepresentationService>,
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
