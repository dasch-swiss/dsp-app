import { TestBed } from '@angular/core/testing';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { createMockLocalizationService } from '@dasch-swiss/vre/shared/app-helper-services/testing';
import { TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';
import { IriLabelPair, NodeValue, OrderByItem, Predicate, StatementElement, StringValue } from '../../model';
import { Operator } from '../../operators.config';
import { englishLabels, makeIriLabelPair } from '../../testing/test-data-builders';
import { GravsearchService } from '../gravsearch.service';
import { OntologyDataService } from '../ontology-data.service';

const { service: mockLocalizationService } = createMockLocalizationService('en');

/**
 * Minimal statement container used to drive the pure `generateGravSearchQuery` (DEV-6576). The
 * production `SearchStateService` was retired in Phase 4; these query-generation tests only ever used
 * it as a place to hold a statement tree and read it back, so a local double keeps the spec focused on
 * the query output without depending on removed production state.
 */
class StatementStore {
  private _state: {
    selectedResourceClass?: IriLabelPair;
    statementElements: StatementElement[];
    orderBy: OrderByItem[];
  } = { statementElements: [], orderBy: [] };
  get currentState() {
    return this._state;
  }
  get validStatementElements() {
    return this._state.statementElements.filter(s => s.isValidAndComplete);
  }
  patchState(partial: Partial<typeof this._state>) {
    this._state = { ...this._state, ...partial };
  }
}

// OntologyDataService eagerly loads the synthetic rdfs:label predicate via
// TranslateLoader on init. The gravsearch suite does not exercise that
// behaviour, so a minimal stub returning empty translation objects is
// sufficient to satisfy DI.
const mockTranslateLoader: TranslateLoader = {
  getTranslation: () => of({}),
};

/**
 * Helper function to set up test from JSON input
 * Reconstructs StatementElement objects from JSON snapshot
 */
function setupTestFromJson(
  searchStateService: StatementStore,
  jsonSnapshot: string,
  resourceClass?: IriLabelPair,
  orderBy: any[] = []
): void {
  const parsed = JSON.parse(jsonSnapshot);

  // Reconstruct statement elements from JSON
  const statementElements = parsed.statementElements.map((jsonElement: any) => {
    const statement = new StatementElement();

    // Manually set the id to match the JSON
    (statement as any).id = jsonElement.id;
    (statement as any).statementLevel = jsonElement.statementLevel;

    // Reconstruct subject node if present
    if (jsonElement._subjectNode) {
      (statement as any)._subjectNode = new NodeValue(
        jsonElement._subjectNode.statementId,
        jsonElement._subjectNode._value
      );
    }

    // Reconstruct predicate if present
    if (jsonElement._selectedPredicate) {
      const pred = jsonElement._selectedPredicate;
      (statement as any)._selectedPredicate = new Predicate(
        pred.iri,
        englishLabels(pred.label),
        pred.objectValueType,
        pred.isLinkProperty,
        pred.listObjectIri
      );
    }

    // Reconstruct operator if present
    if (jsonElement._selectedOperator) {
      (statement as any)._selectedOperator = jsonElement._selectedOperator;
    }

    // Reconstruct object node if present
    if (jsonElement._selectedObjectNode) {
      const objNode = jsonElement._selectedObjectNode;
      if (typeof objNode._value === 'string') {
        (statement as any)._selectedObjectNode = new StringValue(objNode.statementId, objNode._value);
      } else {
        (statement as any)._selectedObjectNode = new NodeValue(objNode.statementId, objNode._value);
      }
    }

    return statement;
  });

  // Patch search state with reconstructed elements
  searchStateService.patchState({
    selectedResourceClass: resourceClass,
    statementElements: statementElements,
    orderBy: orderBy,
  } as any);
}

/**
 * Helper function to change operator while preserving the selected value
 * @param searchStateService - The search state service instance
 * @param statementIndex - Index of the statement to modify
 * @param operator - The new operator to set
 */
function changeOperator(searchStateService: StatementStore, statementIndex: number, operator: Operator): void {
  const statements = searchStateService.currentState.statementElements;
  const originalValue = statements[statementIndex].selectedObjectNode;
  statements[statementIndex].selectedOperator = operator;
  statements[statementIndex].selectedObjectNode = originalValue; // Restore the value after operator change
  searchStateService.patchState({ statementElements: statements });
}

/**
 * Helper function to set the selected value (StringValue) on a statement
 * while preserving the existing operator. Useful for parameterising tests
 * that vary the user-supplied search input.
 */
function setSelectedValue(searchStateService: StatementStore, statementIndex: number, value: string): void {
  const statements = searchStateService.currentState.statementElements;
  statements[statementIndex].selectedObjectNode = new StringValue(statements[statementIndex].id, value);
  searchStateService.patchState({ statementElements: statements });
}

/**
 * Helper function to normalize whitespace in queries for comparison
 */
function normalizeQuery(query: string): string {
  return query
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*\n\s*/g, '\n');
}

