import { FormattedBooleanPipe } from './formatted-boolean.pipe';

describe('FormattedBooleanPipe', () => {
    let pipe: FormattedBooleanPipe;

    beforeEach(() => {
        pipe = new FormattedBooleanPipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should return "true" (no format specified)', () => {
        const myBoolean = true;

        const convertedBoolean = pipe.transform(myBoolean);

        expect(convertedBoolean).toEqual('true');
    });

    it('should return "false" (format specified)', () => {
        const myBoolean = false;

        const convertedBoolean = pipe.transform(myBoolean, 'true-false');

        expect(convertedBoolean).toEqual('false');
    });

    it('should return "yes"', () => {
        const myBoolean = true;

        const convertedBoolean = pipe.transform(myBoolean, 'yes-no');

        expect(convertedBoolean).toEqual('yes');
    });

    it('should return "off"', () => {
        const myBoolean = false;

        const convertedBoolean = pipe.transform(myBoolean, 'on-off');

        expect(convertedBoolean).toEqual('off');
    });
});
