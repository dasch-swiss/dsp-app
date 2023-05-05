import { TestBed } from '@angular/core/testing';

import {
    AdvancedSearchParams,
    AdvancedSearchParamsService,
} from './advanced-search-params.service';

describe('SearchParamsService', () => {
    let service: AdvancedSearchParamsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AdvancedSearchParamsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return false when initialized', () => {
        const searchParams: AdvancedSearchParams = service.getSearchParams();

        expect(searchParams.generateGravsearch(0)).toBeFalsy();
    });

    it('should set the parameters of an advanced search', () => {
        const testMethod1 = () => 'test1';

        service.changeSearchParamsMsg(new AdvancedSearchParams(testMethod1));

        const searchParams: AdvancedSearchParams = service.getSearchParams();

        expect(searchParams.generateGravsearch(0)).toEqual('test1');

        // check if value is still present
        expect(searchParams.generateGravsearch(0)).toEqual('test1');

        const testMethod2 = () => 'test2';

        service.changeSearchParamsMsg(new AdvancedSearchParams(testMethod2));

        const searchParams2: AdvancedSearchParams = service.getSearchParams();

        expect(searchParams2.generateGravsearch(0)).toEqual('test2');

        // check if value is still present
        expect(searchParams2.generateGravsearch(0)).toEqual('test2');
    });
});
