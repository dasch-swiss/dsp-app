import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from './resource-fetcher.service';
import { RepresentationService } from './representation.service';
import { FileRepresentationComponent } from './file-representation.component';

const makeSrc = () => ({
  fileUrl: 'https://example.org/document.pdf',
  userHasPermission: 'CR',
  filename: 'document.pdf',
});

const makeParentResource = () => ({
  id: 'http://rdfh.ch/resource/1',
  type: 'http://example.org/Thing',
  attachedToProject: 'http://rdfh.ch/projects/test',
  userHasPermission: 'CR',
});

const makeDialogConfig = () => ({
  projectShortcode: 'test',
  resourceId: 'http://rdfh.ch/resource/1',
  representationToReplace: makeSrc() as any,
  currentUser: null,
});

const meta: Meta<FileRepresentationComponent> = {
  title: 'Devs / Resource Editor / Representation / File Representation',
  component: FileRepresentationComponent,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: RepresentationService,
          useValue: {
            getFileInfo: () => of({ originalFilename: 'document.pdf' }),
            downloadProjectFile: () => {},
          },
        },
        {
          provide: ResourceFetcherService,
          useValue: {
            userCanEdit$: of(false),
            resource$: of(null),
            projectShortcode$: of('test'),
          },
        },
      ],
    }),
  ],
  argTypes: {
    src: {
      description: 'File representation input containing the file URL and user permissions.',
      table: { type: { summary: 'FileRepresentationInput' }, category: 'State' },
    },
    parentResource: {
      description: 'Parent resource the file belongs to.',
      table: { type: { summary: 'ParentResourceInput' }, category: 'State' },
    },
    dialogConfig: {
      description: 'Configuration for the replace file dialog.',
      table: { type: { summary: 'ReplaceFileDialogConfig' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<FileRepresentationComponent>;

export const DefaultView: Story = {
  name: 'Shows filename and download button for a file resource',
  args: {
    src: makeSrc() as any,
    parentResource: makeParentResource() as any,
    dialogConfig: makeDialogConfig() as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Filename is displayed', async () => {
      await expect(canvasElement.textContent).toContain('document.pdf');
    });
  },
};
