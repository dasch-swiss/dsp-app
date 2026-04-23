import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import {
  Constants,
  ReadAudioFileValue,
  ReadDocumentFileValue,
  ReadFileValue,
  ReadMovingImageFileValue,
  ReadResource,
} from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { RepresentationService } from './representations/representation.service';
import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { ResourceRepresentationComponent } from './resource-representation.component';
import { SegmentsService } from './segment-support/segments.service';
import {
  makeResourceFetcherServiceStub,
  makeSegmentsServiceStub,
  notificationServiceStub,
  representationServiceStub,
} from './stories.helpers';

const makeDspResource = (propKey: string, fileValue: ReadFileValue): DspResource => {
  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/1';
  res.attachedToProject = 'http://rdfh.ch/project/1';
  res.type = 'http://api.dasch.swiss/ontology/knora-api/v2#AudioRepresentation';
  res.properties = { [propKey]: [fileValue] };
  return new DspResource(res);
};

const makeAudioResource = (): DspResource =>
  makeDspResource(Constants.HasAudioFileValue, {
    type: Constants.AudioFileValue,
    fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    filename: 'audio.mp3',
    userHasPermission: 'RV',
  } as unknown as ReadAudioFileValue);

const makeVideoResource = (): DspResource =>
  makeDspResource(Constants.HasMovingImageFileValue, {
    type: Constants.MovingImageFileValue,
    fileUrl: 'https://iiif.stage.dasch.swiss:443/0869/3xUzuLcE9nC-MjBgXRjjsos.mp4/file',
    filename: 'video.mp4',
    userHasPermission: 'RV',
  } as unknown as ReadMovingImageFileValue);

const makeDocumentResource = (): DspResource =>
  makeDspResource(Constants.HasDocumentFileValue, {
    type: Constants.DocumentFileValue,
    fileUrl: 'https://example.org/document.docx',
    filename: 'document.docx',
    userHasPermission: 'RV',
  } as unknown as ReadDocumentFileValue);

const makePdfResource = (): DspResource =>
  makeDspResource(Constants.HasDocumentFileValue, {
    type: Constants.DocumentFileValue,
    fileUrl:
      'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCAzNTkgPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgo1MCA3NTAgVGQKMTQgVEwKKExvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCBjb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuKSBUaiBUKgooU2VkIGRvIGVpdXNtb2QgdGVtcG9yIGluY2lkaWR1bnQgdXQgbGFib3JlIGV0IGRvbG9yZSBtYWduYSBhbGlxdWEuKSBUaiBUKgooVXQgZW5pbSBhZCBtaW5pbSB2ZW5pYW0sIHF1aXMgbm9zdHJ1ZCBleGVyY2l0YXRpb24gdWxsYW1jby4pIFRqIFQqCihEdWlzIGF1dGUgaXJ1cmUgZG9sb3IgaW4gcmVwcmVoZW5kZXJpdCBpbiB2b2x1cHRhdGUgdmVsaXQgZXNzZS4pIFRqIFQqCihDaWxsdW0gZG9sb3JlIGV1IGZ1Z2lhdCBudWxsYSBwYXJpYXR1ci4pIFRqIFQqCkVUCmVuZHN0cmVhbQplbmRvYmoKNSAwIG9iago8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL0Jhc2VGb250IC9IZWx2ZXRpY2EgPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI0MSAwMDAwMCBuIAowMDAwMDAwNjUxIDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgNiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKNzIxCiUlRU9G',
    filename: 'document.pdf',
    userHasPermission: 'RV',
  } as unknown as ReadDocumentFileValue);

const makeArchiveResource = (): DspResource =>
  makeDspResource(Constants.HasArchiveFileValue, {
    type: Constants.ArchiveFileValue,
    fileUrl: 'https://example.org/archive.zip',
    filename: 'archive.zip',
    userHasPermission: 'RV',
  } as unknown as ReadFileValue);

const makeTextResource = (): DspResource =>
  makeDspResource(Constants.HasTextFileValue, {
    type: Constants.TextFileValue,
    fileUrl: 'https://example.org/document.txt',
    filename: 'document.txt',
    userHasPermission: 'RV',
  } as unknown as ReadFileValue);

const meta: Meta<ResourceRepresentationComponent> = {
  title: 'Visual / Resource Editor / Resource Representation',
  component: ResourceRepresentationComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(OverlayModule),
        { provide: RepresentationService, useValue: representationServiceStub },
        { provide: ResourceFetcherService, useValue: makeResourceFetcherServiceStub() },
        { provide: NotificationService, useValue: notificationServiceStub },
      ],
    }),
    moduleMetadata({
      providers: [{ provide: SegmentsService, useFactory: () => makeSegmentsServiceStub() }],
    }),
  ],
  argTypes: {
    resource: {
      description:
        'The DSP resource to display. The representation type is determined from the file value inside the resource.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceRepresentationComponent>;

export const Audio: Story = {
  name: 'Shows audio player in its container',
  args: { resource: makeAudioResource() },
  play: async ({ canvasElement, step }) => {
    await step('Audio component is rendered', async () => {
      await expect(canvasElement.querySelector('app-audio')).not.toBeNull();
    });
  },
};

export const Video: Story = {
  name: 'Shows video player in its container',
  args: { resource: makeVideoResource() },
  play: async ({ canvasElement, step }) => {
    await step('Video component is rendered', async () => {
      await expect(canvasElement.querySelector('app-video')).not.toBeNull();
    });
  },
};

export const Document: Story = {
  name: 'Shows non-PDF document with download button',
  args: { resource: makeDocumentResource() },
  play: async ({ canvasElement, step }) => {
    await step('Document component is rendered', async () => {
      await expect(canvasElement.querySelector('app-document')).not.toBeNull();
    });
  },
};

export const PdfDocument: Story = {
  name: 'Shows PDF viewer in its container',
  args: { resource: makePdfResource() },
  play: async ({ canvasElement, step }) => {
    await step('PDF document component is rendered', async () => {
      await expect(canvasElement.querySelector('app-pdf-document')).not.toBeNull();
    });
  },
};

export const Archive: Story = {
  name: 'Shows archive file with download button',
  args: { resource: makeArchiveResource() },
  play: async ({ canvasElement, step }) => {
    await step('Archive component is rendered', async () => {
      await expect(canvasElement.querySelector('app-archive')).not.toBeNull();
    });
  },
};

export const Text: Story = {
  name: 'Shows text file with download button',
  args: { resource: makeTextResource() },
  play: async ({ canvasElement, step }) => {
    await step('Text component is rendered', async () => {
      await expect(canvasElement.querySelector('app-text')).not.toBeNull();
    });
  },
};
