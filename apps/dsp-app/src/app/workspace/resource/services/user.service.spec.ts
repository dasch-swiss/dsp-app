import { waitForAsync, TestBed } from '@angular/core/testing';
import { MockUsers } from '@dasch-swiss/dsp-js';
import { UserService } from './user.service';
import { of } from 'rxjs';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';

describe('UserService', () => {
    let service: UserService;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: {},
                },
            ],
        });

        service = TestBed.inject(UserService);
    }));

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(service['_userCache']).toBeDefined();
    });

    it('should get a user', (done) => {
        const userCacheSpy = spyOn(
            service['_userCache'],
            'getUser'
        ).and.callFake(() => {
            const user = MockUsers.mockUser();

            return of(user.body);
        });

        service.getUser('http://rdfh.ch/users/root').subscribe((user) => {
            expect(user.user.id).toEqual('http://rdfh.ch/users/root');
            expect(userCacheSpy).toHaveBeenCalledTimes(1);
            expect(userCacheSpy).toHaveBeenCalledWith(
                'http://rdfh.ch/users/root'
            );
            done();
        });
    });
});
