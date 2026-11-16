import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Constants, KnoraApiConfig, ReadMovingImageFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { ProjectApiService, UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { HeaderComponent } from '@dasch-swiss/vre/shared/app-common-to-move';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { NEVER, of } from 'rxjs';
import { expect, waitFor } from 'storybook/test';

import { RepresentationService } from './representation/representation.service';
import {
  makeEntityInfo,
  makeFilePropEntry,
  makePropEntry,
  makeTextPropDef,
  makeTextValue,
} from './resource-stories.helper';
import { SingleResourcePageComponent } from './single-resource-page.component';
import {
  appConfigServiceStub,
  notificationServiceStub,
  projectApiServiceStub,
  representationServiceStub,
  STORY_VIDEO_URL,
} from './stories.helpers';

const RESOURCE_IRI = 'http://rdfh.ch/0001/video-1';
const ROUTE_PARAMS = { project: '0001', resource: 'video-1' };
const ONTOLOGY = 'http://0.0.0.0:3333/ontology/0001/example/v2';

// A video resource with a title, a description and a long-ish comment, so the property
// column has enough text to show how it wraps at each width.
const makeVideoResource = (): ReadResource => {
  const res = new ReadResource();
  res.id = RESOURCE_IRI;
  res.type = `${ONTOLOGY}#Video`;
  res.label = 'Interview with the project team, 2024';
  res.attachedToProject = 'http://rdfh.ch/projects/0001';
  res.attachedToUser = 'http://rdfh.ch/users/test';
  res.userHasPermission = 'V';
  res.creationDate = '2024-03-15T10:30:00Z';

  const title = makeTextPropDef(`${ONTOLOGY}#hasTitle`, 'Title');
  const description = makeTextPropDef(`${ONTOLOGY}#hasDescription`, 'Description');
  const comment = makeTextPropDef(`${ONTOLOGY}#hasComment`, 'Comment');

  res.properties = {
    [Constants.HasMovingImageFileValue]: [
      {
        type: Constants.MovingImageFileValue,
        fileUrl: STORY_VIDEO_URL,
        filename: 'video.mp4',
        userHasPermission: 'RV',
      } as unknown as ReadMovingImageFileValue,
    ],
    [title.id]: [makeTextValue('http://rdfh.ch/value/title-1', 'Interview with the project team')],
    [description.id]: [
      makeTextValue('http://rdfh.ch/value/desc-1', 'Recorded at the project kick-off in Basel, March 2024.'),
    ],
    [comment.id]: [
      makeTextValue(
        'http://rdfh.ch/value/comment-1',
        'The team describes how the sources were selected, transcribed and linked, and which questions ' +
          'the edition should answer. The recording was cut to the first five minutes for the online edition.'
      ),
    ],
  };
  res.entityInfo = makeEntityInfo(
    res.type,
    [
      makeFilePropEntry(Constants.HasMovingImageFileValue),
      makePropEntry(title, 1),
      makePropEntry(description, 2),
      makePropEntry(comment, 3),
    ],
    'Video'
  );
  return res;
};

/**
 * The single resource page as users see it: global header, then the resource (video player and
 * properties) in the page's centered layout. Pixeleye captures it at every breakpoint
 * (`pixeleye.breakpoints.config.ts`); in Storybook, pick a width from the viewport toolbar.
 */
const meta: Meta = {
  title: 'Pages / Breakpoints / Single Resource',
  parameters: { layout: 'fullscreen' },
  decorators: [
    moduleMetadata({ imports: [HeaderComponent, SingleResourcePageComponent] }),
    applicationConfig({
      providers: [
        importProvidersFrom(OverlayModule),
        provideRouter([{ path: '**', component: class {} }]),
        // SingleResourcePageComponent builds the resource IRI from the `/resource/:project/:resource`
        // params; the fetcher and the value displays read query params from the snapshot.
        {
          provide: ActivatedRoute,
          useValue: {
            params: of(ROUTE_PARAMS),
            queryParams: of({}),
            snapshot: {
              params: ROUTE_PARAMS,
              paramMap: convertToParamMap(ROUTE_PARAMS),
              queryParams: {},
              queryParamMap: convertToParamMap({}),
            },
            firstChild: null,
          },
        },
        { provide: ResourceService, useValue: { getResourceIri: () => RESOURCE_IRI } },
        {
          provide: AppConfigService,
          useValue: {
            ...appConfigServiceStub,
            dspConfig: { production: false, environment: 'dev', release: '0.0.0', color: 'accent' },
            dspApiConfig: new KnoraApiConfig('https', 'api.example.com'),
          },
        },
        { provide: UserService, useValue: { isLoggedIn$: of(false), user$: of(null), isSysAdmin$: of(false) } },
        { provide: ProjectApiService, useValue: projectApiServiceStub },
        {
          provide: AdminAPIApiService,
          useValue: {
            getAdminProjectsIriProjectiri: () => projectApiServiceStub.get(),
            getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: () => of({ licenses: [] }),
          },
        },
        { provide: UserApiService, useValue: { get: () => of({ user: { givenName: 'Jane', familyName: 'Doe' } }) } },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: RepresentationService, useValue: representationServiceStub },
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              res: { getResource: () => of(makeVideoResource()), canDeleteResource: () => of({ canDo: false }) },
              search: { doSearchIncomingLinks: () => NEVER, doExtendedSearch: () => NEVER },
            },
          },
        },
      ],
    }),
  ],
  // Mirrors GlobalPageComponent, which renders the header above the routed page.
  render: () => ({ template: `<app-header /><app-single-resource-page />` }),
};
export default meta;
type Story = StoryObj;

export const VideoResource: Story = {
  name: 'Shows the header, video player and properties',
  play: async ({ canvasElement, step }) => {
    await step('The global header is shown', async () => {
      await expect(canvasElement.querySelector('app-header')).not.toBeNull();
    });
    await step('The video wrapper is rendered', async () => {
      await waitFor(() => expect(canvasElement.querySelector('app-resource-video')).not.toBeNull(), {
        timeout: 2000,
      });
    });
    await step('The properties are rendered', async () => {
      await waitFor(() => expect(canvasElement.textContent).toContain('Recorded at the project kick-off'), {
        timeout: 2000,
      });
    });
  },
};
