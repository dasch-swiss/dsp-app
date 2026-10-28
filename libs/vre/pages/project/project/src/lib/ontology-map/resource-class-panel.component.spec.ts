import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { provideTranslateService } from '@ngx-translate/core';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { ResourceClassPanelComponent } from './resource-class-panel.component';

const graph: DataModelGraph = {
  nodes: [
    {
      id: 'Film',
      label: 'Film',
      kind: 'class',
      count: 319,
      navigable: true,
      description: 'All films by Alain Tanner.',
      propertyDetails: [
        { id: 'title', label: 'Title', description: '', type: 'Text', cardinality: Cardinality._1 },
        {
          id: 'director',
          label: 'Director',
          description: 'Who directed it',
          type: 'Link',
          linkTarget: 'Person',
          cardinality: Cardinality._0_n,
        },
      ],
    },
    { id: 'Person', label: 'Person', kind: 'class', count: 1086, navigable: true, propertyDetails: [] },
    { id: 'Page', label: 'Page', kind: 'class', count: 5, navigable: true, propertyDetails: [] },
  ],
  edges: [
    { source: 'Film', target: 'Person', property: 'director', label: 'Director', kind: 'link' },
    { source: 'Page', target: 'Film', property: 'film', label: 'Film related', kind: 'link' },
  ],
};

describe('ResourceClassPanelComponent', () => {
  let fixture: ComponentFixture<ResourceClassPanelComponent>;
  let component: ResourceClassPanelComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ResourceClassPanelComponent],
      providers: [provideTranslateService()],
    });
    fixture = TestBed.createComponent(ResourceClassPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('graph', graph);
    fixture.componentRef.setInput('classIri', 'Film');
    fixture.detectChanges();
  });

  it('lists the properties, a link naming the class it points at', () => {
    const rows = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('[data-cy="class-panel-property"]'));

    expect(rows.map(row => row.querySelector('.property-label')?.textContent?.trim())).toEqual(['Title', 'Director']);
    expect(rows[1].querySelector('.link')?.textContent).toContain('Person');
    expect(component.cardinalityKey(graph.nodes[0].propertyDetails![1])).toBe('many');
  });

  it('shows a property description when its row is clicked', () => {
    const toggle = fixture.nativeElement.querySelectorAll('.property-toggle')[1] as HTMLButtonElement;

    toggle.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.property-description')?.textContent).toContain('Who directed it');
  });

  it('names the classes it links to and is linked from, with the property between them', () => {
    expect(component.sides().map(side => side.connections.map(c => [c.label, c.via]))).toEqual([
      [['Person', 'Director']],
      [['Page', 'Film related']],
    ]);
  });

  it('asks to describe a linked class, and to browse the class', () => {
    const shown: string[] = [];
    const browsed: string[] = [];
    component.classSelected.subscribe(iri => shown.push(iri));
    component.browse.subscribe(iri => browsed.push(iri));

    fixture.nativeElement.querySelector('.link').click();
    fixture.nativeElement.querySelector('[data-cy="class-panel-browse"]').click();

    expect(shown).toEqual(['Person']);
    expect(browsed).toEqual(['Film']);
  });
});
