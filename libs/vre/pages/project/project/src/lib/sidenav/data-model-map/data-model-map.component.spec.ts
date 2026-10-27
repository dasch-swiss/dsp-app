import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { DataModelGraph } from './data-model-graph';
import { DataModelMapComponent } from './data-model-map.component';

const graph: DataModelGraph = {
  nodes: [
    { id: 'A', label: 'Slide', kind: 'class', count: 90, navigable: true },
    { id: 'B', label: 'Author', kind: 'class', count: 45, navigable: true },
    { id: 'C', label: 'Visual', kind: 'class', count: 3, navigable: true },
    { id: 'X', label: 'Place', kind: 'external', navigable: false },
  ],
  edges: [
    { source: 'A', target: 'B', property: 'author', kind: 'link' },
    { source: 'A', target: 'X', property: 'place', kind: 'link' },
  ],
};

describe('DataModelMapComponent', () => {
  let fixture: ComponentFixture<DataModelMapComponent>;
  let component: DataModelMapComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DataModelMapComponent],
      providers: [provideTranslateService()],
    });
    fixture = TestBed.createComponent(DataModelMapComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('graph', graph);
    fixture.componentRef.setInput('selectedIri', 'B');
  });

  afterEach(() => localStorage.clear());

  it('outlines the classes linked with the current one, and only those', () => {
    expect([...component.neighbours()]).toEqual(['A']);
  });

  it('marks classes without any link as unlinked', () => {
    expect([...component.unlinked()]).toEqual(['C']);
  });

  it('counts only the classes of the data model, not external cards', () => {
    expect(component.classCount()).toBe(3);
  });

  it('sizes the share bar against the biggest class', () => {
    expect(component.share(graph.nodes[1])).toBe(50);
  });

  it('opens a class of this project, but not an external class it cannot open', () => {
    const opened: string[] = [];
    component.classSelected.subscribe(iri => opened.push(iri));

    component.select(graph.nodes[1]);
    component.select(graph.nodes[3]);

    expect(opened).toEqual(['B']);
  });

  it('names the classes a card links to and is linked from, for screen readers', () => {
    expect(component.linkedNames(graph.nodes[0], 'to')).toBe('Author, Place');
    expect(component.linkedNames(graph.nodes[1], 'from')).toBe('Slide');
  });

  it('remembers that the map was hidden', () => {
    component.toggleCollapsed();

    expect(component.collapsed()).toBe(true);
    expect(localStorage.getItem('dsp-data-model-map-collapsed')).toBe('true');
  });
});
