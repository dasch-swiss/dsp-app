import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { DataClassConnectionsComponent } from './data-class-connections.component';
import { DataModelGraph } from './data-model-graph';

const graph: DataModelGraph = {
  nodes: [
    { id: 'Slide', label: 'Slide', kind: 'class', count: 91, navigable: true },
    { id: 'Event', label: 'Event', kind: 'class', count: 24, navigable: true },
    { id: 'Author', label: 'Author', kind: 'class', count: 69, navigable: true },
    { id: 'Place', label: 'Place', kind: 'external', navigable: false },
    { id: 'Poster', label: 'Poster', kind: 'class', count: 3, navigable: true },
  ],
  edges: [
    { source: 'Event', target: 'Slide', property: 'slides', label: 'slides', kind: 'link' },
    { source: 'Slide', target: 'Author', property: 'author', label: 'author(s)', kind: 'link' },
    { source: 'Slide', target: 'Author', property: 'editor', label: 'editor', kind: 'link' },
    { source: 'Slide', target: 'Place', property: 'place', label: 'place', kind: 'link' },
    { source: 'Slide', target: 'Slide', property: 'next', label: 'next', kind: 'link' },
    { source: 'Poster', target: 'Slide', property: 'sub', label: 'sub', kind: 'subclass' },
  ],
};

describe('DataClassConnectionsComponent', () => {
  let fixture: ComponentFixture<DataClassConnectionsComponent>;
  let component: DataClassConnectionsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DataClassConnectionsComponent],
      providers: [provideTranslateService()],
    });
    fixture = TestBed.createComponent(DataClassConnectionsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('graph', graph);
    fixture.componentRef.setInput('classIri', 'Slide');
    fixture.componentRef.setInput('subclassLabel', 'subclass of');
  });

  it('lists the classes linking to the class, subclasses named as such', () => {
    expect(component.incoming().map(c => [c.node.id, c.links])).toEqual([
      ['Event', ['slides']],
      ['Poster', ['subclass of']],
    ]);
  });

  it('lists the classes it links to once each, with every property, without the link to itself', () => {
    expect(component.outgoing().map(c => [c.node.id, c.links])).toEqual([
      ['Author', ['author(s)', 'editor']],
      ['Place', ['place']],
    ]);
  });

  it('shows three classes per side until the rest are asked for', () => {
    fixture.componentRef.setInput('graph', {
      nodes: [
        ...graph.nodes,
        ...['P1', 'P2', 'P3'].map(id => ({ id, label: id, kind: 'class' as const, navigable: true })),
      ],
      edges: [
        ...graph.edges,
        ...['P1', 'P2', 'P3'].map(id => ({
          source: id,
          target: 'Slide',
          property: 'p',
          label: 'p',
          kind: 'link' as const,
        })),
      ],
    });

    expect(component.incoming()).toHaveLength(3);
    expect(component.moreIncoming()).toBe(2);

    component.expand('incoming');

    expect(component.incoming()).toHaveLength(5);
    expect(component.moreIncoming()).toBe(0);
  });

  it('opens a linked class of this project, but not one it cannot open', () => {
    const opened: string[] = [];
    component.classSelected.subscribe(iri => opened.push(iri));

    component.select(graph.nodes[2]);
    component.select(graph.nodes[3]);

    expect(opened).toEqual(['Author']);
  });
});
