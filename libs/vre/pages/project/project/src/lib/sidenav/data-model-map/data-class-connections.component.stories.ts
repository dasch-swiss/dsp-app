import { Meta, StoryObj } from '@storybook/angular';
import { expect, fn, userEvent } from 'storybook/test';
import { DataClassConnectionsComponent } from './data-class-connections.component';
import { DataModelEdge, DataModelGraph, DataModelNode } from './data-model-graph';

const ONTO = 'http://0.0.0.0:3333/ontology/0102/scenario-tanner/v2#';
const cls = (name: string, count: number): DataModelNode => ({
  id: ONTO + name,
  label: name,
  kind: 'class',
  count,
  navigable: true,
});
const link = (source: string, target: string, label: string): DataModelEdge => ({
  source: ONTO + source,
  target: ONTO + target,
  property: ONTO + label,
  label,
  kind: 'link',
});

/** scenario-tanner around Film: six classes link to it, it links to Person. */
const GRAPH: DataModelGraph = {
  nodes: [
    cls('Film', 319),
    cls('Person', 1086),
    cls('Page', 17949),
    cls('Script', 207),
    cls('Promotion', 453),
    cls('Production', 831),
    cls('Correspondence', 865),
    cls('Critical reception', 1559),
  ],
  edges: [
    link('Film', 'Person', 'Director'),
    link('Film', 'Person', 'Writer'),
    ...['Page', 'Script', 'Promotion', 'Production', 'Correspondence', 'Critical reception'].map(name =>
      link(name, 'Film', 'Film related to the document')
    ),
  ],
};

const meta: Meta<DataClassConnectionsComponent> = {
  title: 'Data Browser / Class Header / Connections',
  component: DataClassConnectionsComponent,
  render: args => ({
    props: args,
    template: `<div style="width: 480px"><app-data-class-connections [graph]="graph" [classIri]="classIri" (classSelected)="classSelected($event)" /></div>`,
  }),
  args: { graph: GRAPH, classIri: ONTO + 'Film', classSelected: fn() },
  argTypes: {
    graph: { description: 'The data model the class belongs to.' },
    classIri: { description: 'IRI of the class in the middle of the strip.' },
    anyResourceLabel: { description: 'Label of the card for links that point at any resource.' },
    subclassLabel: { description: 'Label of a line between a class and its superclass or subclass.' },
    classSelected: { description: 'Emits the IRI of a linked class card that was clicked.' },
  },
};

export default meta;
type Story = StoryObj<DataClassConnectionsComponent>;

const names = (canvasElement: HTMLElement, side: 'incoming' | 'outgoing') =>
  Array.from(canvasElement.querySelectorAll(`.${side} .card .label`)).map(n => n.textContent?.trim());

/** The classes linking to the class sit left of it, the classes it links to right of it; past four, the rest are counted. */
export const ShowsLinkingClassesLeftAndLinkedClassesRight: Story = {
  play: async ({ canvasElement }) => {
    await expect(names(canvasElement, 'incoming')).toHaveLength(4);
    await expect(canvasElement.querySelector('.incoming-heading')).toHaveTextContent('+2');
    await expect(names(canvasElement, 'outgoing')).toEqual(['Person']);
    await expect(canvasElement.querySelector('[data-cy="data-class-connections-centre"]')).toHaveTextContent('Film');
  },
};

/** Clicking a linked class opens it. */
export const OpensALinkedClassWhenClicked: Story = {
  play: async ({ args, canvasElement }) => {
    const person = Array.from(canvasElement.querySelectorAll<HTMLElement>('.outgoing .card'))[0];

    await userEvent.click(person);
    await expect(args.classSelected).toHaveBeenCalledWith(ONTO + 'Person');
  },
};

/** A side without links says so. */
export const SaysWhenNothingLinksToTheClass: Story = {
  args: { classIri: ONTO + 'Page' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('.incoming .card')).toHaveLength(0);
    await expect(canvasElement.querySelector('.incoming .none')).not.toBeNull();
    await expect(names(canvasElement, 'outgoing')).toEqual(['Film']);
  },
};
