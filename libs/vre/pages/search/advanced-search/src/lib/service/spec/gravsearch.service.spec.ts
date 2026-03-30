import { TestBed } from '@angular/core/testing';
import { Constants } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { IriLabelPair, NodeValue, Predicate, StatementElement, StringValue } from '../../model';
import { Operator } from '../../operators.config';
import { GravsearchService } from '../gravsearch.service';
import { OntologyDataService } from '../ontology-data.service';
import { SearchStateService } from '../search-state.service';

/**
 * Helper function to set up test from JSON input
 * Reconstructs StatementElement objects from JSON snapshot
 */
function setupTestFromJson(
  searchStateService: SearchStateService,
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
        pred.label,
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
function changeOperator(searchStateService: SearchStateService, statementIndex: number, operator: Operator): void {
  const statements = searchStateService.currentState.statementElements;
  const originalValue = statements[statementIndex].selectedObjectNode;
  statements[statementIndex].selectedOperator = operator;
  statements[statementIndex].selectedObjectNode = originalValue; // Restore the value after operator change
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
  let searchStateService: SearchStateService;
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
        SearchStateService,
        OntologyDataService,
        { provide: DspApiConnectionToken, useValue: mockDspApiConnection },
      ],
    });

    gravsearchService = TestBed.inject(GravsearchService);
    searchStateService = TestBed.inject(SearchStateService);
    ontologyDataService = TestBed.inject(OntologyDataService);

    // Mock OntologyDataService
    jest.spyOn(ontologyDataService, 'selectedOntology', 'get').mockReturnValue({
      iri: webernOntologyIri,
      label: 'webern-onto',
    });
    jest.spyOn(ontologyDataService, 'classIris', 'get').mockReturnValue(webernClassIris);
  });

  it('should generate query with equals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = { iri: '', label: 'All resource classes' };
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    const statements = searchStateService.validStatementElements;
    const query = gravsearchService.generateGravSearchQuery(statements);

    const expectedQuery = `PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
PREFIX webern-onto: <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#>
CONSTRUCT {
?mainRes knora-api:isMainResource true .

} WHERE {
?mainRes a knora-api:Resource .
{ ?mainRes a webern-onto:Bibliography . } UNION { ?mainRes a webern-onto:Chronology . } UNION { ?mainRes a webern-onto:Convolute . } UNION { ?mainRes a webern-onto:Correspondence . } UNION { ?mainRes a webern-onto:DigitalCopyEditedText . } UNION { ?mainRes a webern-onto:DigitalCopyMusicalPiece . } UNION { ?mainRes a webern-onto:DigitalCopySourceDescription . } UNION { ?mainRes a webern-onto:DigitalCopySupplement . } UNION { ?mainRes a webern-onto:EditedText . } UNION { ?mainRes a webern-onto:Einleitung . } UNION { ?mainRes a webern-onto:Institution . } UNION { ?mainRes a webern-onto:MusicalPiece . } UNION { ?mainRes a webern-onto:Opus . } UNION { ?mainRes a webern-onto:Person . } UNION { ?mainRes a webern-onto:RismReference . } UNION { ?mainRes a webern-onto:SourceDescriptionManuscript . } UNION { ?mainRes a webern-onto:SourceDescriptionPrint . } UNION { ?mainRes a webern-onto:Supplement . } UNION { ?mainRes a webern-onto:TextEdition . } UNION { ?mainRes a webern-onto:test_reception . }
?mainRes <http://www.w3.org/2000/01/rdf-schema#label> ?res0 .

FILTER (?res0 = "foo") .

}

OFFSET 0`;

    expect(normalizeQuery(query)).toBe(normalizeQuery(expectedQuery));
  });

  it('should generate query with notEquals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = { iri: '', label: 'All resource classes' };
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.NotEquals);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER (?res0 != "foo")');
  });

  it('should generate query with isLike operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = { iri: '', label: 'All resource classes' };
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.IsLike);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER regex(?res0, "foo", "i")');
  });

  it('should generate query with matches operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = { iri: '', label: 'All resource classes' };
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.Matches);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER knora-api:matchLabel(?mainRes, "foo")');
  });
});

