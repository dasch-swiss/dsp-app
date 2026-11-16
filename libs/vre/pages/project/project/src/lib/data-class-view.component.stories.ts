import { ActivatedRoute, provideRouter } from '@angular/router';
import { KnoraApiConnection, ReadOntology, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/core/config';
import { MultipleViewerService } from '@dasch-swiss/vre/pages/data-browser';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';

import { DataBrowserPageService } from './data-browser-page.service';
import { DataClassViewComponent, RESULT_LIST_WIDTH_BELOW_MD, RESULT_LIST_WIDTHS } from './data-class-view.component';
import { ProjectPageService } from './project-page.service';
import { DataModelGraphService } from './sidenav/data-model-map/data-model-graph.service';
import { makeProjectPageServiceStub, makeReadProject } from './stories.helpers';

const ONTOLOGY_IRI = 'http://0.0.0.0:3333/ontology/0803/incunabula/v2';
const CLASS_IRI = `${ONTOLOGY_IRI}#book`;

const LONG_CLASS_TITLE =
  'Illustrated broadsheet with handwritten marginal annotations from the Basel printing workshops';
const LONG_CLASS_DESCRIPTION =
  'A single printed sheet, usually with a woodcut and a short text, sold at fairs and in the streets of ' +
  'late medieval Basel. Many surviving copies carry handwritten notes by their owners in the margins: ' +
  'corrections, prayers, prices, and cross-references to other prints, which tell us how these sheets ' +
  'were read, collected and passed on over several generations.';
const LONG_RESOURCE_TITLE =
  'Das Narrenschiff: Von der Weltlichkeit der Narren, mit Holzschnitten und handschriftlichen ' +
  'Randbemerkungen eines unbekannten Lesers aus dem frühen sechzehnten Jahrhundert';

const RESOURCE_LABELS = [
  LONG_RESOURCE_TITLE,
  'Zeitglöcklein des Lebens und Leidens Christi',
  'Der Ritter vom Turn: von den Exempeln der Gottesfurcht und Ehrbarkeit, gedruckt bei Michael Furter in Basel, 1493',
  'Lob der Glieder Mariens',
  'Speculum humanae salvationis, Spiegel menschlicher Behältnis, mit den Auslegungen der Evangelien',
  'Beschlossen Gart des Rosenkranz Mariae',
];

const RESOURCES = RESOURCE_LABELS.map(
  (label, index) =>
    ({
      id: `http://rdfh.ch/0803/resource-${index}`,
      type: CLASS_IRI,
      label,
      attachedToProject: 'http://rdfh.ch/projects/0803',
      attachedToUser: 'http://rdfh.ch/users/testuser',
      properties: {},
      entityInfo: { classes: {}, properties: {} },
    }) as unknown as ReadResource
);

const RESOURCE_CLASS = {
  id: CLASS_IRI,
  label: LONG_CLASS_TITLE,
  comment: LONG_CLASS_DESCRIPTION,
  labels: [{ language: 'en', value: LONG_CLASS_TITLE }],
  comments: [{ language: 'en', value: LONG_CLASS_DESCRIPTION }],
  subClassOf: [],
  propertiesList: [],
};

const ONTOLOGY = {
  id: ONTOLOGY_IRI,
  label: 'The incunabula ontology',
  classes: { [CLASS_IRI]: RESOURCE_CLASS },
  properties: {},
  getClassDefinitionsByType: () => [RESOURCE_CLASS],
  getPropertyDefinitionsByType: () => [],
} as unknown as ReadOntology;

const expectedResultListWidth = (windowWidth: number) =>
  RESULT_LIST_WIDTHS.find(([minWidth]) => windowWidth >= minWidth)?.[1] ?? RESULT_LIST_WIDTH_BELOW_MD;

/** The Data tab's class view without the class sidenav; pick a width from the viewport toolbar. */
const meta: Meta<DataClassViewComponent> = {
  title: 'Pages / Data Browser / Class View',
  component: DataClassViewComponent,
  parameters: { layout: 'fullscreen' },
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([{ path: '**', component: class {} }]),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ [RouteConstants.ontologyParameter]: 'incunabula', [RouteConstants.classParameter]: 'book' }),
            queryParams: of({}),
          },
        },
        {
          provide: ProjectPageService,
          useValue: makeProjectPageServiceStub({
            currentProject$: of(makeReadProject({ id: 'http://rdfh.ch/projects/0803', shortcode: '0803' })),
            ontologies$: of([ONTOLOGY]),
          }),
        },
        {
          provide: OntologyService,
          useValue: {
            getOntologyIriFromRoute: () => ONTOLOGY_IRI,
            getClassIdFromParams: () => CLASS_IRI,
            getIriBaseUrl: () => 'http://0.0.0.0:3333',
          },
        },
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              onto: {
                getOntologiesByProjectIri: () => of({ ontologies: [ONTOLOGY] }),
                getOntology: () => of(ONTOLOGY),
              },
              search: {
                doExtendedSearch: () => of({ resources: RESOURCES }),
                doExtendedSearchCountQuery: () => of({ numberOfResults: RESOURCES.length }),
              },
            },
          } as unknown as KnoraApiConnection,
        },
        DataBrowserPageService,
        { provide: DataModelGraphService, useValue: { graphOfClass$: () => of(undefined) } },
        {
          provide: MultipleViewerService,
          useValue: {
            selectedResources$: of([]),
            selectMode: false,
            searchKeyword: undefined,
            selectOneResource: () => {},
            addResources: () => {},
            removeResources: () => {},
            reset: () => {},
          },
        },
      ],
    }),
  ],
  render: () => ({
    template: '<div style="height: 100vh"><app-data-class-view /></div>',
  }),
};
export default meta;
type Story = StoryObj<DataClassViewComponent>;

export const LongTitles: Story = {
  name: 'Shows long class title and description in the header, long resource titles in the breakpoint-wide result list',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Long class title and description are shown in the header', async () => {
      await expect(await canvas.findByText(LONG_CLASS_TITLE)).toBeVisible();
      await expect(canvas.getByText(LONG_CLASS_DESCRIPTION)).toBeVisible();
    });

    await step('Every resource is listed, the long titles included', async () => {
      await expect(await canvas.findByText(LONG_RESOURCE_TITLE)).toBeInTheDocument();
      await expect(canvasElement.querySelectorAll('app-resource-list-item')).toHaveLength(RESOURCES.length);
    });

    await step('The result list is as wide as the breakpoint says', async () => {
      const list = canvasElement.querySelector('app-data-class-view as-split-area') as HTMLElement;
      await expect(Math.round(list.getBoundingClientRect().width)).toBe(expectedResultListWidth(window.innerWidth));
    });
  },
};
