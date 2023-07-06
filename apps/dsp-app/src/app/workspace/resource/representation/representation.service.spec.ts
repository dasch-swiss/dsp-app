import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';

import { RepresentationService } from './representation.service';
import { MockProvider } from 'ng-mocks';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';

const appInitSpy = {
    dspAppConfig: {
        iriBase: 'http://rdfh.ch',
    },
};

const knoraJson = `{
    "@context": "http://sipi.io/api/file/3/context.json",
    "id": "http://iiif.test.dasch.swiss/0123/2ESjhjJnQzL-GTnokcfm5bV.mp3",
    "checksumOriginal": "9a27c32bd80a0ab73dc5d4a3dfb655b78232508b1c60978d03ccfcdc28288c24",
    "checksumDerivative": "9a27c32bd80a0ab73dc5d4a3dfb655b78232508b1c60978d03ccfcdc28288c24",
    "internalMimeType": "audio/mpeg",
    "fileSize": 1693405,
    "originalFilename": "sample.mp3"
}`;

describe('RepresentationService', () => {
    const httpClientSpyObj = jasmine.createSpyObj('HttpClient', ['get']);
    let service: RepresentationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                MatSnackBarModule,
                MatDialogModule,
            ],
            providers: [
                AppConfigService,
                MockProvider(AppLoggingService),
                {
                    provide: DspApiConnectionToken,
                    useValue: appInitSpy,
                },
                {
                    provide: HttpClient,
                    useValue: httpClientSpyObj,
                },
            ],
        });

        service = TestBed.inject(RepresentationService);
        expect(service).toBeTruthy();
    });

    it('should return the file info', () => {
        const httpClientSpy = TestBed.inject(HttpClient);
        (httpClientSpy as jasmine.SpyObj<HttpClient>).get.and.returnValue(
            of(knoraJson)
        );

        service
            .getFileInfo(
                'http://0.0.0.0:1024/1111/7vpVORXYoFV-FkzJ5Fg4bkU.mp3/file'
            )
            .subscribe((data) =>
                expect(data as unknown as string).toEqual(knoraJson)
            );
    });
});
