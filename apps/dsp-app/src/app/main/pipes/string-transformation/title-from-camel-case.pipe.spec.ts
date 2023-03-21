import { TitleFromCamelCasePipe } from './title-from-camel-case.pipe';
import { waitForAsync, TestBed } from '@angular/core/testing';

describe('TitleFromCamelCasePipe', () => {
    let pipe: TitleFromCamelCasePipe;
    let textToBeTransformed: string;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({});

        pipe = new TitleFromCamelCasePipe();

        textToBeTransformed = 'HowTheCamelGotItsHump';
    }));

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should return "How The Camel Got Its Hump"', () => {
        const transformedText = pipe.transform(textToBeTransformed);
        expect(transformedText).toEqual('How The Camel Got Its Hump');
    });
});
