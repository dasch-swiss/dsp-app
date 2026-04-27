import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { FileRepresentationInput, ParentResourceInput } from '../representation-inputs';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { PdfDocumentComponent } from './pdf-document.component';

// Single-page PDF with Lorem ipsum — works offline, no CORS issues
const MINIMAL_PDF_DATA_URI =
  'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIg' +
  'MCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBv' +
  'YmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvQ29u' +
  'dGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2Jq' +
  'CjQgMCBvYmoKPDwgL0xlbmd0aCAzNTkgPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgo1MCA3NTAgVGQKMTQg' +
  'VEwKKExvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCBjb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQu' +
  'KSBUaiBUKgooU2VkIGRvIGVpdXNtb2QgdGVtcG9yIGluY2lkaWR1bnQgdXQgbGFib3JlIGV0IGRvbG9y' +
  'ZSBtYWduYSBhbGlxdWEuKSBUaiBUKgooVXQgZW5pbSBhZCBtaW5pbSB2ZW5pYW0sIHF1aXMgbm9zdHJ1' +
  'ZCBleGVyY2l0YXRpb24gdWxsYW1jby4pIFRqIFQqCihEdWlzIGF1dGUgaXJ1cmUgZG9sb3IgaW4gcmVw' +
  'cmVoZW5kZXJpdCBpbiB2b2x1cHRhdGUgdmVsaXQgZXNzZS4pIFRqIFQqCihDaWxsdW0gZG9sb3JlIGV1' +
  'IGZ1Z2lhdCBudWxsYSBwYXJpYXR1ci4pIFRqIFQqCkVUCmVuZHN0cmVhbQplbmRvYmoKNSAwIG9iago8' +
  'PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL0Jhc2VGb250IC9IZWx2ZXRpY2EgPj4KZW5kb2Jq' +
  'CnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4' +
  'IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI0MSAwMDAwMCBuIAowMDAwMDAwNjUx' +
  'IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgNiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKNzIxCiUl' +
  'RU9G';

const makeSrc = (fileUrl = MINIMAL_PDF_DATA_URI): FileRepresentationInput => ({
  fileUrl,
  userHasPermission: 'RV',
  filename: 'document.pdf',
});

const makeParentResource = (): ParentResourceInput => ({
  id: 'http://rdfh.ch/resource/1',
  properties: {},
  attachedToProject: 'http://rdfh.ch/project/1',
  type: 'http://api.dasch.swiss/ontology/knora-api/v2#DocumentRepresentation',
});

const representationServiceStub: Partial<RepresentationService> = {
  getFileInfo: () => of({ originalFilename: 'document.pdf' }),
  downloadProjectFile: () => {},
};

const resourceFetcherServiceStub: Partial<ResourceFetcherService> = {
  userCanEdit$: of(false),
  projectShortcode$: of('0001'),
};

const meta: Meta<PdfDocumentComponent> = {
  title: 'Devs / Resource Editor / 3. Representation / PDF Document',
  component: PdfDocumentComponent,
  decorators: [
    story => {
      const s = story();
      return {
        ...s,
        template: `<div style="height: 600px; background-color: black">${s.template ?? '<app-pdf-document [src]="src" [parentResource]="parentResource" />'}</div>`,
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
      description: 'File value containing the PDF URL.',
      table: { type: { summary: 'FileRepresentationInput' }, category: 'State' },
    },
    parentResource: {
      description: 'The parent resource the PDF belongs to.',
      table: { type: { summary: 'ParentResourceInput' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<PdfDocumentComponent>;

export const WithLivePdf: Story = {
  name: 'Renders a real PDF from a public source',
  args: {
    src: makeSrc(),
    parentResource: makeParentResource(),
  },
};

export const WithError: Story = {
  name: 'Shows error message when PDF fails to load',
  render: args => ({
    props: { ...args, failedToLoad: true },
  }),
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
