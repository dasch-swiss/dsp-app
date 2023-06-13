import { CdkCopyToClipboard } from '@angular/cdk/clipboard';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatLegacySliderModule as MatSliderModule } from '@angular/material/legacy-slider';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { of } from 'rxjs';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { FileRepresentation } from '../file-representation';
import { RepresentationService } from '../representation.service';
import { AudioComponent } from './audio.component';
import { map } from 'rxjs/operators';

// --> TODO: get test data from dsp-js or from dsp-api test data
const audioFileValue = {
    type: 'http://api.knora.org/ontology/knora-api/v2#AudioFileValue',
    id: 'http://rdfh.ch/1111/hgWTQVPRRTSI87PnlRmUxg/values/VKiMFffXQ9SzWeeCVrk8gw',
    attachedToUser: 'http://rdfh.ch/users/Iscj52QaSk-LNurRU6z3Hw',
    arkUrl: 'http://0.0.0.0:3336/ark:/72163/1/1111/hgWTQVPRRTSI87PnlRmUxgI/RVy0rG=vTe=vU=QW6zDToAY',
    versionArkUrl:
        'http://0.0.0.0:3336/ark:/72163/1/1111/hgWTQVPRRTSI87PnlRmUxgI/RVy0rG=vTe=vU=QW6zDToAY.20210719T074023813773Z',
    valueCreationDate: '2021-07-19T07:40:23.813773Z',
    hasPermissions:
        'CR knora-admin:ProjectAdmin|D knora-admin:ProjectAdmin|M knora-admin:ProjectAdmin|V knora-admin:ProjectAdmin|RV knora-admin:ProjectAdmin',
    userHasPermission: 'CR',
    uuid: 'RVy0rG-vTe-vU-QW6zDToA',
    filename: '7vpVORXYoFV-FkzJ5Fg4bkU.mp3',
    fileUrl: 'http://0.0.0.0:1024/1111/7vpVORXYoFV-FkzJ5Fg4bkU.mp3/file',
    duration: 0,
    strval: 'http://0.0.0.0:1024/1111/7vpVORXYoFV-FkzJ5Fg4bkU.mp3/file',
    property: 'http://api.knora.org/ontology/knora-api/v2#hasAudioFileValue',
    propertyLabel: 'hat Audiodatei',
    propertyComment: 'Connects a Representation to an audio file',
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

const appInitSpy = {
    dspAppConfig: {
        iriBase: 'http://rdfh.ch',
    },
};

@Component({
    template: ` <app-audio [src]="audioFileRepresentation"> </app-audio>`,
})
class TestHostComponent implements OnInit {
    @ViewChild(AudioComponent) audioPlayerComp: AudioComponent;

    audioFileRepresentation: FileRepresentation;

    ngOnInit() {
        this.audioFileRepresentation = new FileRepresentation(audioFileValue);
    }
}

@Component({ selector: 'app-status', template: '' })
class MockStatusComponent {
    @Input() status: number;

    @Input() comment?: string;
    @Input() url?: string;
    @Input() representation?:
        | 'archive'
        | 'audio'
        | 'document'
        | 'still-image'
        | 'video'
        | 'text';

    constructor() {}
}

describe('AudioComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        const representationServiceSpyObj = jasmine.createSpyObj(
            'RepresentationService',
            ['getFileInfo', 'doesFileExist']
        );
        // const sanitizerSpyObj = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustUrl']);

        await TestBed.configureTestingModule({
            declarations: [
                AudioComponent,
                TestHostComponent,
                MockStatusComponent,
                CdkCopyToClipboard,
            ],
            imports: [
                MatDialogModule,
                MatSnackBarModule,
                MatMenuModule,
                MatSliderModule,
                MatIconModule,
                BrowserModule,
            ],
            providers: [
                AppConfigService,
                {
                    provide: DspApiConnectionToken,
                    useValue: appInitSpy,
                },
                {
                    provide: RepresentationService,
                    useValue: representationServiceSpyObj,
                },
                // {
                //     provide: DomSanitizer,
                //     useValue: {
                //         sanitize: (ctx: any, val: string) => val,
                //         bypassSecurityTrustUrl: (val: string) => val,
                //       }
                // }
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        const representationServiceSpy = TestBed.inject(RepresentationService);
        (
            representationServiceSpy as jasmine.SpyObj<RepresentationService>
        ).getFileInfo.and.callFake(() =>
            of(knoraJson).pipe(map((response: any) => response as object))
        );

        (
            representationServiceSpy as jasmine.SpyObj<RepresentationService>
        ).doesFileExist.and.callFake(() => true);

        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();
        expect(testHostComponent).toBeTruthy();
    });

    it('should have a file url', () => {
        expect(
            testHostComponent.audioFileRepresentation.fileValue.fileUrl
        ).toEqual('http://0.0.0.0:1024/1111/7vpVORXYoFV-FkzJ5Fg4bkU.mp3/file');
    });
});
