import { ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { ReplaceFileMenuItemComponent } from './replace-file-menu-item.component';

const meta: Meta<ReplaceFileMenuItemComponent> = {
  title: 'Resource Editor / 3. Representation / File Representation / Replace File Menu Item',
  component: ReplaceFileMenuItemComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: MatDialog, useValue: { open: () => {} } }],
    }),
  ],
  argTypes: {
    dialogConfig: {
      description: 'Title and representation type for the replace file dialog.',
      table: { type: { summary: 'ReplaceFileDialogConfig' }, category: 'State' },
    },
    parentResource: {
      description: 'Parent resource that owns the file to replace.',
      table: { type: { summary: 'ParentResourceInput' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ReplaceFileMenuItemComponent>;

export const DefaultView: Story = {
  name: 'Shows replace file button',
  args: {
    dialogConfig: {
      title: 'Replace Video',
      representation: 'http://api.knora.org/ontology/knora-api/v2#HasMovingImageFileValue',
    },
    parentResource: {
      id: 'http://rdfh.ch/resource/1',
      type: 'http://example.org/Thing',
      attachedToProject: 'http://rdfh.ch/projects/test',
    } as any,
    viewContainerRef: {} as ViewContainerRef,
  },
  play: async ({ canvasElement, step }) => {
    await step('Replace file button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="replace-file-button"]');
      await expect(button).not.toBeNull();
    });
  },
};
