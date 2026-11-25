import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { DATA_MODEL_EDITOR, DataModelEditor } from './data-model-editor';
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
    const rows = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('[data-cy="data-model-class-card-property"]')
    );

    expect(rows.map(row => row.querySelector('.name')?.firstElementChild?.textContent?.trim())).toEqual([
      'Title',
      'Director',
    ]);
    expect(rows[1].querySelector('.target')?.textContent).toContain('Person');
    expect(component.cardinalityKey(graph.nodes[0].propertyDetails![1])).toBe('many');
  });

  it('asks to describe a linked class, and to browse the class', () => {
    const shown: string[] = [];
    const browsed: string[] = [];
    component.classSelected.subscribe(iri => shown.push(iri));
    component.browse.subscribe(iri => browsed.push(iri));

    fixture.nativeElement.querySelector('.target').click();
    fixture.nativeElement.querySelector('[data-cy="class-panel-browse"]').click();

    expect(shown).toEqual(['Person']);
    expect(browsed).toEqual(['Film']);
  });

  it('tells which property row is hovered, and when the pointer leaves it', () => {
    const hovered: (string | undefined)[] = [];
    component.propertyHovered.subscribe(iri => hovered.push(iri));
    const row = fixture.nativeElement.querySelectorAll('[data-cy="data-model-class-card-property"]')[1] as HTMLElement;

    row.dispatchEvent(new MouseEvent('mouseenter'));
    row.dispatchEvent(new MouseEvent('mouseleave'));

    expect(hovered).toEqual(['director', undefined]);
  });

  it('offers to edit each property only to those who may edit the data model', () => {
    const pencils = () => fixture.nativeElement.querySelectorAll('[data-cy="data-model-class-card-edit-property"]');
    expect(pencils().length).toBe(0);

    fixture.componentRef.setInput('canEdit', true);
    fixture.detectChanges();
    const edited: string[] = [];
    component.editProperty.subscribe(iri => edited.push(iri));
    pencils()[1].click();

    expect(pencils().length).toBe(2);
    expect(edited).toEqual(['director']);
  });

  it('saves a new order for inherited properties too, as the former Data models tab did', () => {
    const reorderProperties = jest.fn(() => of(true));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ResourceClassPanelComponent],
      providers: [
        provideTranslateService(),
        { provide: DATA_MODEL_EDITOR, useValue: { reorderProperties } as Partial<DataModelEditor> },
        { provide: ProjectPageService, useValue: { reloadProject: jest.fn() } },
      ],
    });
    const short = TestBed.createComponent(ResourceClassPanelComponent);
    const withShort: DataModelGraph = {
      nodes: [
        ...graph.nodes,
        {
          id: 'Short',
          label: 'Short film',
          kind: 'class',
          count: 3,
          navigable: true,
          propertyDetails: [
            ...graph.nodes[0].propertyDetails!,
            { id: 'length', label: 'Length', description: '', type: 'Integer', cardinality: Cardinality._0_1 },
          ],
        },
      ],
      edges: [...graph.edges, { source: 'Short', target: 'Film', property: 'subClassOf', label: '', kind: 'subclass' }],
    };
    short.componentRef.setInput('graph', withShort);
    short.componentRef.setInput('classIri', 'Short');
    short.detectChanges();
    const panel = short.componentInstance;

    // Title, inherited from Film, is dropped below Length, the class's own.
    panel.dropped('Short', panel.all(), { previousIndex: 0, currentIndex: 2 } as CdkDragDrop<unknown>);

    expect(reorderProperties).toHaveBeenCalledWith('Short', ['director', 'length', 'title']);
    expect(panel.all().map(property => property.id)).toEqual(['director', 'length', 'title']);
  });
});
