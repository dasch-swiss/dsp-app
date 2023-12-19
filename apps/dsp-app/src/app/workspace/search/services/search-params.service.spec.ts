import { TestBed } from '@angular/core/testing';

import {
  GravsearchSearchParams,
  SearchParamsService,
} from './search-params.service';

describe('SearchParamsService', () => {
  let service: SearchParamsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchParamsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false when initialized', () => {
    const searchParams: GravsearchSearchParams = service.getSearchParams();

    expect(searchParams.generateGravsearch(0)).toBeFalsy();
  });

  it('should set the parameters of an advanced search', () => {
    const testMethod1 = () => 'test1';

    service.changeSearchParamsMsg(new GravsearchSearchParams(testMethod1));

    const searchParams: GravsearchSearchParams = service.getSearchParams();

    expect(searchParams.generateGravsearch(0)).toEqual('test1');

    // check if value is still present
    expect(searchParams.generateGravsearch(0)).toEqual('test1');

    const testMethod2 = () => 'test2';

    service.changeSearchParamsMsg(new GravsearchSearchParams(testMethod2));

    const searchParams2: GravsearchSearchParams = service.getSearchParams();

    expect(searchParams2.generateGravsearch(0)).toEqual('test2');

    // check if value is still present
    expect(searchParams2.generateGravsearch(0)).toEqual('test2');
  });
});
