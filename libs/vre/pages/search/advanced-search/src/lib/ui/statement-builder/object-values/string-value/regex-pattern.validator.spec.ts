import { FormControl } from '@angular/forms';
import { regexPatternValidator } from './regex-pattern.validator';

describe('regexPatternValidator (DEV-7441)', () => {
  const validator = regexPatternValidator();
  const validate = (value: string | null) => validator(new FormControl(value));

  it.each([null, ''])('leaves an empty value to Validators.required (%p)', value => {
    expect(validate(value)).toBeNull();
  });

  // `*MAL*` is the prod case: a glob wildcard, which dsp-api rejects with "Dangling meta character '*'".
  it.each(['*MAL*', '+foo', 'foo(', 'foo)', '[abc', 'a{2,1}', 'foo\\'])('rejects %p', pattern => {
    expect(validate(pattern)).toEqual({ invalidRegex: true });
  });

  it.each(['.*MAL.*', 'MAL', '^Mal', 'foo|bar', '\\*MAL\\*', '[a-z]+', '(?:ab)+', 'a{2}'])('accepts %p', pattern => {
    expect(validate(pattern)).toBeNull();
  });

  // Valid for java.util.regex but rejected by JavaScript's RegExp: left to dsp-api instead of blocked.
  it.each(['(?i)mal', '(?-i)Mal', '(?>ab)c', 'a*+', 'a++b', 'a{2}+'])(
    'leaves Java-only syntax %p to dsp-api',
    pattern => {
      expect(validate(pattern)).toBeNull();
    }
  );
});