describe('Gravsearch Service and Writer - Label', () => {
  let gravsearchService: GravsearchService;
  let searchStateService: StatementStore;
  let ontologyDataService: OntologyDataService;

  const baseJsonSnapshot = {
    selectedOntology: {
      iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2',
      label: 'webern-onto',
    },
    selectedResourceClass: {
      iri: '',
      label: 'All resource classes',
    },
    statementElements: [
      {
        id: 'e7aae835-4825-4c94-baab-d4502cb965c5',
        statementLevel: 0,
        _selectedPredicate: {
          iri: 'http://www.w3.org/2000/01/rdf-schema#label',
          label: 'Resource Label',
          objectValueType: 'http://api.knora.org/ontology/knora-api/v2#ResourceLabel',
          isLinkProperty: false,
        },
        _selectedOperator: 'equals',
        _selectedObjectNode: {
          statementId: 'e7aae835-4825-4c94-baab-d4502cb965c5',
          _value: 'foo',
        },
      },
      {
        id: '3cdce58f-9400-4641-b170-75e82843c03e',
        statementLevel: 0,
      },
    ],
    orderBy: [
      {
        id: 'http://www.w3.org/2000/01/rdf-schema#label',
        label: 'Resource Label',
        orderBy: false,
      },
    ],
  };

  const webernOntologyIri = 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2';
  const webernClassIris = [
    `${webernOntologyIri}#Bibliography`,
    `${webernOntologyIri}#Chronology`,
    `${webernOntologyIri}#Convolute`,
    `${webernOntologyIri}#Correspondence`,
    `${webernOntologyIri}#DigitalCopyEditedText`,
    `${webernOntologyIri}#DigitalCopyMusicalPiece`,
    `${webernOntologyIri}#DigitalCopySourceDescription`,
    `${webernOntologyIri}#DigitalCopySupplement`,
    `${webernOntologyIri}#EditedText`,
    `${webernOntologyIri}#Einleitung`,
    `${webernOntologyIri}#Institution`,
    `${webernOntologyIri}#MusicalPiece`,
    `${webernOntologyIri}#Opus`,
    `${webernOntologyIri}#Person`,
    `${webernOntologyIri}#RismReference`,
    `${webernOntologyIri}#SourceDescriptionManuscript`,
    `${webernOntologyIri}#SourceDescriptionPrint`,
    `${webernOntologyIri}#Supplement`,
    `${webernOntologyIri}#TextEdition`,
    `${webernOntologyIri}#test_reception`,
  ];

  beforeEach(() => {
    const mockDspApiConnection = {};

    TestBed.configureTestingModule({
      providers: [
        GravsearchService,
        OntologyDataService,
        { provide: DspApiConnectionToken, useValue: mockDspApiConnection },
        { provide: LocalizationService, useValue: mockLocalizationService },
        { provide: TranslateLoader, useValue: mockTranslateLoader },
      ],
    });

    gravsearchService = TestBed.inject(GravsearchService);
    searchStateService = new StatementStore();
    ontologyDataService = TestBed.inject(OntologyDataService);

    // Mock OntologyDataService
    jest
      .spyOn(ontologyDataService, 'selectedOntology', 'get')
      .mockReturnValue(makeIriLabelPair(webernOntologyIri, 'webern-onto'));
    jest.spyOn(ontologyDataService, 'classIris', 'get').mockReturnValue(webernClassIris);
  });

  it('should generate query with equals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair('', 'All resource classes');
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    const statements = searchStateService.validStatementElements;
    const query = gravsearchService.generateGravSearchQuery(statements);

    const expectedQuery = `PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX webern-onto: <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#>
CONSTRUCT {
?mainRes knora-api:isMainResource true .

} WHERE {
?mainRes a knora-api:Resource .
{ ?mainRes a webern-onto:Bibliography . } UNION { ?mainRes a webern-onto:Chronology . } UNION { ?mainRes a webern-onto:Convolute . } UNION { ?mainRes a webern-onto:Correspondence . } UNION { ?mainRes a webern-onto:DigitalCopyEditedText . } UNION { ?mainRes a webern-onto:DigitalCopyMusicalPiece . } UNION { ?mainRes a webern-onto:DigitalCopySourceDescription . } UNION { ?mainRes a webern-onto:DigitalCopySupplement . } UNION { ?mainRes a webern-onto:EditedText . } UNION { ?mainRes a webern-onto:Einleitung . } UNION { ?mainRes a webern-onto:Institution . } UNION { ?mainRes a webern-onto:MusicalPiece . } UNION { ?mainRes a webern-onto:Opus . } UNION { ?mainRes a webern-onto:Person . } UNION { ?mainRes a webern-onto:RismReference . } UNION { ?mainRes a webern-onto:SourceDescriptionManuscript . } UNION { ?mainRes a webern-onto:SourceDescriptionPrint . } UNION { ?mainRes a webern-onto:Supplement . } UNION { ?mainRes a webern-onto:TextEdition . } UNION { ?mainRes a webern-onto:test_reception . }
?mainRes rdfs:label ?label .
?mainRes <http://www.w3.org/2000/01/rdf-schema#label> ?res0 .

FILTER (?res0 = "foo") .

}

ORDER BY ASC(?label)
OFFSET 0`;

    expect(normalizeQuery(query)).toBe(normalizeQuery(expectedQuery));
  });

  it('should generate query with notEquals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair('', 'All resource classes');
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.NotEquals);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER (?res0 != "foo")');
  });

  it('should generate query with isLike operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair('', 'All resource classes');
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.IsLike);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER regex(?res0, "foo", "i")');
  });

  it('should generate query with matches operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair('', 'All resource classes');
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.Matches);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER knora-api:matchLabel(?mainRes, "foo")');
  });

  it('passes regex metacharacters through unchanged in label isLike pattern', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair('', 'All resource classes');
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.IsLike);
    // User input: a.b*c(d) — full regex; user wants `.` `*` `(` `)` as metachars.
    setSelectedValue(searchStateService, 0, 'a.b*c(d)');

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    expect(query).toContain('FILTER regex(?res0, "a.b*c(d)", "i")');
  });

  it('quadruples user-typed backslashes and triples-escapes quotes in label isLike pattern', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair('', 'All resource classes');
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.IsLike);
    // User input: say "hi" \* — TS source: 'say "hi" \\*'
    // Intent: regex literal `*` (because user wrote `\*`), plus literal quotes.
    setSelectedValue(searchStateService, 0, 'say "hi" \\*');

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Runtime wire string inside the FILTER literal: say \\\"hi\\\" \\\\*
    // (3 backslashes per quote, 4 backslashes per user backslash)
    expect(query).toContain('FILTER regex(?res0, "say \\\\\\"hi\\\\\\" \\\\\\\\*", "i")');
  });
});

