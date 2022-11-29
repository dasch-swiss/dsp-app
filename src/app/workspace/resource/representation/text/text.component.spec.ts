import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AppInitService } from 'src/app/app-init.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { FileRepresentation } from '../file-representation';

import { TextComponent } from './text.component';
import { MatMenuModule } from '@angular/material/menu';
import { of } from 'rxjs';
import { RepresentationService } from '../representation.service';
import { MatIconModule } from '@angular/material/icon';

const textFileValue = {
    'arkUrl': 'http://0.0.0.0:3336/ark:/72163/1/9876/=wcU1HzYTEKbJCYPybyKmAs/Kp81r_BPTHKa4oSd5iIxXgd',
    'attachedToUser': 'http://rdfh.ch/users/root',
    'fileUrl': 'http://0.0.0.0:1024/9876/Jjic1ixccX7-BUHCAFNlEts.txt/file',
    'filename': 'Jjic1ixccX7-BUHCAFNlEts.txt',
    'hasPermissions': 'CR knora-admin:ProjectAdmin|M knora-admin:ProjectMember',
    'id': 'http://rdfh.ch/9876/-wcU1HzYTEKbJCYPybyKmA/values/95Ny4a1_S6ey5JQZWjf07g',
    'property': 'http://api.knora.org/ontology/knora-api/v2#hasTextFileValue',
    'propertyComment': 'Connects a Representation to a text file',
    'propertyLabel': 'hat Textdatei',
    'strval': 'http://0.0.0.0:1024/9876/Jjic1ixccX7-BUHCAFNlEts.txt/file',
    'type': 'http://api.knora.org/ontology/knora-api/v2#TextFileValue',
    'userHasPermission': 'CR',
    'uuid': 'Kp81r_BPTHKa4oSd5iIxXg',
    'valueCreationDate': '2022-05-25T09:20:19.907631398Z',
    'valueHasComment': undefined,
    'versionArkUrl': 'http://0.0.0.0:3336/ark:/72163/1/9876/=wcU1HzYTEKbJCYPybyKmAs/Kp81r_BPTHKa4oSd5iIxXgd.20220525T092019907631398Z'
};

const knoraJson = `{
    "@context": "http://sipi.io/api/file/3/context.json",
    "id": "http://0.0.0.0:1024/0123/FCRL417WVuy-FW8UJSzohZL.csv",
    "checksumOriginal": "29581dfdcc481f57eefd901094bf115efb9b044202031e594e5571af38f5b2bc",
    "checksumDerivative": "29581dfdcc481f57eefd901094bf115efb9b044202031e594e5571af38f5b2bc",
    "internalMimeType": "text/csv",
    "fileSize": 227,
    "originalFilename": "test.csv"
}`;

const appInitSpy = {
    dspAppConfig: {
        iriBase: 'http://rdfh.ch'
    }
};

@Component({
    template: `
        <app-text [src]="textFileRepresentation">
        </app-text>`
})
class TestHostComponent implements OnInit {

    @ViewChild(TextComponent) textComp: TextComponent;

    textFileRepresentation: FileRepresentation;

    ngOnInit() {

        this.textFileRepresentation = new FileRepresentation(textFileValue);
    }
}

@Component({ selector: 'app-status', template: '' })
class MockStatusComponent {
    @Input() status: number;

    @Input() comment?: string;
    @Input() url?: string;
    @Input() representation?: 'archive' | 'audio' | 'document' | 'still-image' | 'video' | 'text';

    constructor() { }
}

describe('TextComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        const representationServiceSpyObj = jasmine.createSpyObj('RepresentationService', ['getFileInfo', 'doesFileExist']);

        TestBed.configureTestingModule({
            declarations: [
                TextComponent,
                TestHostComponent,
                MockStatusComponent
            ],
            imports: [
                HttpClientTestingModule,
                MatDialogModule,
                MatSnackBarModule,
                MatMenuModule,
                MatIconModule
            ],
            providers: [
                AppInitService,
                {
                    provide: DspApiConnectionToken,
                    useValue: appInitSpy
                },
                {
                    provide: RepresentationService,
                    useValue: representationServiceSpyObj
                }
            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        const representationServiceSpy = TestBed.inject(RepresentationService);
        (representationServiceSpy as jasmine.SpyObj<RepresentationService>).getFileInfo.and.callFake(
            () => of(knoraJson)
        );

        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();
        expect(testHostComponent).toBeTruthy();
    });

    it('should have a file url', () => {
        expect(testHostComponent.textFileRepresentation.fileValue.fileUrl).toEqual('http://0.0.0.0:1024/9876/Jjic1ixccX7-BUHCAFNlEts.txt/file');
    });
});
