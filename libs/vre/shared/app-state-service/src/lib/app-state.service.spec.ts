import { TestBed } from '@angular/core/testing';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { ApplicationStateService } from './app-state.service';

describe('ApplicationStateService', () => {
  let service: ApplicationStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
    });

    service = TestBed.inject(ApplicationStateService);
    expect(service).toBeTruthy();

    // reset the state before each test
    service.destroy();
  });

  it('should set a value in the dictionary', () => {
    const user = new ReadUser();
    service.set('user', user);
    expect(service.has('user')).toBeTruthy();
  });

  it('should get a value in the dictionary', () => {
    const user = new ReadUser();
    user.id = '1234';

    service.set('user', user);

    const result$ = service.get('user');

    result$.subscribe(result => {
      expect(result).toMatchObject(user);
    });
  });

  it('should throw an error if the key is not found', () => {
    const result$ = service.get('user_not_found');

    result$.subscribe(
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      error => {
        expect(error).toBeTruthy();
      }
    );
  });

  it('should delete a value in the dictionary', () => {
    const user = new ReadUser();
    user.id = '1234';
    service.set('user', user);

    const user2 = new ReadUser();
    user2.id = '5678';
    service.set('user2', user2);

    service.delete('user');

    expect(service.has('user')).toBeFalsy();
    expect(service.has('user2')).toBeTruthy();
  });

  it('should destroy the dictionary', () => {
    const user = new ReadUser();
    user.id = '1234';
    service.set('user', user);

    const user2 = new ReadUser();
    user2.id = '5678';
    service.set('user2', user2);

    service.destroy();

    expect(service.has('user')).toBeFalsy();
    expect(service.has('user2')).toBeFalsy();
  });
});
