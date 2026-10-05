import { TestBed } from '@angular/core/testing';
import { LABEL_COLUMN_KEY, TableColumn } from './table-column.model';
import { TableLayoutService } from './table-layout.service';
import { TableViewStateService } from './table-view-state.service';

const CLASS_IRI = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';

function column(key: string): TableColumn {
  return {
    key,
    label: key,
    valueType: '',
    isEditable: true,
    isSortable: true,
    isFilterable: true,
    isSticky: key === LABEL_COLUMN_KEY,
    defaultWidth: 200,
    minWidth: 90,
  };
}

const COLUMNS = [column(LABEL_COLUMN_KEY), column('p0'), column('p1'), column('p2')];

describe('TableViewStateService', () => {
  let service: TableViewStateService;
  let layoutStore: TableLayoutService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableViewStateService);
    layoutStore = TestBed.inject(TableLayoutService);
    service.init(CLASS_IRI, COLUMNS);
  });

  describe('the column picker', () => {
    it('MarksEveryColumnWithWhetherItIsCurrentlyDrawn', () => {
      service.setColumnVisible('p1', false);

      expect(service.pickerEntries().map(entry => [entry.column.key, entry.isVisible])).toEqual([
        [LABEL_COLUMN_KEY, true],
        ['p0', true],
        ['p1', false],
        ['p2', true],
      ]);
    });

    it('RefusesToHideTheStickyLabelColumn', () => {
      service.setColumnVisible(LABEL_COLUMN_KEY, false);

      expect(service.layout().visible).toContain(LABEL_COLUMN_KEY);
    });
  });

  describe('showing and hiding', () => {
    it('AppendsAReshownColumnRatherThanGuessingWhereItBelongs', () => {
      service.setColumnVisible('p0', false);
      service.setVisibleOrder([LABEL_COLUMN_KEY, 'p2', 'p1']);
      service.setColumnVisible('p0', true);

      expect(service.layout().visible).toEqual([LABEL_COLUMN_KEY, 'p2', 'p1', 'p0']);
    });

    it('KeepsTheHiddenListInTheOntologysOwnOrder', () => {
      service.setColumnVisible('p2', false);
      service.setColumnVisible('p0', false);

      expect(service.layout().hidden).toEqual(['p0', 'p2']);
    });
  });

  describe('widths', () => {
    it('ForgetsAWidthOnResetSoTheValueTypeDefaultApplies', () => {
      service.setColumnWidth('p1', 320);
      expect(service.layout().widths).toEqual({ p1: 320 });

      service.resetColumnWidth('p1');
      expect(service.layout().widths).toEqual({});
    });
  });

  describe('persistence', () => {
    it('SurvivesLeavingTheClassAndComingBack', () => {
      service.setDensity('compact');
      service.setColumnVisible('p1', false);
      service.setColumnWidth('p0', 140);

      // A fresh `init` is what a class switch or a browser restart produces: the service keeps
      // nothing of its own, so a restored layout can only come from the layout store.
      service.init(CLASS_IRI, COLUMNS);

      expect(service.layout()).toEqual(layoutStore.load(CLASS_IRI, COLUMNS));
      expect(service.layout().density).toBe('compact');
      expect(service.layout().visible).toEqual([LABEL_COLUMN_KEY, 'p0', 'p2']);
      expect(service.layout().widths).toEqual({ p0: 140 });
    });

    it('DropsAChangeMadeBeforeAnyClassWasLoaded', () => {
      const untouched = TestBed.runInInjectionContext(() => new TableViewStateService());

      expect(() => untouched.setDensity('comfortable')).not.toThrow();
      expect(localStorage.length).toBe(0);
    });
  });
});
