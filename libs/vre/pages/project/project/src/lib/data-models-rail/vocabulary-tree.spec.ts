import { expandableIds, VocabularyNode, vocabularyRows } from './vocabulary-tree';

const node = (id: string, children: VocabularyNode[] = []): VocabularyNode => ({
  id,
  labels: [{ value: id, language: 'en' }],
  children,
});

const topics = node('Topics', [node('Mathematics', [node('Geometry'), node('Algebra')]), node('Physics')]);
const types = node('Letter types', [node('Private'), node('Official')]);

const rows = (expanded: string[], query = '') =>
  vocabularyRows(
    [topics, types],
    new Set(expanded),
    query,
    n => n.labels[0].value,
    () => ''
  );

describe('vocabularyRows', () => {
  it('shows only the vocabularies, closed, with every value counted', () => {
    expect(rows([]).map(row => [row.label, row.count, row.expanded])).toEqual([
      ['Topics', 4, false],
      ['Letter types', 2, false],
    ]);
  });

  it('shows the values of the lines opened, one level deeper each', () => {
    expect(rows(['Topics', 'Mathematics']).map(row => [row.label, row.depth])).toEqual([
      ['Topics', 0],
      ['Mathematics', 1],
      ['Geometry', 2],
      ['Algebra', 2],
      ['Physics', 1],
      ['Letter types', 0],
    ]);
  });

  it('opens what leads to a value the search finds, and hides the rest', () => {
    expect(rows([], 'geo').map(row => row.label)).toEqual(['Topics', 'Mathematics', 'Geometry']);
  });
});

describe('expandableIds', () => {
  it('lists every line with values under it', () => {
    expect(expandableIds([topics, types])).toEqual(['Topics', 'Mathematics', 'Letter types']);
  });
});
