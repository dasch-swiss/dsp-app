import { TestBed } from '@angular/core/testing';
import { TableColumns } from './table-columns';

type Column = 'name' | 'a' | 'b' | 'c';
const KEY = 'test-table';

const make = () =>
  TestBed.runInInjectionContext(
    () =>
      new TableColumns<Column>({
        storageKey: KEY,
        columns: ['name', 'a', 'b', 'c'],
        defaultWidths: { name: 200, a: 100, b: 100, c: 100 },
        minWidths: { name: 100, a: 50, b: 50, c: 50 },
      })
  );

describe('TableColumns', () => {
  beforeEach(() => localStorage.clear());

  it('starts in the given order, every column shown', () => {
    const columns = make();
    expect(columns.shown()).toEqual(['name', 'a', 'b', 'c']);
    expect(columns.tableWidth()).toBe(500);
  });

  it('moves a dropped column and remembers the order', () => {
    make().drop({ previousIndex: 1, currentIndex: 3 });
    expect(make().shown()).toEqual(['name', 'b', 'c', 'a']);
  });

  it('keeps the first column first', () => {
    const columns = make();
    columns.drop({ previousIndex: 2, currentIndex: 0 });
    columns.drop({ previousIndex: 0, currentIndex: 2 });
    expect(columns.shown()).toEqual(['name', 'a', 'b', 'c']);
  });

  it('keeps a hidden column in its place among the others', () => {
    const columns = make();
    columns.show('b', false);
    expect(columns.shown()).toEqual(['name', 'a', 'c']);
    columns.drop({ previousIndex: 1, currentIndex: 2 });
    columns.show('b', true);
    expect(columns.shown()).toEqual(['name', 'c', 'b', 'a']);
  });

  it('hides all but the first column, and shows them again', () => {
    const columns = make();
    columns.showAll(false);
    expect(columns.shown()).toEqual(['name']);
    columns.showAll(true);
    expect(columns.allShown()).toBe(true);
  });

  it('adds a column it did not know at the end, and drops unknown or repeated ones', () => {
    localStorage.setItem(`${KEY}-columns`, JSON.stringify({ order: ['c', 'c', 'gone', 'name'], hidden: ['name'] }));
    const columns = make();
    expect(columns.shown()).toEqual(['name', 'c', 'a', 'b']);
  });

  it('remembers a width, and forgets it back to the default', () => {
    make().resize('a', 180);
    const columns = make();
    expect(columns.widthOf('a')).toBe(180);
    columns.resize('a', undefined);
    expect(make().widthOf('a')).toBe(100);
  });
});