describe('Gravsearch Service and Writer - TextValue', () => {
  let gravsearchService: GravsearchService;
  let searchStateService: StatementStore;
  let ontologyDataService: OntologyDataService;

  const baseJsonSnapshot = {
    selectedOntology: {
      iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2',
      label: 'webern-onto',
    },
    selectedResourceClass: {
      iri: '',
      label: 'All resource classes',
    },
    statementElements: [
      {
        id: '3eb55be4-855f-4fba-a489-05f5a8aa6773',
        statementLevel: 0,
        _selectedPredicate: {
          iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasPlacePublisher',
          label: 'Verlagsort',
          objectValueType: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
          isLinkProperty: false,
        },
        _selectedOperator: 'equals',
        _selectedObjectNode: {
          statementId: '3eb55be4-855f-4fba-a489-05f5a8aa6773',
          _value: 'Wien',
        },
      },
      {
        id: '5ec9ffec-1425-4a2e-98c8-475d53efad58',
        statementLevel: 0,
      },
    ],
    orderBy: [
      {
        id: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasPlacePublisher',
        label: 'Verlagsort',
        orderBy: false,
      },
    ],
  };

  const webernOntologyIri = 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2';
  const webernClassIris = [
    `${webernOntologyIri}#Bibliography`,
    `${webernOntologyIri}#Chronology`,
    `${webernOntologyIri}#Convolute`,
    `${webernOntologyIri}#Correspondence`,
    `${webernOntologyIri}#DigitalCopyEditedText`,
    `${webernOntologyIri}#DigitalCopyMusicalPiece`,
    `${webernOntologyIri}#DigitalCopySourceDescription`,
    `${webernOntologyIri}#DigitalCopySupplement`,
    `${webernOntologyIri}#EditedText`,
    `${webernOntologyIri}#Einleitung`,
    `${webernOntologyIri}#Institution`,
    `${webernOntologyIri}#MusicalPiece`,
    `${webernOntologyIri}#Opus`,
    `${webernOntologyIri}#Person`,
    `${webernOntologyIri}#RismReference`,
    `${webernOntologyIri}#SourceDescriptionManuscript`,
    `${webernOntologyIri}#SourceDescriptionPrint`,
    `${webernOntologyIri}#Supplement`,
    `${webernOntologyIri}#TextEdition`,
    `${webernOntologyIri}#test_reception`,
  ];

  beforeEach(() => {
    const mockDspApiConnection = {};

    TestBed.configureTestingModule({
      providers: [
        GravsearchService,
        OntologyDataService,
        { provide: DspApiConnectionToken, useValue: mockDspApiConnection },
        { provide: LocalizationService, useValue: mockLocalizationService },
        { provide: TranslateLoader, useValue: mockTranslateLoader },
      ],
    });

    gravsearchService = TestBed.inject(GravsearchService);
    searchStateService = new StatementStore();
    ontologyDataService = TestBed.inject(OntologyDataService);

    // Mock OntologyDataService
    jest
      .spyOn(ontologyDataService, 'selectedOntology', 'get')
      .mockReturnValue(makeIriLabelPair(webernOntologyIri, 'webern-onto'));
    jest.spyOn(ontologyDataService, 'classIris', 'get').mockReturnValue(webernClassIris);
  });

  it('should generate query with equals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair('', 'All resource classes');
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    const statements = searchStateService.validStatementElements;
    const query = gravsearchService.generateGravSearchQuery(statements);

    const expectedQuery = `PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX webern-onto: <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#>
CONSTRUCT {
?mainRes knora-api:isMainResource true .
?mainRes <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasPlacePublisher> ?res0 .

} WHERE {
?mainRes a knora-api:Resource .
{ ?mainRes a webern-onto:Bibliography . } UNION { ?mainRes a webern-onto:Chronology . } UNION { ?mainRes a webern-onto:Convolute . } UNION { ?mainRes a webern-onto:Correspondence . } UNION { ?mainRes a webern-onto:DigitalCopyEditedText . } UNION { ?mainRes a webern-onto:DigitalCopyMusicalPiece . } UNION { ?mainRes a webern-onto:DigitalCopySourceDescription . } UNION { ?mainRes a webern-onto:DigitalCopySupplement . } UNION { ?mainRes a webern-onto:EditedText . } UNION { ?mainRes a webern-onto:Einleitung . } UNION { ?mainRes a webern-onto:Institution . } UNION { ?mainRes a webern-onto:MusicalPiece . } UNION { ?mainRes a webern-onto:Opus . } UNION { ?mainRes a webern-onto:Person . } UNION { ?mainRes a webern-onto:RismReference . } UNION { ?mainRes a webern-onto:SourceDescriptionManuscript . } UNION { ?mainRes a webern-onto:SourceDescriptionPrint . } UNION { ?mainRes a webern-onto:Supplement . } UNION { ?mainRes a webern-onto:TextEdition . } UNION { ?mainRes a webern-onto:test_reception . }
?mainRes rdfs:label ?label .
?mainRes <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasPlacePublisher> ?res0 .
?res0 <http://api.knora.org/ontology/knora-api/v2#valueAsString> ?res0val .
FILTER (?res0val = "Wien"^^<http://www.w3.org/2001/XMLSchema#string> ) .

}

ORDER BY ASC(?label)
OFFSET 0`;

    expect(normalizeQuery(query)).toBe(normalizeQuery(expectedQuery));
  });

  it('should generate query with notEquals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair('', 'All resource classes');
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.NotEquals);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER (?res0val != "Wien"^^<http://www.w3.org/2001/XMLSchema#string> )');
  });

  it('should generate query with isLike operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair('', 'All resource classes');
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.IsLike);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER regex(?res0val, "Wien"^^<http://www.w3.org/2001/XMLSchema#string>, "i") .');
  });

  it('passes regex metacharacters through unchanged in TextValue isLike pattern', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair('', 'All resource classes');
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.IsLike);
    // User input: Wien.* — wildcard search.
    setSelectedValue(searchStateService, 0, 'Wien.*');

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    expect(query).toContain('FILTER regex(?res0val, "Wien.*"^^<http://www.w3.org/2001/XMLSchema#string>, "i")');
  });

  it('quadruples user-typed backslashes and triples-escapes quotes in TextValue isLike pattern', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair('', 'All resource classes');
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.IsLike);
    // User input: a"b\c — TS source: 'a"b\\c'
    setSelectedValue(searchStateService, 0, 'a"b\\c');

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Runtime wire string inside the FILTER literal: a\\\"b\\\\c
    // (3 backslashes per quote, 4 backslashes per user backslash)
    expect(query).toContain(
      'FILTER regex(?res0val, "a\\\\\\"b\\\\\\\\c"^^<http://www.w3.org/2001/XMLSchema#string>, "i")'
    );
  });
});

