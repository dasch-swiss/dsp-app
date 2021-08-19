import { KnoraDate } from '@dasch-swiss/dsp-js';
import { KnoraDatePipe } from './knoradate.pipe';

describe('KnoradatePipe', () => {
    let pipe: KnoraDatePipe;

    beforeEach(() => {
        pipe = new KnoraDatePipe();
        expect(pipe).toBeTruthy();
    });

    it('should return a date string', () => {
        const date = new KnoraDate('GREGORIAN', 'AD', 1993, 10, 10);

        const convertedDate = pipe.transform(date);

        expect(convertedDate).toEqual('10.10.1993');
    });

    it('should return the correct format for a date with day precision depending on the format provided', () => {
        const date = new KnoraDate('GREGORIAN', 'AD', 1776, 7, 4);

        let convertedDate = pipe.transform(date, 'dd.MM.YYYY');

        expect(convertedDate).toEqual('04.07.1776');

        convertedDate = pipe.transform(date, 'dd-MM-YYYY');

        expect(convertedDate).toEqual('04-07-1776');

        convertedDate = pipe.transform(date, 'MM/dd/YYYY');

        expect(convertedDate).toEqual('07/04/1776');

        // should default to dd.MM.YYYY in the event of an invalid format
        convertedDate = pipe.transform(date, 'invalid format');

        expect(convertedDate).toEqual('04.07.1776');
    });

    it ('should return a string with the desired display options', () => {
        const date = new KnoraDate('GREGORIAN', 'AD', 1776, 7, 4);

        let dateWithDisplayOptions = pipe.transform(date, 'dd.MM.YYYY', 'era');

        expect(dateWithDisplayOptions).toEqual('04.07.1776 AD');

        dateWithDisplayOptions = pipe.transform(date, 'dd.MM.YYYY', 'calendar');

        expect(dateWithDisplayOptions).toEqual('04.07.1776 GREGORIAN');

        dateWithDisplayOptions = pipe.transform(date, 'dd.MM.YYYY', 'all');

        expect(dateWithDisplayOptions).toEqual('04.07.1776 AD GREGORIAN');
    });

    it ('should return a string with the desired display options for a date without era', () => {
        const date = new KnoraDate('ISLAMIC', 'noEra', 1441, 7, 4);

        let dateWithDisplayOptions = pipe.transform(date, 'dd.MM.YYYY', 'era');

        expect(dateWithDisplayOptions).toEqual('04.07.1441');

        dateWithDisplayOptions = pipe.transform(date, 'dd.MM.YYYY', 'calendar');

        expect(dateWithDisplayOptions).toEqual('04.07.1441 ISLAMIC');

        dateWithDisplayOptions = pipe.transform(date, 'dd.MM.YYYY', 'all');

        expect(dateWithDisplayOptions).toEqual('04.07.1441 ISLAMIC');
    });

    it ('should return a string with only the month and the year', () => {
        const date = new KnoraDate('GREGORIAN', 'AD', 1776, 7);

        const convertedDate = pipe.transform(date, 'dd.MM.YYYY');

        expect(convertedDate).toEqual('07.1776');
    });

    it ('should return a string with only the year', () => {
        const date = new KnoraDate('GREGORIAN', 'AD', 1776);

        const convertedDate = pipe.transform(date, 'dd.MM.YYYY');

        expect(convertedDate).toEqual('1776');
    });

    it('should return a number of two digits', () => {
        let num = pipe.leftPadding(7);

        expect(num).toEqual('07');

        num = pipe.leftPadding(12);

        expect(num).toEqual('12');
    });
});