describe('Gravsearch Service and Writer - TextValue', () => {
  let gravsearchService: GravsearchService;
  let searchStateService: SearchStateService;
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
        SearchStateService,
        OntologyDataService,
        { provide: DspApiConnectionToken, useValue: mockDspApiConnection },
      ],
    });

    gravsearchService = TestBed.inject(GravsearchService);
    searchStateService = TestBed.inject(SearchStateService);
    ontologyDataService = TestBed.inject(OntologyDataService);

    // Mock OntologyDataService
    jest.spyOn(ontologyDataService, 'selectedOntology', 'get').mockReturnValue({
      iri: webernOntologyIri,
      label: 'webern-onto',
    });
    jest.spyOn(ontologyDataService, 'classIris', 'get').mockReturnValue(webernClassIris);
  });

  it('should generate query with equals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = { iri: '', label: 'All resource classes' };
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    const statements = searchStateService.validStatementElements;
    const query = gravsearchService.generateGravSearchQuery(statements);

    const expectedQuery = `PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
PREFIX webern-onto: <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#>
CONSTRUCT {
?mainRes knora-api:isMainResource true .
?mainRes <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasPlacePublisher> ?res0 .

} WHERE {
?mainRes a knora-api:Resource .
{ ?mainRes a webern-onto:Bibliography . } UNION { ?mainRes a webern-onto:Chronology . } UNION { ?mainRes a webern-onto:Convolute . } UNION { ?mainRes a webern-onto:Correspondence . } UNION { ?mainRes a webern-onto:DigitalCopyEditedText . } UNION { ?mainRes a webern-onto:DigitalCopyMusicalPiece . } UNION { ?mainRes a webern-onto:DigitalCopySourceDescription . } UNION { ?mainRes a webern-onto:DigitalCopySupplement . } UNION { ?mainRes a webern-onto:EditedText . } UNION { ?mainRes a webern-onto:Einleitung . } UNION { ?mainRes a webern-onto:Institution . } UNION { ?mainRes a webern-onto:MusicalPiece . } UNION { ?mainRes a webern-onto:Opus . } UNION { ?mainRes a webern-onto:Person . } UNION { ?mainRes a webern-onto:RismReference . } UNION { ?mainRes a webern-onto:SourceDescriptionManuscript . } UNION { ?mainRes a webern-onto:SourceDescriptionPrint . } UNION { ?mainRes a webern-onto:Supplement . } UNION { ?mainRes a webern-onto:TextEdition . } UNION { ?mainRes a webern-onto:test_reception . }
?mainRes <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasPlacePublisher> ?res0 .
?res0 <http://api.knora.org/ontology/knora-api/v2#valueAsString> ?res0val .
FILTER (?res0val = "Wien"^^<http://www.w3.org/2001/XMLSchema#string> ) .

}

OFFSET 0`;

    expect(normalizeQuery(query)).toBe(normalizeQuery(expectedQuery));
  });

  it('should generate query with notEquals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = { iri: '', label: 'All resource classes' };
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.NotEquals);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER (?res0val != "Wien"^^<http://www.w3.org/2001/XMLSchema#string> )');
  });

  it('should generate query with isLike operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = { iri: '', label: 'All resource classes' };
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.IsLike);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER regex(?res0val, "Wien"^^<http://www.w3.org/2001/XMLSchema#string>, "i") .');
  });
});