describe('Gravsearch Service and Writer - ListValue', () => {
  let gravsearchService: GravsearchService;
  let searchStateService: StatementStore;
  let ontologyDataService: OntologyDataService;

  const baseJsonSnapshot = {
    selectedOntology: {
      iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2',
      label: 'webern-onto',
    },
    selectedResourceClass: {
      iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#SourceDescriptionManuscript',
      label: '[AWG] Quellenbeschreibung (MS)',
    },
    statementElements: [
      {
        id: '26131ee4-84a5-4fb2-b720-9314de03f91c',
        statementLevel: 0,
        _subjectNode: {
          statementId: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#SourceDescriptionManuscript',
          _value: {
            iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#SourceDescriptionManuscript',
            label: '[AWG] Quellenbeschreibung (MS)',
          },
        },
        _selectedPredicate: {
          iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasSourceDescMainWritingInstr',
          label: 'Hauptschreibstoff (hlist)',
          objectValueType: 'http://api.knora.org/ontology/knora-api/v2#ListValue',
          isLinkProperty: false,
          listObjectIri: 'http://rdfh.ch/lists/0806/z6j2C_uVSTCedWAzMzHcyA',
        },
        _selectedOperator: 'equals',
        _selectedObjectNode: {
          statementId: '26131ee4-84a5-4fb2-b720-9314de03f91c',
          _value: 'http://rdfh.ch/lists/0806/8mpYXDnYRYi_9HAHXzmzIA',
        },
      },
      {
        id: '8c585ef7-4038-4131-b107-4727006bbcf4',
        statementLevel: 0,
        _subjectNode: {
          statementId: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#SourceDescriptionManuscript',
          _value: {
            iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#SourceDescriptionManuscript',
            label: '[AWG] Quellenbeschreibung (MS)',
          },
        },
      },
    ],
    orderBy: [
      {
        id: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasSourceDescMainWritingInstr',
        label: 'Hauptschreibstoff (hlist)',
        orderBy: false,
      },
    ],
  };

  const webernOntologyIri = 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2';
  const webernClassIris = [
    `${webernOntologyIri}#Bibliography`,
    `${webernOntologyIri}#Chronology`,
    `${webernOntologyIri}#Convolute`,
    `${webernOntologyIri}#Correspondence`,
    `${webernOntologyIri}#DigitalCopyEditedText`,
    `${webernOntologyIri}#DigitalCopyMusicalPiece`,
    `${webernOntologyIri}#DigitalCopySourceDescription`,
    `${webernOntologyIri}#DigitalCopySupplement`,
    `${webernOntologyIri}#EditedText`,
    `${webernOntologyIri}#Einleitung`,
    `${webernOntologyIri}#Institution`,
    `${webernOntologyIri}#MusicalPiece`,
    `${webernOntologyIri}#Opus`,
    `${webernOntologyIri}#Person`,
    `${webernOntologyIri}#RismReference`,
    `${webernOntologyIri}#SourceDescriptionManuscript`,
    `${webernOntologyIri}#SourceDescriptionPrint`,
    `${webernOntologyIri}#Supplement`,
    `${webernOntologyIri}#TextEdition`,
    `${webernOntologyIri}#test_reception`,
  ];

  beforeEach(() => {
    const mockDspApiConnection = {};

    TestBed.configureTestingModule({
      providers: [
        GravsearchService,
        OntologyDataService,
        { provide: DspApiConnectionToken, useValue: mockDspApiConnection },
        { provide: LocalizationService, useValue: mockLocalizationService },
        { provide: TranslateLoader, useValue: mockTranslateLoader },
      ],
    });

    gravsearchService = TestBed.inject(GravsearchService);
    searchStateService = new StatementStore();
    ontologyDataService = TestBed.inject(OntologyDataService);

    // Mock OntologyDataService
    jest
      .spyOn(ontologyDataService, 'selectedOntology', 'get')
      .mockReturnValue(makeIriLabelPair(webernOntologyIri, 'webern-onto'));
    jest.spyOn(ontologyDataService, 'classIris', 'get').mockReturnValue(webernClassIris);
  });

  it('should generate query with equals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair(
      'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#SourceDescriptionManuscript',
      '[AWG] Quellenbeschreibung (MS)'
    );
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    const statements = searchStateService.validStatementElements;
    const query = gravsearchService.generateGravSearchQuery(statements, undefined, resourceClass.iri);

    const expectedQuery = `PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX webern-onto: <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#>
CONSTRUCT {
?mainRes knora-api:isMainResource true .
?mainRes <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasSourceDescMainWritingInstr> ?res0 .

} WHERE {
?mainRes a knora-api:Resource .
?mainRes a <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#SourceDescriptionManuscript> .
?mainRes rdfs:label ?label .
?mainRes <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasSourceDescMainWritingInstr> ?res0 .
?res0 <http://api.knora.org/ontology/knora-api/v2#listValueAsListNode> <http://rdfh.ch/lists/0806/8mpYXDnYRYi_9HAHXzmzIA> .


}

ORDER BY ASC(?label)
OFFSET 0`;

    expect(normalizeQuery(query)).toBe(normalizeQuery(expectedQuery));
  });

  it('should generate query with notEquals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair(
      'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#SourceDescriptionManuscript',
      '[AWG] Quellenbeschreibung (MS)'
    );
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.NotEquals);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain(
      'FILTER NOT EXISTS { ?res0 <http://api.knora.org/ontology/knora-api/v2#listValueAsListNode> <http://rdfh.ch/lists/0806/8mpYXDnYRYi_9HAHXzmzIA> . }'
    );
  });
});

