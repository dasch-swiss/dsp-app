import { TimePipe } from './time.pipe';

describe('TimePipe', () => {
    let pipe = new TimePipe();

    beforeEach(() => {
        pipe = new TimePipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should convert 123 seconds into 2 minutes and 3 seconds', () => {
        const seconds = 123;
        const time = pipe.transform(seconds);
        expect(time).toEqual('02:03');
    });

    it('should convert 12342 seconds into 3 hours 25 minutes and 42 seconds', () => {
        const seconds = 12342;
        const time = pipe.transform(seconds);
        expect(time).toEqual('03:25:42');
    });
});
