import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
    Component,
    DebugElement,
    Input,
    OnInit,
    ViewChild,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { By } from '@angular/platform-browser';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { of } from 'rxjs';
import { AppInitService } from '@dsp-app/src/app/app-init.service';
import { DspApiConnectionToken } from '@dsp-app/src/app/main/declarations/dsp-api-tokens';
import { FileRepresentation } from '../file-representation';
import { RepresentationService } from '../representation.service';
import { DocumentComponent } from './document.component';
import { map } from "rxjs/operators";

const documentPdfFileValue = {
    type: 'http://api.knora.org/ontology/knora-api/v2#DocumentFileValue',
    id: 'http://rdfh.ch/1111/ay_F18DrTHeJ4zKuTt8Qzw/values/uY_qTEqVSBOW3c2vyeGXQg',
    attachedToUser: 'http://rdfh.ch/users/Iscj52QaSk-LNurRU6z3Hw',
    arkUrl: 'http://0.0.0.0:3336/ark:/72163/1/1111/ay_F18DrTHeJ4zKuTt8Qzws/lRExhaYnQZuWVspAnbrjAQO',
    versionArkUrl:
        'http://0.0.0.0:3336/ark:/72163/1/1111/ay_F18DrTHeJ4zKuTt8Qzws/lRExhaYnQZuWVspAnbrjAQO.20210716T062258456728Z',
    valueCreationDate: '2021-07-16T06:22:58.456728Z',
    hasPermissions:
        'CR knora-admin:ProjectAdmin|D knora-admin:ProjectAdmin|M knora-admin:ProjectAdmin|V knora-admin:ProjectAdmin|RV knora-admin:ProjectAdmin',
    userHasPermission: 'CR',
    uuid: 'lRExhaYnQZuWVspAnbrjAQ',
    filename: 'Bf9iaid15df-EOrcDcZEtfk.pdf',
    fileUrl: 'http://0.0.0.0:1024/1111/Bf9iaid15df-EOrcDcZEtfk.pdf/file',
    dimX: 2550,
    dimY: 3300,
    pageCount: 3,
    strval: 'http://0.0.0.0:1024/1111/Bf9iaid15df-EOrcDcZEtfk.pdf/file',
    property: 'http://api.knora.org/ontology/knora-api/v2#hasDocumentFileValue',
    propertyLabel: 'hat Dokument',
    propertyComment: 'Connects a Representation to a document',
};

const documentPptFileValue = {
    type: 'http://api.knora.org/ontology/knora-api/v2#DocumentFileValue',
    id: 'http://rdfh.ch/1111/ay_F18DrTHeJ4zKuTt8Qzw/values/uY_qTEqVSBOW3c2vyeGXQg',
    attachedToUser: 'http://rdfh.ch/users/Iscj52QaSk-LNurRU6z3Hw',
    arkUrl: 'http://0.0.0.0:3336/ark:/72163/1/1111/ay_F18DrTHeJ4zKuTt8Qzws/lRExhaYnQZuWVspAnbrjAQO',
    versionArkUrl:
        'http://0.0.0.0:3336/ark:/72163/1/1111/ay_F18DrTHeJ4zKuTt8Qzws/lRExhaYnQZuWVspAnbrjAQO.20210716T062258456728Z',
    valueCreationDate: '2021-07-16T06:22:58.456728Z',
    hasPermissions:
        'CR knora-admin:ProjectAdmin|D knora-admin:ProjectAdmin|M knora-admin:ProjectAdmin|V knora-admin:ProjectAdmin|RV knora-admin:ProjectAdmin',
    userHasPermission: 'CR',
    uuid: 'lRExhaYnQZuWVspAnbrjAQ',
    filename: 'Bf9iaid15df-EOrcDcZEtfk.ppt',
    fileUrl: 'http://0.0.0.0:1024/1111/Bf9iaid15df-EOrcDcZEtfk.ppt/file',
    strval: 'http://0.0.0.0:1024/1111/Bf9iaid15df-EOrcDcZEtfk.ppt/file',
    property: 'http://api.knora.org/ontology/knora-api/v2#hasDocumentFileValue',
    propertyLabel: 'hat Dokument',
    propertyComment: 'Connects a Representation to a document',
};

const knoraJsonPdf = `{
    "@context": "http://sipi.io/api/file/3/context.json",
    "id": "http://iiif.test.dasch.swiss/0123/8IaEvWaRzum-FM8ewNYChGo.pdf",
    "checksumOriginal": "3df79d34abbca99308e79cb94461c1893582604d68329a41fd4bec1885e6adb4",
    "checksumDerivative": "3df79d34abbca99308e79cb94461c1893582604d68329a41fd4bec1885e6adb4",
    "width": 2479,
    "height": 3508,
    "numpages": 1,
    "internalMimeType": "application/pdf",
    "originalMimeType": "application/pdf",
    "originalFilename": "test.pdf"
}`;

