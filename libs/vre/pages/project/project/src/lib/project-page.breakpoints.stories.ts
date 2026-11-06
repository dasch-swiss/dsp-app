import { ActivatedRoute, provideRouter } from '@angular/router';
import { KnoraApiConfig, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { APIV3ApiService, OntologyAndResourceClasses } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import {
  LocalizationService,
  OntologyService,
  ProjectDataRightsService,
} from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';

import { DataBrowserPageComponent } from './data-browser-page.component';
import { DataOverviewComponent } from './data-overview.component';
import { ProjectPageHeaderComponent } from './project-page-header.component';
import { ProjectPageService } from './project-page.service';
import { makeProjectPageServiceStub, makeReadProject } from './stories.helpers';

const ONTOLOGY_IRI = 'http://0.0.0.0:3333/ontology/0803/incunabula/v2';

const resourceClass = (
  name: string,
  label: string,
  itemCount: number,
  representationClass = 'WithoutRepresentation'
) => ({
  resourceClass: {
    iri: `${ONTOLOGY_IRI}#${name}`,
    representationClass,
    label: [{ language: 'en', value: label }],
  },
  itemCount,
});

const PROJECT_ONTOLOGIES = [
  {
    ontology: { iri: ONTOLOGY_IRI, label: 'The incunabula ontology', comment: '' },
    classesAndCount: [
      resourceClass('book', 'Book', 18),
      resourceClass('page', 'Page', 2237, 'StillImageRepresentation'),
      resourceClass('Sideband', 'Sideband', 22, 'StillImageRepresentation'),
      resourceClass('misc', 'Miscellaneous', 6),
    ],
  },
] as OntologyAndResourceClasses[];

const PROJECT = makeReadProject({
  id: 'http://rdfh.ch/projects/0803',
  shortcode: '0803',
  shortname: 'incunabula',
  longname: 'Bilderfolgen Basler Frühdrucke: Spätmittelalterliche Didaxe als Bild-Text-Lektüre',
  description: [
    {
      language: 'en',
      value:
        'The incunabula project studies the woodcut sequences of early Basel prints and how text and ' +
        'image were read together in late medieval didactic books.',
    },
  ],
});

/**
 * The project page as it opens on the Data tab: project header with navigation tabs, the
 * ontology/class sidenav, and the project description on the right. Pixeleye captures it at every
 * breakpoint (`pixeleye.breakpoints.config.ts`); in Storybook, pick a width from the viewport
 * toolbar.
 */
const meta: Meta = {
  title: 'Pages / Breakpoints / Project Data',
  parameters: { layout: 'fullscreen' },
  decorators: [
    moduleMetadata({ imports: [ProjectPageHeaderComponent, DataBrowserPageComponent] }),
    applicationConfig({
      providers: [
        provideRouter([{ path: '**', component: DataOverviewComponent }]),
        { provide: ProjectPageService, useValue: makeProjectPageServiceStub({ currentProject$: of(PROJECT) }) },
        // The navigation tabs read the active tab from the route snapshot (the Data tab here).
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { children: [{ url: [{ path: 'data' }] }] }, firstChild: null },
        },
        {
          provide: APIV3ApiService,
          useValue: { getV3ProjectsProjectiriResourcesperontology: () => of(PROJECT_ONTOLOGIES) },
        },
        {
          provide: OntologyService,
          useValue: { getOntologyIriFromRoute: () => undefined, getClassIdFromParams: () => undefined },
        },
        {
          provide: LocalizationService,
          useValue: { currentLanguage: 'en', currentLanguage$: of('en') },
        },
        {
          provide: ProjectDataRightsService,
          useValue: {
            fromProject: () =>
              of({
                licenseLabel: 'CC BY 4.0',
                licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
                copyrightHolder: 'University of Basel',
                isPlaceholderLicense: false,
                isPlaceholderCopyrightHolder: false,
              }),
          },
        },
        { provide: UserService, useValue: { isLoggedIn$: of(false), user$: of(null), isSysAdmin$: of(false) } },
        {
          provide: DspApiConnectionToken,
          useValue: { v2: { ontologyCache: { getOntology: () => of(new Map()) } } } as unknown as KnoraApiConnection,
        },
        {
          provide: AppConfigService,
          useValue: {
            dspConfig: { production: false, environment: 'dev', release: '0.0.0', color: 'accent' },
            dspApiConfig: new KnoraApiConfig('https', 'api.example.com'),
          },
        },
      ],
    }),
  ],
  render: () => ({
    // Mirrors ProjectPageComponent, whose `.content` sets the same height around its outlet.
    template: `
      <app-project-page-header />
      <div style="height: calc(100vh - 106px)">
        <app-data-browser-page />
      </div>
    `,
  }),
};
export default meta;
type Story = StoryObj;

export const DataTab: Story = {
  name: 'Shows header, class sidenav and project description across the full width',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Project name is shown in the header', async () => {
      const header = canvasElement.querySelector('app-project-page-header') as HTMLElement;
      await expect(await within(header).findByText(PROJECT.longname)).toBeInTheDocument();
    });
    await step('Resource classes are listed in the sidenav', async () => {
      // The class list, not the data model map above it, which names the classes too.
      const classList = (await canvas.findAllByText('Book'))[0].closest(
        'app-projects-sidenav-ontologies'
      ) as HTMLElement;
      await expect(
        within(classList.querySelector('app-resource-class-sidenav') as HTMLElement).getByText('Book')
      ).toBeInTheDocument();
    });
    await step('Project description is shown', async () => {
      await expect(await canvas.findByText(/woodcut sequences/)).toBeInTheDocument();
    });
  },
};
