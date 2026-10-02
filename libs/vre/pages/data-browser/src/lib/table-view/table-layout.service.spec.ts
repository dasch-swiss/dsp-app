import { TableColumn, LABEL_COLUMN_KEY } from './table-column.model';
import { TableLayout, TableLayoutService } from './table-layout.service';

const CLASS_IRI = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
const STORAGE_KEY = `dsp.dataBrowser.tableLayout.v1.${CLASS_IRI}`;

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

/** Label plus ten properties — enough to exercise the eight-column default. */
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
    it('ShowsTheLabelAndTheFirstSevenPropertiesWhenNothingIsStored', () => {
      const layout = service.load(CLASS_IRI, columns());

      expect(layout.visible).toEqual([LABEL_COLUMN_KEY, 'p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
      expect(layout.hidden).toEqual(['p7', 'p8', 'p9']);
      expect(layout.density).toBe('default');
      expect(layout.widths).toEqual({});
    });

    it('HidesNothingWhenTheClassHasFewerThanEightColumns', () => {
      const layout = service.load(CLASS_IRI, columns(3));

      expect(layout.visible).toHaveLength(4);
      expect(layout.hidden).toEqual([]);
    });
  });

  describe('round trip', () => {
    it('RestoresASavedLayout', () => {
      const saved: TableLayout = {
        visible: [LABEL_COLUMN_KEY, 'p3', 'p1'],
        hidden: ['p0', 'p2'],
        widths: { p1: 320 },
        density: 'compact',
      };
      service.save(CLASS_IRI, saved);

      expect(service.load(CLASS_IRI, columns(4))).toEqual(saved);
    });

    it('KeepsLayoutsOfDifferentClassesApart', () => {
      service.save(CLASS_IRI, { ...service.defaultLayout(columns(4)), density: 'comfortable' });

      expect(service.load('other-class', columns(4)).density).toBe('default');
    });

    it('ForgetsALayoutOnClear', () => {
      service.save(CLASS_IRI, { ...service.defaultLayout(columns(4)), density: 'compact' });
      service.clear(CLASS_IRI);

      expect(service.load(CLASS_IRI, columns(4)).density).toBe('default');
    });
  });

  // Ontologies get edited while people have the app open; all three of these are real.
  describe('reconciliation', () => {
    it('DropsAStoredColumnTheClassNoLongerDefines', () => {
      store({ visible: [LABEL_COLUMN_KEY, 'p0', 'gone'], hidden: ['alsoGone'], widths: {}, density: 'default' });

      const layout = service.load(CLASS_IRI, columns(2));

      expect(layout.visible).toEqual([LABEL_COLUMN_KEY, 'p0']);
      expect(layout.hidden).toEqual(['p1']);
    });

    it('AddsAColumnTheLayoutNeverHeardOfAsHidden', () => {
      store({ visible: [LABEL_COLUMN_KEY, 'p0'], hidden: ['p1'], widths: {}, density: 'default' });

      const layout = service.load(CLASS_IRI, columns(3));

      expect(layout.visible).toEqual([LABEL_COLUMN_KEY, 'p0']);
      expect(layout.hidden).toEqual(['p1', 'p2']);
    });

    it('DropsAWidthForAColumnTheClassNoLongerDefines', () => {
      store({ visible: [LABEL_COLUMN_KEY], hidden: [], widths: { p0: 300, gone: 400 }, density: 'default' });

      expect(service.load(CLASS_IRI, columns(1)).widths).toEqual({ p0: 300 });
    });

    it('ReinstatesTheLabelColumnWhenAStoredLayoutLacksIt', () => {
      store({ visible: ['p0'], hidden: [], widths: {}, density: 'default' });

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

    // `JSON.parse('3')` succeeds, so parseability alone is not enough of a check.
    it('FallsBackToTheDefaultWhenThePayloadIsNotAnObject', () => {
      store('3');

      expect(service.load(CLASS_IRI, columns(2)).visible).toEqual([LABEL_COLUMN_KEY, 'p0', 'p1']);
    });

    it('FallsBackToTheDefaultDensityWhenTheStoredOneIsUnknown', () => {
      store({ visible: [LABEL_COLUMN_KEY], hidden: [], widths: {}, density: 'enormous' });

      expect(service.load(CLASS_IRI, columns(1)).density).toBe('default');
    });

    it('IgnoresNonNumericAndNonFiniteWidths', () => {
      store({ visible: [LABEL_COLUMN_KEY], hidden: [], widths: { p0: 'wide', p1: 0, p2: -5 }, density: 'default' });

      expect(service.load(CLASS_IRI, columns(3)).widths).toEqual({});
    });

    it('IgnoresAVisibleFieldThatIsNotAnArrayOfStrings', () => {
      store({ visible: 'everything', hidden: [1, 2], widths: {}, density: 'default' });

      const layout = service.load(CLASS_IRI, columns(2));

      // Nothing survived the type check, so every column is unknown to the layout and lands hidden —
      // except the label, which is reinstated structurally.
      expect(layout.visible).toEqual([LABEL_COLUMN_KEY]);
      expect(layout.hidden).toEqual(['p0', 'p1']);
    });
  });
});