const knoraJsonPpt = `{
    "@context": "http://sipi.io/api/file/3/context.json",
   "id": "http://iiif.test.dasch.swiss/0123/Ji1DvXdU5hG-GKjsOtfDbIg.ppt",
   "checksumOriginal": "7cf2016a0742cc13686028a6553b49260a76404e43c4a56657af99d87e636e69",
   "checksumDerivative": "7cf2016a0742cc13686028a6553b49260a76404e43c4a56657af99d87e636e69",
   "internalMimeType": "application/vnd.ms-powerpoint",
   "fileSize": 2863616,
   "originalFilename": "test.ppt"
}`;

const appInitSpy = {
    dspAppConfig: {
        iriBase: 'http://rdfh.ch',
    },
};

/**
 * test host component with a pdf document
 */
@Component({
    template: ` <app-document [src]="documentFileRepresentation">
    </app-document>`,
})
class TestPdfDocumentHostComponent implements OnInit {
    @ViewChild(DocumentComponent) documentComp: DocumentComponent;

    documentFileRepresentation: FileRepresentation;

    ngOnInit() {
        this.documentFileRepresentation = new FileRepresentation(
            documentPdfFileValue
        );
    }
}

/**
 * test host component with a ppt document
 */
@Component({
    template: ` <app-document [src]="documentFileRepresentation">
    </app-document>`,
})
class TestPptDocumentHostComponent implements OnInit {
    @ViewChild(DocumentComponent) documentComp: DocumentComponent;

    documentFileRepresentation: FileRepresentation;

    ngOnInit() {
        this.documentFileRepresentation = new FileRepresentation(
            documentPptFileValue
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

describe('DocumentComponent', () => {
    beforeEach(async () => {
        const representationServiceSpyObj = jasmine.createSpyObj(
            'RepresentationService',
            ['getFileInfo', 'doesFileExist']
        );

        await TestBed.configureTestingModule({
            declarations: [
                DocumentComponent,
                TestPdfDocumentHostComponent,
                TestPptDocumentHostComponent,
                MockStatusComponent,
            ],
            imports: [
                HttpClientTestingModule,
                MatButtonModule,
                MatDialogModule,
                MatIconModule,
                MatMenuModule,
                MatSnackBarModule,
                PdfViewerModule,
            ],
            providers: [
                AppInitService,
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

    describe('pdf viewer', () => {
        let testHostComponent: TestPdfDocumentHostComponent;
        let testHostFixture: ComponentFixture<TestPdfDocumentHostComponent>;
        let documentComponentDe: DebugElement;

        beforeEach(() => {
            const representationServiceSpy = TestBed.inject(
                RepresentationService
            );
            (
                representationServiceSpy as jasmine.SpyObj<RepresentationService>
            ).getFileInfo.and.callFake(() => of(knoraJsonPdf).pipe(map((response: any) => response as object)));

            testHostFixture = TestBed.createComponent(
                TestPdfDocumentHostComponent
            );
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            const hostCompDe = testHostFixture.debugElement;
            documentComponentDe = hostCompDe.query(
                By.directive(DocumentComponent)
            );

            expect(testHostComponent).toBeTruthy();
        });

        it('should show the pdf viewer if the document is a pdf', () => {
            const pdfDebugElement = documentComponentDe.query(
                By.css('.pdf-viewer')
            );
            expect(pdfDebugElement).toBeTruthy();

            // should not show the default document viewer if the pdf viewer is shown
            const fileRepresentationDebugElement = documentComponentDe.query(
                By.css('.file-representation')
            );
            expect(fileRepresentationDebugElement).toBeFalsy();
        });
    });

    describe('default document viewer', () => {
        let testHostComponent: TestPptDocumentHostComponent;
        let testHostFixture: ComponentFixture<TestPptDocumentHostComponent>;
        let documentComponentDe: DebugElement;

        beforeEach(() => {
            const representationServiceSpy = TestBed.inject(
                RepresentationService
            );
            (
                representationServiceSpy as jasmine.SpyObj<RepresentationService>
            ).getFileInfo.and.callFake(() => of(knoraJsonPpt).pipe(map((response: any) => response as object)));

            testHostFixture = TestBed.createComponent(
                TestPptDocumentHostComponent
            );
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            const hostCompDe = testHostFixture.debugElement;
            documentComponentDe = hostCompDe.query(
                By.directive(DocumentComponent)
            );

            expect(testHostComponent).toBeTruthy();
        });

        it('should show the default document viewer if the document is not a pdf', () => {
            const fileRepresentationDebugElement = documentComponentDe.query(
                By.css('.file-representation')
            );
            expect(fileRepresentationDebugElement).toBeTruthy();

            // should not show the pdf viewer if the default document viewer is shown
            const pdfDebugElement = documentComponentDe.query(
                By.css('.pdf-viewer')
            );
            expect(pdfDebugElement).toBeFalsy();
        });
    });
});
