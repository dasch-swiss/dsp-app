import { TestBed } from '@angular/core/testing';
import type {
  ClassDefinition,
  KnoraApiConnection,
  ReadOntology,
  ResourceClassDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { LocalizationService, OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { OntologyEditService } from './ontology-edit.service';

/**
 * Focused spec for `assignPropertyToClass$` (Task #4). The legacy void
 * `assignPropertyToClass` and the rest of the service are not covered here —
 * we only validate that the new Observable variant:
 *   1. Forwards the correct `UpdateOntology` shape to dsp-js.
 *   2. Reloads the ontology on success and emits once.
 *   3. Propagates errors and still resets `_isTransacting`.
 */
describe('OntologyEditService.assignPropertyToClass$', () => {
  let addCardinalitySpy: jest.Mock;
  let getOntologySpy: jest.Mock;
  let service: OntologyEditService;

  const ONTO_IRI = 'http://0.0.0.0:3333/ontology/0001/anything/v2';
  const LMD = '2026-05-12T10:00:00Z';
  const CLASS_IRI = `${ONTO_IRI}#Book`;
  const PROP_IRI = `${ONTO_IRI}#hasAuthor`;

  const stubOntology = (): ReadOntology =>
    ({
      id: ONTO_IRI,
      lastModificationDate: LMD,
      getAllClassDefinitions: () => [],
      getAllPropertyDefinitions: () => [],
      getClassDefinitionsByType: () => [],
      getPropertyDefinitionsByType: () => [],
    }) as unknown as ReadOntology;

  const stubClassDefinition = (guiOrders: (number | undefined)[] = []): ClassDefinition =>
    ({
      id: CLASS_IRI,
      propertiesList: guiOrders.map((g, i) => ({
        propertyIndex: `prop-${i}`,
        cardinality: 1,
        guiOrder: g,
      })),
    }) as unknown as ClassDefinition;

  beforeEach(() => {
    addCardinalitySpy = jest.fn();
    getOntologySpy = jest.fn().mockReturnValue(of(stubOntology()));

    TestBed.configureTestingModule({
      providers: [
        OntologyEditService,
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              onto: {
                addCardinalityToResourceClass: addCardinalitySpy,
                getOntology: getOntologySpy,
                canDeleteOntology: jest.fn().mockReturnValue(of({ canDo: true })),
              },
            },
          } as unknown as KnoraApiConnection,
        },
        { provide: NotificationService, useValue: { openSnackBar: jest.fn() } },
        { provide: LocalizationService, useValue: { getCurrentLanguage: () => 'en' } },
        { provide: OntologyService, useValue: { getInPreferedLanguage: () => '' } },
        {
          provide: ProjectPageService,
          useValue: {
            currentProject$: new BehaviorSubject({ id: 'p-1', shortcode: '0001' }),
            ontologies$: new BehaviorSubject<ReadOntology[]>([]),
            currentProject: { shortcode: '0001' },
          },
        },
        { provide: ListApiService, useValue: { listInProject: () => of({ lists: [] }) } },
        { provide: TranslateService, useValue: { instant: (k: string) => k } },
      ],
    });

    service = TestBed.inject(OntologyEditService);
    // Seed _currentOntology so ontologyId / ctx / lastModificationDate resolve.
    // Using bracket access avoids exposing private state in the public API.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, dot-notation
    (service as any)['_currentOntology'].next(stubOntology());
  });

  describe('happy path', () => {
    beforeEach(() => {
      addCardinalitySpy.mockReturnValue(of({ id: CLASS_IRI } as ResourceClassDefinitionWithAllLanguages));
    });

    it('emits once on success and reloads the ontology', done => {
      const emissions: unknown[] = [];
      service.assignPropertyToClass$(PROP_IRI, stubClassDefinition([1, 2])).subscribe({
        next: v => emissions.push(v),
        complete: () => {
          expect(emissions).toEqual([undefined]);
          expect(addCardinalitySpy).toHaveBeenCalledTimes(1);
          expect(getOntologySpy).toHaveBeenCalledWith(ONTO_IRI, true);
          done();
        },
      });
    });

    it('computes guiOrder as max(existing) + 1', done => {
      service.assignPropertyToClass$(PROP_IRI, stubClassDefinition([1, 5, 3])).subscribe({
        complete: () => {
          const sent = addCardinalitySpy.mock.calls[0][0];
          // UpdateOntology<UpdateResourceClassCardinality> — inspect the wrapped cardinality.
          const cardinalities = sent.entity.cardinalities;
          expect(cardinalities).toHaveLength(1);
          expect(cardinalities[0].propertyIndex).toBe(PROP_IRI);
          expect(cardinalities[0].guiOrder).toBe(6);
          expect(cardinalities[0].cardinality).toBe(1);
          done();
        },
      });
    });

    it('falls back to guiOrder = 1 when the class has no properties', done => {
      service.assignPropertyToClass$(PROP_IRI, stubClassDefinition([])).subscribe({
        complete: () => {
          const sent = addCardinalitySpy.mock.calls[0][0];
          expect(sent.entity.cardinalities[0].guiOrder).toBe(1);
          done();
        },
      });
    });

    it('resets _isTransacting to false after success', done => {
      service.assignPropertyToClass$(PROP_IRI, stubClassDefinition([1])).subscribe({
        complete: () => {
          expect(service.isTransacting).toBe(false);
          done();
        },
      });
    });
  });

  describe('error path', () => {
    it('propagates the error to the subscriber', done => {
      const boom = new Error('boom');
      addCardinalitySpy.mockReturnValue(throwError(() => boom));

      service.assignPropertyToClass$(PROP_IRI, stubClassDefinition([1])).subscribe({
        next: () => done.fail('expected error'),
        error: err => {
          expect(err).toBe(boom);
          done();
        },
      });
    });

    it('resets _isTransacting to false even on error', done => {
      addCardinalitySpy.mockReturnValue(throwError(() => new Error('boom')));

      service.assignPropertyToClass$(PROP_IRI, stubClassDefinition([1])).subscribe({
        error: () => {
          // `finalize` runs as part of subscription teardown; checking on the
          // next microtask guarantees the reset has flushed.
          queueMicrotask(() => {
            expect(service.isTransacting).toBe(false);
            done();
          });
        },
      });
    });

    it('does not reload the ontology when addCardinality fails', done => {
      addCardinalitySpy.mockReturnValue(throwError(() => new Error('boom')));

      service.assignPropertyToClass$(PROP_IRI, stubClassDefinition([1])).subscribe({
        error: () => {
          expect(getOntologySpy).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