describe('Gravsearch Service and Writer - IntValue', () => {
  let gravsearchService: GravsearchService;
  let searchStateService: StatementStore;
  let ontologyDataService: OntologyDataService;

  const baseJsonSnapshot = {
    selectedOntology: {
      iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2',
      label: 'webern-onto',
    },
    selectedResourceClass: {
      iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#MusicalPiece',
      label: 'Musikstück (AWG-ID)',
    },
    statementElements: [
      {
        id: '9cfc6aa4-d04f-4119-ae67-d579f2191ad3',
        statementLevel: 0,
        _selectedPredicate: {
          iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasMnr',
          label: 'Moldenhauer-Nummer',
          objectValueType: 'http://api.knora.org/ontology/knora-api/v2#IntValue',
          isLinkProperty: false,
        },
        _selectedOperator: 'equals',
        _selectedObjectNode: {
          statementId: '9cfc6aa4-d04f-4119-ae67-d579f2191ad3',
          _value: '1',
        },
      },
      {
        id: '518a34ec-958c-46ae-a4d8-3c9f28fb650f',
        statementLevel: 0,
      },
    ],
    orderBy: [
      {
        id: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasMnr',
        label: 'Moldenhauer-Nummer',
        orderBy: false,
      },
    ],
  };

  const webernOntologyIri = 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2';
  const webernClassIris = [
    `${webernOntologyIri}#Bibliography`,
    `${webernOntologyIri}#Chronology`,
    `${webernOntologyIri}#Convolute`,
    `${webernOntologyIri}#Correspondence`,
    `${webernOntologyIri}#DigitalCopyEditedText`,
    `${webernOntologyIri}#DigitalCopyMusicalPiece`,
    `${webernOntologyIri}#DigitalCopySourceDescription`,
    `${webernOntologyIri}#DigitalCopySupplement`,
    `${webernOntologyIri}#EditedText`,
    `${webernOntologyIri}#Einleitung`,
    `${webernOntologyIri}#Institution`,
    `${webernOntologyIri}#MusicalPiece`,
    `${webernOntologyIri}#Opus`,
    `${webernOntologyIri}#Person`,
    `${webernOntologyIri}#RismReference`,
    `${webernOntologyIri}#SourceDescriptionManuscript`,
    `${webernOntologyIri}#SourceDescriptionPrint`,
    `${webernOntologyIri}#Supplement`,
    `${webernOntologyIri}#TextEdition`,
    `${webernOntologyIri}#test_reception`,
  ];

  beforeEach(() => {
    const mockDspApiConnection = {};

    TestBed.configureTestingModule({
      providers: [
        GravsearchService,
        OntologyDataService,
        { provide: DspApiConnectionToken, useValue: mockDspApiConnection },
        { provide: LocalizationService, useValue: mockLocalizationService },
        { provide: TranslateLoader, useValue: mockTranslateLoader },
      ],
    });

    gravsearchService = TestBed.inject(GravsearchService);
    searchStateService = new StatementStore();
    ontologyDataService = TestBed.inject(OntologyDataService);

    // Mock OntologyDataService
    jest
      .spyOn(ontologyDataService, 'selectedOntology', 'get')
      .mockReturnValue(makeIriLabelPair(webernOntologyIri, 'webern-onto'));
    jest.spyOn(ontologyDataService, 'classIris', 'get').mockReturnValue(webernClassIris);
  });

  it('should generate query with equals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair(
      'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#MusicalPiece',
      'Musikstück (AWG-ID)'
    );
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    const statements = searchStateService.validStatementElements;
    const query = gravsearchService.generateGravSearchQuery(statements, undefined, resourceClass.iri);

    const expectedQuery = `PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX webern-onto: <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#>
CONSTRUCT {
?mainRes knora-api:isMainResource true .
?mainRes <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasMnr> ?res0 .

} WHERE {
?mainRes a knora-api:Resource .
?mainRes a <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#MusicalPiece> .
?mainRes rdfs:label ?label .
?mainRes <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasMnr> ?res0 .
?res0 <http://api.knora.org/ontology/knora-api/v2#intValueAsInt> ?res0val .
FILTER (?res0val = "1"^^<http://www.w3.org/2001/XMLSchema#integer> ) .


}

ORDER BY ASC(?label)
OFFSET 0`;

    expect(normalizeQuery(query)).toBe(normalizeQuery(expectedQuery));
  });

  it('should generate query with notEquals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair(
      'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#MusicalPiece',
      'Musikstück (AWG-ID)'
    );
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.NotEquals);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER (?res0val != "1"^^<http://www.w3.org/2001/XMLSchema#integer> )');
  });

  it('emits ORDER BY on the active predicate index when an orderBy item is active (DEV-6576 D1)', () => {
    // Characterization oracle: orderBy is now an explicit argument, not read from currentState.
    // An active sort on hasMnr (statement index 0) must render `ORDER BY ?res0`.
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair(
      'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#MusicalPiece',
      'Musikstück (AWG-ID)'
    );
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    const activeOrderBy = [
      new OrderByItem('http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasMnr', [], false, true),
    ];
    const query = gravsearchService.generateGravSearchQuery(
      searchStateService.validStatementElements,
      undefined,
      resourceClass.iri,
      activeOrderBy
    );

    expect(query).toContain('ORDER BY ?res0');
    expect(query).not.toContain('ORDER BY ASC(?label)');
  });

  it('falls back to ORDER BY ASC(?label) when no orderBy item is active', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair(
      'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#MusicalPiece',
      'Musikstück (AWG-ID)'
    );
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    const query = gravsearchService.generateGravSearchQuery(
      searchStateService.validStatementElements,
      undefined,
      resourceClass.iri,
      []
    );

    expect(query).toContain('ORDER BY ASC(?label)');
  });

  it('should generate query with greaterThan operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair(
      'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#MusicalPiece',
      'Musikstück (AWG-ID)'
    );
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.GreaterThan);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER (?res0val > "1"^^<http://www.w3.org/2001/XMLSchema#integer> )');
  });

  it('should generate query with greaterThanEquals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair(
      'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#MusicalPiece',
      'Musikstück (AWG-ID)'
    );
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.GreaterThanEquals);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER (?res0val >= "1"^^<http://www.w3.org/2001/XMLSchema#integer> )');
  });

  it('should generate query with lessThan operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair(
      'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#MusicalPiece',
      'Musikstück (AWG-ID)'
    );
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.LessThan);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER (?res0val < "1"^^<http://www.w3.org/2001/XMLSchema#integer> )');
  });

  it('should generate query with lessThanEquals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = makeIriLabelPair(
      'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#MusicalPiece',
      'Musikstück (AWG-ID)'
    );
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.LessThanEquals);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER (?res0val <= "1"^^<http://www.w3.org/2001/XMLSchema#integer> )');
  });
});

