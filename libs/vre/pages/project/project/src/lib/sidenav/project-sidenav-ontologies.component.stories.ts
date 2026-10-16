import { ActivatedRoute } from '@angular/router';
import { APIV3ApiService, OntologyAndResourceClasses } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { LocalizationService, OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, waitFor } from 'storybook/test';
import { STORY_PROVIDERS } from '../stories.helpers';
import { ProjectSidenavOntologiesComponent } from './project-sidenav-ontologies.component';

const ontology = (name: string, classes: [string, number][]): OntologyAndResourceClasses =>
  ({
    ontology: { iri: `http://0.0.0.0:3333/ontology/0001/${name}/v2`, label: name },
    classesAndCount: classes.map(([className, itemCount]) => ({
      resourceClass: {
        iri: `http://0.0.0.0:3333/ontology/0001/${name}/v2#${className}`,
        label: [{ language: 'en', value: className }],
        representationClass: 'WithoutRepresentation',
      },
      itemCount,
    })),
  }) as unknown as OntologyAndResourceClasses;

const MUSIKLEXIKON = ontology('Musiklexikon', [
  ['Artikel', 17084],
  ['Bibliothek', 6321],
  ['Ort', 4461],
]);
const MEDIEN = ontology('Medien', [
  ['Bild', 52],
  ['Tonbeispiel', 1],
]);

/** The sidebar over the given data models, with no class in the URL. */
const withOntologies = (ontologies: OntologyAndResourceClasses[]) =>
  applicationConfig({
    providers: [
      ...STORY_PROVIDERS,
      { provide: ActivatedRoute, useValue: { firstChild: null } },
      { provide: APIV3ApiService, useValue: { getV3ProjectsProjectiriResourcesperontology: () => of(ontologies) } },
      { provide: OntologyService, useValue: { getClassIdFromParams: () => undefined } },
      { provide: LocalizationService, useValue: { currentLanguage: 'en', currentLanguage$: of('en') } },
    ],
  });

const meta: Meta<ProjectSidenavOntologiesComponent> = {
  title: 'Data Browser / Sidebar / Data Model Groups',
  component: ProjectSidenavOntologiesComponent,
  render: () => ({ template: '<div style="width: 220px"><app-projects-sidenav-ontologies /></div>' }),
};

export default meta;
type Story = StoryObj<ProjectSidenavOntologiesComponent>;

const header = (canvasElement: HTMLElement, label: string) =>
  Array.from(canvasElement.querySelectorAll('button.ontology-header')).find(button =>
    button.textContent?.includes(label)
  ) as HTMLElement;
const classNames = (canvasElement: HTMLElement) =>
  Array.from(canvasElement.querySelectorAll('.item .label')).map(name => name.textContent?.trim());

/** A project with one data model shows its classes straight away: there is nothing to choose between. */
export const OpensTheOnlyDataModelOfAProject: Story = {
  decorators: [withOntologies([MUSIKLEXIKON])],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(header(canvasElement, 'Musiklexikon')).toHaveAttribute('aria-expanded', 'true'));
    await expect(classNames(canvasElement)).toEqual(['Artikel', 'Bibliothek', 'Ort']);
  },
};

/** Several data models: one labelled group each, in alphabetical order, closed until asked for. */
export const ListsEachDataModelAsAGroup: Story = {
  decorators: [withOntologies([MUSIKLEXIKON, MEDIEN])],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll('button.ontology-header')).toHaveLength(2));
    const labels = Array.from(canvasElement.querySelectorAll('.ontology-label')).map(label => label.textContent);

    await expect(labels).toEqual(['Medien', 'Musiklexikon']);
    await expect(classNames(canvasElement)).toEqual([]);
  },
};

/** A group opens and closes from its header, and several can be open at once. */
export const OpensAndClosesGroupsFromTheirHeader: Story = {
  decorators: [withOntologies([MUSIKLEXIKON, MEDIEN])],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(header(canvasElement, 'Medien')).toBeTruthy());

    await userEvent.click(header(canvasElement, 'Medien'));
    await userEvent.click(header(canvasElement, 'Musiklexikon'));
    await expect(header(canvasElement, 'Medien')).toHaveAttribute('aria-expanded', 'true');
    await expect(classNames(canvasElement)).toEqual(['Bild', 'Tonbeispiel', 'Artikel', 'Bibliothek', 'Ort']);

    await userEvent.click(header(canvasElement, 'Medien'));
    await expect(header(canvasElement, 'Medien')).toHaveAttribute('aria-expanded', 'false');
    await expect(classNames(canvasElement)).toEqual(['Artikel', 'Bibliothek', 'Ort']);
  },
};

/** The data-model label sits on the same 16px gutter as the class names below it. */
export const AlignsGroupLabelsWithTheClassNames: Story = {
  decorators: [withOntologies([MUSIKLEXIKON])],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('.item')).not.toBeNull());
    const left = (element: Element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return Math.round(range.getBoundingClientRect().left);
    };
    const groupLabel = canvasElement.querySelector('.ontology-label') as HTMLElement;
    const icon = canvasElement.querySelector('.item mat-icon') as HTMLElement;

    await expect(left(groupLabel)).toBe(Math.round(icon.getBoundingClientRect().left));
  },
};
