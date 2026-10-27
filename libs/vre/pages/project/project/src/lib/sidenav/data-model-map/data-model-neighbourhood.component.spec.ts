import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { DataModelGraph } from './data-model-graph';
import { DataModelNeighbourhoodComponent } from './data-model-neighbourhood.component';

const graph: DataModelGraph = {
  nodes: [
    { id: 'Slide', label: 'Slide', kind: 'class', count: 91, navigable: true, properties: ['A', 'B', 'C', 'D', 'E'] },
    { id: 'Event', label: 'Event', kind: 'class', count: 24, navigable: true },
    { id: 'Author', label: 'Author', kind: 'class', count: 69, navigable: true },
    { id: 'Video', label: 'Video', kind: 'class', count: 35, navigable: true },
    { id: 'Place', label: 'Place', kind: 'external', navigable: false },
    { id: 'Lonely', label: 'Lonely', kind: 'class', count: 1, navigable: true },
  ],
  edges: [
    { source: 'Event', target: 'Slide', property: 'slides', label: 'slides', kind: 'link' },
    { source: 'Event', target: 'Author', property: 'speaker', label: 'speaker', kind: 'link' },
    { source: 'Slide', target: 'Author', property: 'author', label: 'author(s)', kind: 'link' },
    { source: 'Slide', target: 'Author', property: 'editor', label: 'editor', kind: 'link' },
    { source: 'Video', target: 'Author', property: 'author', label: 'author(s)', kind: 'link' },
    { source: 'Slide', target: 'Place', property: 'place', label: 'place', kind: 'link' },
    { source: 'Slide', target: 'Slide', property: 'next', label: 'next', kind: 'link' },
  ],
};

describe('DataModelNeighbourhoodComponent', () => {
  let fixture: ComponentFixture<DataModelNeighbourhoodComponent>;
  let component: DataModelNeighbourhoodComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DataModelNeighbourhoodComponent],
      providers: [provideTranslateService()],
    });
    fixture = TestBed.createComponent(DataModelNeighbourhoodComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('graph', graph);
    fixture.componentRef.setInput('classIri', 'Slide');
  });

  it('puts the classes that link to the class above it, with how many classes they link to', () => {
    expect(component.above().map(n => [n.node.id, n.links, n.degree])).toEqual([['Event', ['slides'], 2]]);
  });

  it('puts the classes it links to below it, every link property named once, without the link to itself', () => {
    expect(component.below().map(n => [n.node.id, n.links, n.degree])).toEqual([
      ['Author', ['author(s)', 'editor'], 3],
      ['Place', ['place'], 1],
    ]);
  });

  it('shows four properties and counts the rest', () => {
    expect(component.visibleProperties()).toEqual(['A', 'B', 'C', 'D']);
    expect(component.hiddenProperties()).toBe(1);
  });

  it('opens a linked class of this project, but not one it cannot open', () => {
    const opened: string[] = [];
    component.classSelected.subscribe(iri => opened.push(iri));

    component.select(graph.nodes[2]);
    component.select(graph.nodes[4]);

    expect(opened).toEqual(['Author']);
  });

  it('says so when the class has no links', () => {
    fixture.componentRef.setInput('classIri', 'Lonely');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.no-links')).not.toBeNull();
  });
});
