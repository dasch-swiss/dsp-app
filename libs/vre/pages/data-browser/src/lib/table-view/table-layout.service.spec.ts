import { TableColumn, LABEL_COLUMN_KEY } from './table-column.model';
import { TableLayout, TableLayoutService } from './table-layout.service';

const CLASS_IRI = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
const STORAGE_KEY = `dsp.dataBrowser.tableLayout.v2.${CLASS_IRI}`;

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

function columns(count = 10): TableColumn[] {
  return [column(LABEL_COLUMN_KEY), ...Array.from({ length: count }, (_, i) => column(`p${i}`))];
}

function store(layout: unknown): void {
  localStorage.setItem(STORAGE_KEY, typeof layout === 'string' ? layout : JSON.stringify(layout));
}

describe('TableLayoutService', () => {
  let service: TableLayoutService;

  beforeEach(() => {
    localStorage.clear();
    service = new TableLayoutService();
  });

  describe('defaults', () => {
    it('ShowsEveryColumnWhenNothingIsStored', () => {
      const layout = service.load(CLASS_IRI, columns());

      expect(layout.visible).toEqual([LABEL_COLUMN_KEY, ...Array.from({ length: 10 }, (_, i) => `p${i}`)]);
      expect(layout.hidden).toEqual([]);
      expect(layout.widths).toEqual({});
    });
  });

  describe('round trip', () => {
    it('RestoresASavedLayout', () => {
      const saved: TableLayout = {
        visible: [LABEL_COLUMN_KEY, 'p3', 'p1'],
        hidden: ['p0', 'p2'],
        widths: { p1: 320 },
      };
      service.save(CLASS_IRI, saved);

      expect(service.load(CLASS_IRI, columns(4))).toEqual(saved);
    });

    it('KeepsLayoutsOfDifferentClassesApart', () => {
      service.save(CLASS_IRI, { ...service.defaultLayout(columns(4)), widths: { p0: 333 } });

      expect(service.load('other-class', columns(4)).widths).toEqual({});
    });

    it('ForgetsALayoutOnClear', () => {
      service.save(CLASS_IRI, { ...service.defaultLayout(columns(4)), widths: { p0: 333 } });
      service.clear(CLASS_IRI);

      expect(service.load(CLASS_IRI, columns(4)).widths).toEqual({});
    });
  });

  describe('reconciliation', () => {
    it('DropsAStoredColumnTheClassNoLongerDefines', () => {
      store({ visible: [LABEL_COLUMN_KEY, 'p0', 'gone'], hidden: ['alsoGone'], widths: {} });

      const layout = service.load(CLASS_IRI, columns(2));

      expect(layout.visible).toEqual([LABEL_COLUMN_KEY, 'p0', 'p1']);
      expect(layout.hidden).toEqual([]);
    });

    it('AddsAColumnTheLayoutNeverHeardOfAsVisible', () => {
      store({ visible: [LABEL_COLUMN_KEY, 'p0'], hidden: ['p1'], widths: {} });

      const layout = service.load(CLASS_IRI, columns(3));

      expect(layout.visible).toEqual([LABEL_COLUMN_KEY, 'p0', 'p2']);
      expect(layout.hidden).toEqual(['p1']);
    });

    it('PutsANewColumnAfterTheOneBeforeItInTheModel', () => {
      store({ visible: [LABEL_COLUMN_KEY, 'p2', 'p1'], hidden: [], widths: {} });

      const layout = service.load(CLASS_IRI, columns(3));

      expect(layout.visible).toEqual([LABEL_COLUMN_KEY, 'p0', 'p2', 'p1']);
    });

    it('KeepsANewColumnBehindThePins', () => {
      store({ visible: [LABEL_COLUMN_KEY, 'p2', 'p1'], hidden: [], widths: {}, pinned: ['p2'] });

      const layout = service.load(CLASS_IRI, columns(3));

      expect(layout.visible).toEqual([LABEL_COLUMN_KEY, 'p2', 'p0', 'p1']);
    });

    it('DropsAPinOnAColumnThatIsGoneOrHiddenAndKeepsThePinsFirst', () => {
      store({ visible: [LABEL_COLUMN_KEY, 'p0', 'p1'], hidden: ['p2'], widths: {}, pinned: ['gone', 'p2', 'p1'] });

      const layout = service.load(CLASS_IRI, columns(3));

      expect(layout.pinned).toEqual(['p1']);
      expect(layout.visible).toEqual([LABEL_COLUMN_KEY, 'p1', 'p0']);
    });

    it('DropsAWidthForAColumnTheClassNoLongerDefines', () => {
      store({ visible: [LABEL_COLUMN_KEY], hidden: [], widths: { p0: 300, gone: 400 } });

      expect(service.load(CLASS_IRI, columns(1)).widths).toEqual({ p0: 300 });
    });

    it('ReinstatesTheLabelColumnWhenAStoredLayoutLacksIt', () => {
      store({ visible: ['p0'], hidden: [], widths: {} });

      const layout = service.load(CLASS_IRI, columns(2));

      expect(layout.visible[0]).toBe(LABEL_COLUMN_KEY);
      expect(layout.hidden).not.toContain(LABEL_COLUMN_KEY);
    });
  });

  describe('malformed storage', () => {
    it('FallsBackToTheDefaultWhenThePayloadIsNotJson', () => {
      store('{not json');

      expect(service.load(CLASS_IRI, columns(2)).visible).toEqual([LABEL_COLUMN_KEY, 'p0', 'p1']);
    });

    it('FallsBackToTheDefaultWhenThePayloadIsNotAnObject', () => {
      store('3');

      expect(service.load(CLASS_IRI, columns(2)).visible).toEqual([LABEL_COLUMN_KEY, 'p0', 'p1']);
    });

    // A `density` field stored by an earlier build must not discard the rest of the layout.
    it('RestoresAnOlderLayoutThatStillCarriesADensity', () => {
      store({ visible: [LABEL_COLUMN_KEY, 'p0'], hidden: [], widths: { p0: 250 } });

      const layout = service.load(CLASS_IRI, columns(1));

      expect(layout.widths).toEqual({ p0: 250 });
      expect('density' in layout).toBe(false);
    });

    it('RestoresARowHeightTheSliderCouldHaveSet', () => {
      store({ visible: [LABEL_COLUMN_KEY], hidden: [], widths: {}, rowHeight: 120 });

      expect(service.load(CLASS_IRI, columns(1)).rowHeight).toBe(120);
    });

    it.each([[12], [9999], ['tall'], [Number.NaN]])('FallsBackToAutoForAStoredRowHeightOf %p', rowHeight => {
      store({ visible: [LABEL_COLUMN_KEY], hidden: [], widths: {}, rowHeight });

      expect('rowHeight' in service.load(CLASS_IRI, columns(1))).toBe(false);
    });

    it('IgnoresNonNumericAndNonFiniteWidths', () => {
      store({ visible: [LABEL_COLUMN_KEY], hidden: [], widths: { p0: 'wide', p1: 0, p2: -5 } });

      expect(service.load(CLASS_IRI, columns(3)).widths).toEqual({});
    });

    it('IgnoresAVisibleFieldThatIsNotAnArrayOfStrings', () => {
      store({ visible: 'everything', hidden: [1, 2], widths: {} });

      const layout = service.load(CLASS_IRI, columns(2));

      expect(layout.visible).toEqual([LABEL_COLUMN_KEY, 'p0', 'p1']);
      expect(layout.hidden).toEqual([]);
    });
  });
});