describe('Gravsearch Service and Writer - ListValue', () => {
  let gravsearchService: GravsearchService;
  let searchStateService: SearchStateService;
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
        SearchStateService,
        OntologyDataService,
        { provide: DspApiConnectionToken, useValue: mockDspApiConnection },
      ],
    });

    gravsearchService = TestBed.inject(GravsearchService);
    searchStateService = TestBed.inject(SearchStateService);
    ontologyDataService = TestBed.inject(OntologyDataService);

    // Mock OntologyDataService
    jest.spyOn(ontologyDataService, 'selectedOntology', 'get').mockReturnValue({
      iri: webernOntologyIri,
      label: 'webern-onto',
    });
    jest.spyOn(ontologyDataService, 'classIris', 'get').mockReturnValue(webernClassIris);
  });

  it('should generate query with equals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = {
      iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#SourceDescriptionManuscript',
      label: '[AWG] Quellenbeschreibung (MS)',
    };
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    const statements = searchStateService.validStatementElements;
    const query = gravsearchService.generateGravSearchQuery(statements);

    const expectedQuery = `PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
PREFIX webern-onto: <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#>
CONSTRUCT {
?mainRes knora-api:isMainResource true .
?mainRes <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasSourceDescMainWritingInstr> ?res0 .

} WHERE {
?mainRes a knora-api:Resource .
?mainRes a <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#SourceDescriptionManuscript> .
?mainRes <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasSourceDescMainWritingInstr> ?res0 .
?res0 <http://api.knora.org/ontology/knora-api/v2#listValueAsListNode> <http://rdfh.ch/lists/0806/8mpYXDnYRYi_9HAHXzmzIA> .


}

OFFSET 0`;

    expect(normalizeQuery(query)).toBe(normalizeQuery(expectedQuery));
  });

  it('should generate query with notEquals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = {
      iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#SourceDescriptionManuscript',
      label: '[AWG] Quellenbeschreibung (MS)',
    };
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
  let searchStateService: SearchStateService;
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
        SearchStateService,
        OntologyDataService,
        { provide: DspApiConnectionToken, useValue: mockDspApiConnection },
      ],
    });

    gravsearchService = TestBed.inject(GravsearchService);
    searchStateService = TestBed.inject(SearchStateService);
    ontologyDataService = TestBed.inject(OntologyDataService);

    // Mock OntologyDataService
    jest.spyOn(ontologyDataService, 'selectedOntology', 'get').mockReturnValue({
      iri: webernOntologyIri,
      label: 'webern-onto',
    });
    jest.spyOn(ontologyDataService, 'classIris', 'get').mockReturnValue(webernClassIris);
  });

  it('should generate query with equals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = {
      iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#MusicalPiece',
      label: 'Musikstück (AWG-ID)',
    };
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    const statements = searchStateService.validStatementElements;
    const query = gravsearchService.generateGravSearchQuery(statements);

    const expectedQuery = `PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
PREFIX webern-onto: <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#>
CONSTRUCT {
?mainRes knora-api:isMainResource true .
?mainRes <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasMnr> ?res0 .

} WHERE {
?mainRes a knora-api:Resource .
?mainRes a <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#MusicalPiece> .
?mainRes <http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#hasMnr> ?res0 .
?res0 <http://api.knora.org/ontology/knora-api/v2#intValueAsInt> ?res0val .
FILTER (?res0val = "1"^^<http://www.w3.org/2001/XMLSchema#integer> ) .


}

OFFSET 0`;

    expect(normalizeQuery(query)).toBe(normalizeQuery(expectedQuery));
  });

  it('should generate query with notEquals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = {
      iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#MusicalPiece',
      label: 'Musikstück (AWG-ID)',
    };
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.NotEquals);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER (?res0val != "1"^^<http://www.w3.org/2001/XMLSchema#integer> )');
  });

  it('should generate query with greaterThan operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = {
      iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#MusicalPiece',
      label: 'Musikstück (AWG-ID)',
    };
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.GreaterThan);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER (?res0val > "1"^^<http://www.w3.org/2001/XMLSchema#integer> )');
  });

  it('should generate query with greaterThanEquals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = {
      iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#MusicalPiece',
      label: 'Musikstück (AWG-ID)',
    };
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.GreaterThanEquals);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER (?res0val >= "1"^^<http://www.w3.org/2001/XMLSchema#integer> )');
  });

  it('should generate query with lessThan operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = {
      iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#MusicalPiece',
      label: 'Musikstück (AWG-ID)',
    };
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.LessThan);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER (?res0val < "1"^^<http://www.w3.org/2001/XMLSchema#integer> )');
  });

  it('should generate query with lessThanEquals operator', () => {
    const jsonSnapshot = JSON.stringify(baseJsonSnapshot);
    const resourceClass: IriLabelPair = {
      iri: 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2#MusicalPiece',
      label: 'Musikstück (AWG-ID)',
    };
    setupTestFromJson(searchStateService, jsonSnapshot, resourceClass);

    changeOperator(searchStateService, 0, Operator.LessThanEquals);

    const query = gravsearchService.generateGravSearchQuery(searchStateService.validStatementElements);

    // Only check the operator-specific FILTER clause
    expect(query).toContain('FILTER (?res0val <= "1"^^<http://www.w3.org/2001/XMLSchema#integer> )');
  });
});
