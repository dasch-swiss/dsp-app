import { OverlayModule } from '@angular/cdk/overlay';
import { Component, importProvidersFrom, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import {
  Constants,
  IHasPropertyWithPropertyDefinition,
  ReadMovingImageFileValue,
  ReadResource,
  ReadTextValueAsString,
  ResourceClassAndPropertyDefinitions,
  ResourceClassDefinitionWithPropertyDefinition,
  ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { ProjectApiService, UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { NEVER, of } from 'rxjs';
import { expect } from 'storybook/test';

import { RepresentationService } from './representations/representation.service';
import { ResourceFetcherDialogComponent } from './resource-fetcher-dialog.component';

// ---------------------------------------------------------------------------
// Helpers (mirrored from resource-fetcher.component.stories.ts)
// ---------------------------------------------------------------------------

const makeTextPropDef = (id: string, label: string): ResourcePropertyDefinition => {
  const def = new ResourcePropertyDefinition();
  def.id = id;
  def.label = label;
  def.objectType = Constants.TextValue;
  def.subPropertyOf = [];
  def.isLinkProperty = false;
  def.isEditable = true;
  return def;
};

const makePropEntry = (propDef: ResourcePropertyDefinition, guiOrder: number): IHasPropertyWithPropertyDefinition => ({
  propertyIndex: propDef.id,
  cardinality: 1 as any,
  guiOrder,
  isInherited: false,
  propertyDefinition: propDef,
});

const makeTextValue = (id: string, text: string): ReadTextValueAsString => {
  const v = new ReadTextValueAsString();
  v.id = id;
  v.text = text;
  v.type = Constants.TextValue;
  v.userHasPermission = 'RV';
  return v;
};

const makeEntityInfo = (
  resourceType: string,
  propEntries: IHasPropertyWithPropertyDefinition[] = [],
  classLabel = 'Thing'
): ResourceClassAndPropertyDefinitions => {
  const classStub = {
    label: classLabel,
    getResourcePropertiesList: () => propEntries,
    propertiesList: propEntries,
  } as unknown as ResourceClassDefinitionWithPropertyDefinition;
  return new ResourceClassAndPropertyDefinitions({ [resourceType]: classStub }, {});
};

const makeVideoReadResource = (): ReadResource => {
  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/1';
  res.attachedToProject = 'http://rdfh.ch/project/1';
  res.attachedToUser = 'http://rdfh.ch/user/1';
  res.label = 'My Storybook Video';
  res.userHasPermission = 'RV';
  res.creationDate = '2024-03-15T10:30:00Z';
  res.type = 'http://api.dasch.swiss/ontology/knora-api/v2#MovingImageRepresentation';

  const titlePropId = 'http://0.0.0.0:3333/ontology/0869/example/v2#hasTitle';
  const descriptionPropId = 'http://0.0.0.0:3333/ontology/0869/example/v2#hasDescription';
  const titleDef = makeTextPropDef(titlePropId, 'Title');
  const descriptionDef = makeTextPropDef(descriptionPropId, 'Description');
  const propEntries = [makePropEntry(titleDef, 0), makePropEntry(descriptionDef, 1)];

  res.properties = {
    [Constants.HasMovingImageFileValue]: [
      {
        type: Constants.MovingImageFileValue,
        fileUrl: 'https://iiif.stage.dasch.swiss:443/0869/3xUzuLcE9nC-MjBgXRjjsos.mp4/file',
        filename: 'video.mp4',
        userHasPermission: 'RV',
      } as unknown as ReadMovingImageFileValue,
    ],
    [titlePropId]: [makeTextValue('http://rdfh.ch/value/title-1', 'My Storybook Video')],
    [descriptionPropId]: [
      makeTextValue('http://rdfh.ch/value/desc-1', 'A sample video resource for Storybook previews.'),
    ],
  };
  res.entityInfo = makeEntityInfo(res.type, propEntries, 'Moving Image');
  return res;
};

const sharedProviders = [
  importProvidersFrom(OverlayModule),
  provideRouter([{ path: '**', redirectTo: '' }]),
  {
    provide: AppConfigService,
    useValue: { dspApiConfig: { apiUrl: '' }, dspAppConfig: { iriBase: 'http://rdfh.ch' } },
  },
  {
    provide: ProjectApiService,
    useValue: {
      get: () =>
        of({
          project: {
            id: 'http://rdfh.ch/project/1',
            shortcode: '0869',
            shortname: 'my-project',
            longname: 'My Storybook Project',
          },
        }),
    },
  },
  {
    provide: AdminAPIApiService,
    useValue: {
      getAdminProjectsIriProjectiri: () =>
        of({
          project: {
            id: 'http://rdfh.ch/project/1',
            shortcode: '0869',
            shortname: 'my-project',
            longname: 'My Storybook Project',
          },
        }),
      getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: () => of({ licenses: [] }),
    },
  },
  { provide: UserApiService, useValue: { get: () => of({ user: { givenName: 'Jane', familyName: 'Doe' } }) } },
  { provide: NotificationService, useValue: { openSnackBar: () => {} } },
  {
    provide: RepresentationService,
    useValue: { getFileInfo: () => of({ originalFilename: 'video.mp4' }), downloadProjectFile: () => {} },
  },
];

// ---------------------------------------------------------------------------
// Launcher
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-resource-fetcher-dialog-launcher',
  template: ``,
})
class ResourceFetcherDialogLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);

  ngOnInit() {
    this._dialog.open(ResourceFetcherDialogComponent, { data: { resourceIri: 'http://rdfh.ch/resource/1', index: 0 } });
  }
}

const meta: Meta<ResourceFetcherDialogLauncherComponent> = {
  title: 'Resource Editor / Resource Fetcher Dialog',
  component: ResourceFetcherDialogLauncherComponent,
};
export default meta;
type Story = StoryObj<ResourceFetcherDialogLauncherComponent>;

export const DefaultView: Story = {
  name: 'Shows resource fetcher wrapped in closing dialog',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              res: { getResource: () => of(makeVideoReadResource()) },
              search: { doSearchIncomingLinks: () => NEVER, doExtendedSearch: () => NEVER },
            },
          },
        },
      ],
    }),
  ],
  play: async ({ step }) => {
    await step('Resource dialog container is rendered', async () => {
      const container = document.querySelector('[data-cy="resource-dialog"]');
      await expect(container).not.toBeNull();
    });
  },
};
