import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { of } from 'rxjs';
import { AppInitService } from 'src/app/app-init.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';

import { RepresentationService } from './representation.service';

const appInitSpy = {
    dspAppConfig: {
        iriBase: 'http://rdfh.ch'
    }
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
                MatDialogModule
            ],
            providers: [
                AppInitService,
                {
                    provide: DspApiConnectionToken,
                    useValue: appInitSpy
                },
                {
                    provide: HttpClient,
                    useValue: httpClientSpyObj
                }
            ]
        });

        service = TestBed.inject(RepresentationService);
        expect(service).toBeTruthy();
    });

    it('should return the file info', () => {
        const httpClientSpy = TestBed.inject(HttpClient);
        (httpClientSpy as jasmine.SpyObj<HttpClient>).get.and.returnValue(of(knoraJson));

        service.getFileInfo('http://0.0.0.0:1024/1111/7vpVORXYoFV-FkzJ5Fg4bkU.mp3/file').subscribe(
            data => expect(data).toEqual(knoraJson)
        );
    });
});
