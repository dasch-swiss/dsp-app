import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { FilterMenuComponent, FilterOption } from './filter-menu.component';

const options: FilterOption[] = [
  { id: 'letter', label: 'Letter' },
  { id: 'draft', label: 'Letter draft' },
  { id: 'note', label: 'Note' },
  { id: 'person', label: 'Person' },
];

describe('FilterMenuComponent', () => {
  let fixture: ComponentFixture<FilterMenuComponent>;
  let component: FilterMenuComponent;
  let emitted: string[][];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FilterMenuComponent],
      providers: [provideTranslateService(), provideNoopAnimations()],
    });
    fixture = TestBed.createComponent(FilterMenuComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('ticked', ['letter', 'draft', 'note', 'person']);
    emitted = [];
    component.tickedChange.subscribe(ticked => emitted.push(ticked));
    fixture.detectChanges();
  });

  it('unticks one choice of all', () => {
    component.toggle('note');

    expect(emitted).toEqual([['letter', 'draft', 'person']]);
  });

  it('finds choices by name, the box ticking or unticking only those found', () => {
    component.query.set('LET');

    expect(component.matches().map(option => option.id)).toEqual(['letter', 'draft']);
    expect(component.bulkState()).toBe('all');

    component.toggleMatches();

    expect(emitted).toEqual([['note', 'person']]);
  });

  it('names the few unticked choices', () => {
    fixture.componentRef.setInput('ticked', ['letter', 'person']);

    expect(component.hiddenNames()).toBe('Letter draft, Note');
    expect(component.bulkState()).toBe('some');
  });
});
