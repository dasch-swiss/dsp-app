import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KnoraApiConnection, ListNodeV2WithAllLanguages } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { of } from 'rxjs';
import { ListCacheService } from './list-cache.service';
import { PropertyValueService } from './property-value.service';

describe('PropertyValueService', () => {
  const rootIri = 'http://rdfh.ch/lists/0001/treeList';
  let service: PropertyValueService;
  let getListSpy: jest.Mock;

  const makeList = (): ListNodeV2WithAllLanguages => {
    const node = new ListNodeV2WithAllLanguages();
    node.id = rootIri;
    return node;
  };

  beforeEach(() => {
    getListSpy = jest.fn(() => of(makeList()));

    const dspApiConnectionStub = { v2: { list: { getListWithAllLanguages: getListSpy } } };

    TestBed.configureTestingModule({
      providers: [
        PropertyValueService,
        { provide: DspApiConnectionToken, useValue: dspApiConnectionStub as unknown as KnoraApiConnection },
      ],
    });

    service = TestBed.inject(PropertyValueService);
  });

  describe('getList$', () => {
    it('fetches the list once and shares it across subscribers for the same root', () => {
      service.getList$(rootIri).subscribe();
      service.getList$(rootIri).subscribe();
      service.getList$(rootIri).subscribe();

      expect(getListSpy).toHaveBeenCalledTimes(1);
      expect(getListSpy).toHaveBeenCalledWith(rootIri);
    });

    it('fetches separately for different roots', () => {
      const otherRoot = 'http://rdfh.ch/lists/0001/otherTreeList';
      service.getList$(rootIri).subscribe();
      service.getList$(otherRoot).subscribe();

      expect(getListSpy).toHaveBeenCalledTimes(2);
    });

    it('emits the fetched list', done => {
      service.getList$(rootIri).subscribe(list => {
        expect(list.id).toEqual(rootIri);
        done();
      });
    });

    it('shares one fetch across services when an ancestor provides a ListCacheService', () => {
      const parent = TestBed.inject(Injector);
      const tableInjector = Injector.create({ providers: [ListCacheService], parent });
      const cellService = () =>
        Injector.create({ providers: [PropertyValueService], parent: tableInjector }).get(PropertyValueService);

      cellService().getList$(rootIri).subscribe();
      cellService().getList$(rootIri).subscribe();
      cellService().getList$(rootIri).subscribe();

      expect(getListSpy).toHaveBeenCalledTimes(1);
    });

    it('keeps a cache per service when no ancestor provides one', () => {
      const parent = TestBed.inject(Injector);
      const ownService = () => Injector.create({ providers: [PropertyValueService], parent }).get(PropertyValueService);

      ownService().getList$(rootIri).subscribe();
      ownService().getList$(rootIri).subscribe();

      expect(getListSpy).toHaveBeenCalledTimes(2);
    });
  });
});
