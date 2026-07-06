import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ProjectDataRightsService } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { CreateResourceDialogComponent } from './create-resource-dialog.component';

const makeDialogData = () => ({
  resourceType: 'Thing',
  resourceClassIri: 'http://example.org/onto#Thing',
  projectIri: 'http://rdfh.ch/projects/test',
  projectShortcode: 'test',
});

const makeOntologyStub = (resourceClassIri: string) => ({
  classes: {
    [resourceClassIri]: {
      id: resourceClassIri,
      label: 'Thing',
      getResourcePropertiesList: () => [],
    },
  },
  properties: {},
});

@Component({
  selector: 'app-create-resource-dialog-launcher',
  template: ``,
})
class CreateResourceDialogLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);

  ngOnInit() {
    this._dialog.open(CreateResourceDialogComponent, { data: makeDialogData() });
  }
}

const meta: Meta<CreateResourceDialogLauncherComponent> = {
  title:
    'Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Template Switcher / Create Resource Dialog',
  component: CreateResourceDialogLauncherComponent,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              ontologyCache: {
                reloadCachedItem: () => of(null),
                getResourceClassDefinition: (iri: string) => of(makeOntologyStub(iri)),
              },
              res: { createResource: () => of({ id: 'http://rdfh.ch/resource/new' }) },
            },
          },
        },
        // The hosted create-resource form loads project legal info on init; stub the rights service.
        { provide: ProjectDataRightsService, useValue: { forProject: () => of({ defaultDataAuthorship: [] }) } },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<CreateResourceDialogLauncherComponent>;

export const DefaultView: Story = {
  name: 'Shows create resource dialog with form inside',
  play: async ({ step }) => {
    await step('Dialog content container is rendered', async () => {
      const dialog = document.querySelector('[data-cy="create-resource-dialog"]');
      await expect(dialog).not.toBeNull();
    });
  },
};