describe('GravsearchService — fulltextTerm parameter', () => {
  let gravsearchService: GravsearchService;
  let searchStateService: StatementStore;
  let ontologyDataService: OntologyDataService;

  const ontologyIri = 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GravsearchService,
        OntologyDataService,
        { provide: DspApiConnectionToken, useValue: {} },
        { provide: LocalizationService, useValue: mockLocalizationService },
        { provide: TranslateLoader, useValue: mockTranslateLoader },
      ],
    });

    gravsearchService = TestBed.inject(GravsearchService);
    searchStateService = new StatementStore();
    ontologyDataService = TestBed.inject(OntologyDataService);

    jest
      .spyOn(ontologyDataService, 'selectedOntology', 'get')
      .mockReturnValue({ iri: ontologyIri, label: 'webern-onto' });
    jest.spyOn(ontologyDataService, 'classIris', 'get').mockReturnValue([`${ontologyIri}#Person`]);
  });

  it('injects matchText filter when term is provided', () => {
    const query = gravsearchService.generateGravSearchQuery([], 'hello');
    expect(query).toContain('FILTER knora-api:matchText(?searchThis, "hello")');
  });

  it('does not inject matchText filter when term is empty string', () => {
    const query = gravsearchService.generateGravSearchQuery([], '');
    expect(query).not.toContain('matchText');
  });

  it('does not inject matchText filter when term is undefined', () => {
    const query = gravsearchService.generateGravSearchQuery([]);
    expect(query).not.toContain('matchText');
  });

  it('does not inject matchText filter when term is whitespace only', () => {
    const query = gravsearchService.generateGravSearchQuery([], '   ');
    expect(query).not.toContain('matchText');
  });

  it('trims the term before injecting', () => {
    const query = gravsearchService.generateGravSearchQuery([], '  hello  ');
    expect(query).toContain('FILTER knora-api:matchText(?searchThis, "hello")');
  });

  it('escapes double quotes in the term', () => {
    const query = gravsearchService.generateGravSearchQuery([], 'say "hi"');
    expect(query).toContain('matchText');
    expect(query).not.toContain('"say "hi""');
  });

  it('places matchesText triple after class restriction and before chip statements', () => {
    const jsonSnapshot = JSON.stringify({
      selectedOntology: { iri: ontologyIri, label: 'webern-onto' },
      selectedResourceClass: { iri: `${ontologyIri}#Person`, label: 'Person' },
      statementElements: [
        {
          id: 'abc-123',
          statementLevel: 0,
          _selectedPredicate: {
            iri: 'http://www.w3.org/2000/01/rdf-schema#label',
            label: 'Resource Label',
            objectValueType: 'http://api.knora.org/ontology/knora-api/v2#ResourceLabel',
            isLinkProperty: false,
          },
          _selectedOperator: 'equals',
          _selectedObjectNode: { statementId: 'abc-123', _value: 'bar' },
        },
      ],
      orderBy: [],
    });
    setupTestFromJson(searchStateService, jsonSnapshot, { iri: `${ontologyIri}#Person`, label: 'Person' });

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements, 'foo');
    const matchesIdx = query.indexOf('matchText');
    const chipIdx = query.indexOf('?res0');
    expect(matchesIdx).toBeGreaterThan(-1);
    expect(chipIdx).toBeGreaterThan(-1);
    expect(matchesIdx).toBeLessThan(chipIdx);
  });
});
