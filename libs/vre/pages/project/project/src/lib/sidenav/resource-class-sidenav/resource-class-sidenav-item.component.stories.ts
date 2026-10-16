import { ActivatedRoute } from '@angular/router';
import { LocalizationService, OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';
import { STORY_PROVIDERS } from '../../stories.helpers';
import { ResourceClassSidenavItemComponent } from './resource-class-sidenav-item.component';

const SELECTED_IRI = 'http://0.0.0.0:3333/ontology/0001/webern-onto/v2#Bibliography';
const OTHER_IRI = 'http://0.0.0.0:3333/ontology/0001/webern-onto/v2#Chronology';

const label = (value: string) => [{ language: 'en', value }];

const meta: Meta<ResourceClassSidenavItemComponent> = {
  title: 'Data Browser / Sidebar / Resource Class Item',
  component: ResourceClassSidenavItemComponent,
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        // The class in the URL: the item compares its own IRI against it to know it is selected.
        { provide: ActivatedRoute, useValue: { firstChild: { params: of({}) } } },
        { provide: OntologyService, useValue: { getClassIdFromParams: () => SELECTED_IRI } },
        { provide: LocalizationService, useValue: { currentLanguage: 'en', currentLanguage$: of('en') } },
      ],
    }),
  ],
  render: args => ({
    props: args,
    template: `<div style="width: 220px; border-right: 1px solid #e5e7eb">
      <app-resource-class-sidenav-item
        [iri]="iri"
        [count]="count"
        [label]="label"
        [representationClass]="representationClass" />
    </div>`,
  }),
  args: { iri: OTHER_IRI, count: 2468, label: label('Chronology'), representationClass: 'WithoutRepresentation' },
  argTypes: {
    iri: { description: 'IRI of the resource class; compared with the class in the URL to mark the row selected.' },
    count: { description: 'How many resources the class holds, shown after its name.' },
    label: { description: "The class's label in every language it has; shown in the current language." },
    representationClass: { description: 'The kind of file the class carries, which picks the type icon.' },
  },
};

export default meta;
type Story = StoryObj<ResourceClassSidenavItemComponent>;

const row = (canvasElement: HTMLElement) => canvasElement.querySelector('button.item') as HTMLElement;

/** Type icon first, then the name, then the count with thousands separators (design I4). */
export const ShowsTheIconThenTheNameThenTheCount: Story = {
  play: async ({ canvasElement }) => {
    const parts = Array.from(row(canvasElement).children).map(child => child.className.split(' ')[0]);
    await expect(parts).toEqual(['mat-icon', 'label', 'count']);

    await expect(row(canvasElement).querySelector('.label')).toHaveTextContent('Chronology');
    await expect(row(canvasElement).querySelector('.count')).toHaveTextContent('2,468');
  },
};

/** The selected class is marked exactly as the result list marks its selected row: tint and accent bar. */
export const MarksTheSelectedClassLikeTheResultList: Story = {
  args: { iri: SELECTED_IRI, count: 2344, label: label('Bibliography') },
  play: async ({ canvasElement }) => {
    const item = row(canvasElement);
    const style = getComputedStyle(item);

    await expect(item).toHaveAttribute('aria-current', 'page');
    await expect(style.backgroundColor).toBe('rgb(214, 224, 232)');
    await expect(style.borderLeftColor).toBe('rgb(51, 103, 143)');
    // No bold: the result list does not bolden its selected row either.
    await expect(style.fontWeight).toBe('400');
  },
};

export const LeavesOtherClassesUnmarked: Story = {
  play: async ({ canvasElement }) => {
    const item = row(canvasElement);

    await expect(item).not.toHaveAttribute('aria-current');
    await expect(getComputedStyle(item).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  },
};

/** A long name is cut with an ellipsis rather than wrapping the row, and is there in full on hover. */
export const CutsALongNameAndShowsItInFullOnHover: Story = {
  args: { label: label('Übergeordnetes Lexikon zu Untergeordnetem Lexikon'), count: 0 },
  play: async ({ canvasElement }) => {
    const name = row(canvasElement).querySelector('.label') as HTMLElement;

    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
    await expect(row(canvasElement)).toHaveAttribute('title', 'Übergeordnetes Lexikon zu Untergeordnetem Lexikon');
    await expect(Math.round(row(canvasElement).getBoundingClientRect().height)).toBe(34);
  },
};

/** The icon says what kind of file the class carries. */
export const ShowsTheIconOfItsRepresentation: Story = {
  args: { label: label('Digital copy'), count: 20, representationClass: 'StillImageRepresentation' },
  play: async ({ canvasElement }) => {
    await expect(row(canvasElement).querySelector('mat-icon')).toHaveTextContent('image');
  },
};
