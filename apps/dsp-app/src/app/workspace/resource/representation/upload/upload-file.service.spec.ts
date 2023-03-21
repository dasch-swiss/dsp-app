import {
    HttpClientTestingModule,
    HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppInitService } from '@dsp-app/src/app/app-init.service';
import { Session, SessionService } from '@dsp-app/src/app/main/services/session.service';
import { UploadedFileResponse, UploadFileService } from './upload-file.service';

describe('UploadFileService', () => {
    let service: UploadFileService;
    let httpTestingController: HttpTestingController;

    const file = new File(['1'], 'testfile');
    const mockUploadData = new FormData();
    mockUploadData.append('test', file);

    beforeEach(() => {
        const appInitSpy = {
            dspIiifConfig: {
                iiifUrl: 'https://iiif.dasch.swiss',
            },
        };

        const sessionSpy = jasmine.createSpyObj('SessionService', [
            'getSession',
        ]);

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                { provide: AppInitService, useValue: appInitSpy },
                { provide: SessionService, useValue: sessionSpy },
            ],
        });

        service = TestBed.inject(UploadFileService);
        httpTestingController = TestBed.inject(HttpTestingController);

        const sessionServiceSpy = TestBed.inject(
            SessionService
        ) as jasmine.SpyObj<SessionService>;

        sessionServiceSpy.getSession.and.callFake(() => {
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

            return session;
        });
    });

    afterEach(() => {
        // after every test, assert that there are no more pending requests.
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return expected file response on upload', (done) => {
        const expectedResponse: UploadedFileResponse = {
            uploadedFiles: [
                {
                    fileType: 'image',
                    internalFilename: '8R0cJE3TSgB-BssuQyeW1rE.jp2',
                    originalFilename: 'Screenshot 2020-10-28 at 14.16.34.png',
                    temporaryUrl:
                        'http://sipi:1024/tmp/8R0cJE3TSgB-BssuQyeW1rE.jp2',
                },
            ],
        };

        service.upload(mockUploadData).subscribe((res) => {
            expect(res.uploadedFiles.length).toEqual(1);
            expect(res.uploadedFiles[0].internalFilename).toEqual(
                '8R0cJE3TSgB-BssuQyeW1rE.jp2'
            );
            done();
        });

        const httpRequest = httpTestingController.expectOne(
            'https://iiif.dasch.swiss/upload?token=myToken'
        );

        expect(httpRequest.request.method).toEqual('POST');

        const expectedFormData = new FormData();
        const mockFile = new File(['1'], 'testfile', { type: 'image/jpeg' });

        expectedFormData.append(mockFile.name, mockFile);
        expect(httpRequest.request.body).toEqual(expectedFormData);

        httpRequest.flush(expectedResponse);
    });
});
