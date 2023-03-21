import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
    let service: NotificationService;
    const mockNotificationService = jasmine.createSpyObj(
        'NotificationService',
        ['openSnackBar']
    );

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: NotificationService,
                    useValue: mockNotificationService,
                },
            ],
        });
        service = TestBed.inject(NotificationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('openSnackBar', () => {
        it('should open the snack bar', () => {
            const arg = 'test';
            mockNotificationService.openSnackBar.and.callThrough();
            service.openSnackBar(arg);
            expect(service.openSnackBar).toHaveBeenCalled();
        });
    });
});
