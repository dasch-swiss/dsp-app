import { waitForAsync, TestBed } from '@angular/core/testing';
import { StringLiteral } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { Session, SessionService } from '@dasch-swiss/vre/shared/app-session';
import { StringifyStringLiteralPipe } from './stringify-string-literal.pipe';

describe('StringifyStringLiteralPipe', () => {
  let pipe: StringifyStringLiteralPipe;
  let labels: StringLiteral[];
  let service: SessionService;

  beforeEach(waitForAsync(() => {
    // empty spy object to use in the providers for the SessionService injection
    const dspConnSpy = {};

    TestBed.configureTestingModule({
      providers: [
        {
          provide: DspApiConnectionToken,
          useValue: dspConnSpy,
        },
        SessionService,
      ],
    });

    service = TestBed.inject(SessionService);
    pipe = new StringifyStringLiteralPipe(service);
  }));

  beforeEach(() => {
    labels = [
      {
        value: 'Welt',
        language: 'de',
      },
      {
        value: 'World',
        language: 'en',
      },
      {
        value: 'Monde',
        language: 'fr',
      },
      {
        value: 'Mondo',
        language: 'it',
      },
    ];
  });

  // mock localStorage
  beforeEach(() => {
    let store = {};

    spyOn(localStorage, 'getItem').and.callFake((key: string): string => store[key] || null);
    spyOn(localStorage, 'removeItem').and.callFake((key: string): void => {
      delete store[key];
    });
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string): void => {
      store[key] = value;
    });
    spyOn(localStorage, 'clear').and.callFake(() => {
      store = {};
    });
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return a string in English', () => {
    const session: Session = {
      id: 12345,
      user: {
        name: 'username',
        jwt: 'myToken',
        lang: 'en',
        sysAdmin: false,
        projectAdmin: [],
      },
    };

    // store session in localStorage
    localStorage.setItem('session', JSON.stringify(session));

    // since no argument is provided, the pipe should use the language stored in the session
    const myString = pipe.transform(labels);
    expect(myString).toEqual('World');

    // remove session
    localStorage.removeItem('session');
  });

  it('should return a string in German', () => {
    const session: Session = {
      id: 12345,
      user: {
        name: 'username',
        jwt: 'myToken',
        lang: 'de',
        sysAdmin: false,
        projectAdmin: [],
      },
    };

    // store session in localStorage
    localStorage.setItem('session', JSON.stringify(session));

    // since no argument is provided, the pipe should use the language stored in the session
    const myString = pipe.transform(labels);
    expect(myString).toEqual('Welt');

    // remove session
    localStorage.removeItem('session');
  });

  it('should return a string with all languages of which the StringLiteral array contains', () => {
    // since no argument is provided, the pipe should use the language stored in the session
    const myString = pipe.transform(labels, 'all');
    expect(myString).toEqual('Welt (de) / World (en) / Monde (fr) / Mondo (it)');
  });
});
