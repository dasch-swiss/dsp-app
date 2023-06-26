import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { FileRepresentation } from '../file-representation';

import { ArchiveComponent } from './archive.component';
import { RepresentationService } from '../representation.service';
import { of } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { map } from 'rxjs/operators';

const archiveFileValue = {
    arkUrl: 'http://0.0.0.0:3336/ark:/72163/1/0123/6c=f69h6Ss6GXPME565EqAS/dDHcFHlwQ9K46255QfUGrQ8',
    attachedToUser: 'http://rdfh.ch/users/root',
    fileUrl: 'http://0.0.0.0:1024/0123/Eu71soNXOAL-DVweVgODkFh.zip/file',
    filename: 'Eu71soNXOAL-DVweVgODkFh.zip',
    hasPermissions:
        'CR knora-admin:ProjectAdmin|D knora-admin:ProjectAdmin|M knora-admin:ProjectAdmin|V knora-admin:ProjectAdmin|RV knora-admin:ProjectAdmin',
    id: 'http://rdfh.ch/0123/6c-f69h6Ss6GXPME565EqA/values/dDHcFHlwQ9K46255QfUGrQ',
    property: 'http://api.knora.org/ontology/knora-api/v2#hasArchiveFileValue',
    propertyComment: 'Connects a Representation to a zip archive',
    propertyLabel: 'hat Zip',
    strval: 'http://0.0.0.0:1024/0123/Eu71soNXOAL-DVweVgODkFh.zip/file',
    type: 'http://api.knora.org/ontology/knora-api/v2#ArchiveFileValue',
    userHasPermission: 'CR',
    uuid: 'dDHcFHlwQ9K46255QfUGrQ',
    valueCreationDate: '2021-12-03T09:59:46.609839Z',
    valueHasComment: undefined,
    versionArkUrl:
        'http://0.0.0.0:3336/ark:/72163/1/0123/6c=f69h6Ss6GXPME565EqAS/dDHcFHlwQ9K46255QfUGrQ8.20211203T095946609839Z',
};

const knoraJson = `{
    "@context": "http://sipi.io/api/file/3/context.json",
    "id": "http://iiif.test.dasch.swiss/0123/FeWLDZ4a0Tw-BBECkdbIVUW.zip",
    "checksumOriginal": "24f8bdd4cb52413e28480bab928ad00747392a17837a6ce505c00ad9927d6109",
    "checksumDerivative": "24f8bdd4cb52413e28480bab928ad00747392a17837a6ce505c00ad9927d6109",
    "internalMimeType": "application/zip",
    "fileSize": 228,
    "originalFilename": "test.zip"
}`;

const appInitSpy = {
    dspAppConfig: {
        iriBase: 'http://rdfh.ch',
    },
};

@Component({
    template: ` <app-archive [src]="archiveFileRepresentation"> </app-archive>`,
})
class TestHostComponent implements OnInit {
    @ViewChild(ArchiveComponent) archiveComp: ArchiveComponent;

    archiveFileRepresentation: FileRepresentation;

    ngOnInit() {
        this.archiveFileRepresentation = new FileRepresentation(
            archiveFileValue
        );
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

describe('ArchiveComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        const representationServiceSpyObj = jasmine.createSpyObj(
            'RepresentationService',
            ['getFileInfo']
        );

        TestBed.configureTestingModule({
            declarations: [
                ArchiveComponent,
                TestHostComponent,
                MockStatusComponent,
            ],
            imports: [
                MatDialogModule,
                MatSnackBarModule,
                MatMenuModule,
                MatIconModule,
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

        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();
        expect(testHostComponent).toBeTruthy();
    });

    it('should have a file url', () => {
        expect(
            testHostComponent.archiveFileRepresentation.fileValue.fileUrl
        ).toEqual('http://0.0.0.0:1024/0123/Eu71soNXOAL-DVweVgODkFh.zip/file');
    });
});
