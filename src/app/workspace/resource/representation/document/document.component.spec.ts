import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, DebugElement, Input, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { AppInitService } from 'src/app/app-init.service';
import { DspApiConfigToken, DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { TestConfig } from 'test.config';
import { FileRepresentation } from '../file-representation';
import { DocumentComponent } from './document.component';

const documentPdfFileValue = {
    'type': 'http://api.knora.org/ontology/knora-api/v2#DocumentFileValue',
    'id': 'http://rdfh.ch/1111/ay_F18DrTHeJ4zKuTt8Qzw/values/uY_qTEqVSBOW3c2vyeGXQg',
    'attachedToUser': 'http://rdfh.ch/users/Iscj52QaSk-LNurRU6z3Hw',
    'arkUrl': 'http://0.0.0.0:3336/ark:/72163/1/1111/ay_F18DrTHeJ4zKuTt8Qzws/lRExhaYnQZuWVspAnbrjAQO',
    'versionArkUrl': 'http://0.0.0.0:3336/ark:/72163/1/1111/ay_F18DrTHeJ4zKuTt8Qzws/lRExhaYnQZuWVspAnbrjAQO.20210716T062258456728Z',
    'valueCreationDate': '2021-07-16T06:22:58.456728Z',
    'hasPermissions': 'CR knora-admin:ProjectAdmin|D knora-admin:ProjectAdmin|M knora-admin:ProjectAdmin|V knora-admin:ProjectAdmin|RV knora-admin:ProjectAdmin',
    'userHasPermission': 'CR',
    'uuid': 'lRExhaYnQZuWVspAnbrjAQ',
    'filename': 'Bf9iaid15df-EOrcDcZEtfk.pdf',
    'fileUrl': 'http://0.0.0.0:1024/1111/Bf9iaid15df-EOrcDcZEtfk.pdf/file',
    'dimX': 2550,
    'dimY': 3300,
    'pageCount': 3,
    'strval': 'http://0.0.0.0:1024/1111/Bf9iaid15df-EOrcDcZEtfk.pdf/file',
    'property': 'http://api.knora.org/ontology/knora-api/v2#hasDocumentFileValue',
    'propertyLabel': 'hat Dokument',
    'propertyComment': 'Connects a Representation to a document'
};

const documentPptFileValue = {
    'type': 'http://api.knora.org/ontology/knora-api/v2#DocumentFileValue',
    'id': 'http://rdfh.ch/1111/ay_F18DrTHeJ4zKuTt8Qzw/values/uY_qTEqVSBOW3c2vyeGXQg',
    'attachedToUser': 'http://rdfh.ch/users/Iscj52QaSk-LNurRU6z3Hw',
    'arkUrl': 'http://0.0.0.0:3336/ark:/72163/1/1111/ay_F18DrTHeJ4zKuTt8Qzws/lRExhaYnQZuWVspAnbrjAQO',
    'versionArkUrl': 'http://0.0.0.0:3336/ark:/72163/1/1111/ay_F18DrTHeJ4zKuTt8Qzws/lRExhaYnQZuWVspAnbrjAQO.20210716T062258456728Z',
    'valueCreationDate': '2021-07-16T06:22:58.456728Z',
    'hasPermissions': 'CR knora-admin:ProjectAdmin|D knora-admin:ProjectAdmin|M knora-admin:ProjectAdmin|V knora-admin:ProjectAdmin|RV knora-admin:ProjectAdmin',
    'userHasPermission': 'CR',
    'uuid': 'lRExhaYnQZuWVspAnbrjAQ',
    'filename': 'Bf9iaid15df-EOrcDcZEtfk.ppt',
    'fileUrl': 'http://0.0.0.0:1024/1111/Bf9iaid15df-EOrcDcZEtfk.ppt/file',
    'strval': 'http://0.0.0.0:1024/1111/Bf9iaid15df-EOrcDcZEtfk.ppt/file',
    'property': 'http://api.knora.org/ontology/knora-api/v2#hasDocumentFileValue',
    'propertyLabel': 'hat Dokument',
    'propertyComment': 'Connects a Representation to a document'
};

/**
 * test host component with a pdf document
 */
@Component({
    template: `
        <app-document [src]="documentFileRepresentation">
        </app-document>`
})
class TestPdfDocumentHostComponent implements OnInit {

    @ViewChild(DocumentComponent) documentComp: DocumentComponent;

    documentFileRepresentation: FileRepresentation;

    ngOnInit() {
        this.documentFileRepresentation = new FileRepresentation(documentPdfFileValue);
    }
}

/**
 * test host component with a ppt document
 */
@Component({
    template: `
        <app-document [src]="documentFileRepresentation">
        </app-document>`
})
class TestPptDocumentHostComponent implements OnInit {

    @ViewChild(DocumentComponent) documentComp: DocumentComponent;

    documentFileRepresentation: FileRepresentation;

    ngOnInit() {
        this.documentFileRepresentation = new FileRepresentation(documentPptFileValue);
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

describe('DocumentComponent', () => {

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                DocumentComponent,
                TestPdfDocumentHostComponent,
                TestPptDocumentHostComponent,
                MockStatusComponent
            ],
            imports: [
                HttpClientTestingModule,
                MatButtonModule,
                MatDialogModule,
                MatIconModule,
                MatMenuModule,
                MatSnackBarModule,
                PdfViewerModule

            ],
            providers: [
                AppInitService,
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig)
                }
            ]
        })
            .compileComponents();
    });

    describe('pdf viewer', () => {
        let testHostComponent: TestPdfDocumentHostComponent;
        let testHostFixture: ComponentFixture<TestPdfDocumentHostComponent>;
        let documentComponentDe: DebugElement;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(TestPdfDocumentHostComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            const hostCompDe = testHostFixture.debugElement;
            documentComponentDe = hostCompDe.query(By.directive(DocumentComponent));

            expect(testHostComponent).toBeTruthy();
        });

        it('should show the pdf viewer if the document is a pdf', () => {
            const pdfDebugElement = documentComponentDe.query(By.css('.pdf-viewer'));
            expect(pdfDebugElement).toBeTruthy();

            // should not show the default document viewer if the pdf viewer is shown
            const fileRepresentationDebugElement = documentComponentDe.query(By.css('.file-representation'));
            expect(fileRepresentationDebugElement).toBeFalsy();
        });
    });

    describe('default document viewer', () => {
        let testHostComponent: TestPptDocumentHostComponent;
        let testHostFixture: ComponentFixture<TestPptDocumentHostComponent>;
        let documentComponentDe: DebugElement;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(TestPptDocumentHostComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            const hostCompDe = testHostFixture.debugElement;
            documentComponentDe = hostCompDe.query(By.directive(DocumentComponent));

            expect(testHostComponent).toBeTruthy();
        });

        it('should show the default document viewer if the document is not a pdf', () => {
            const fileRepresentationDebugElement = documentComponentDe.query(By.css('.file-representation'));
            expect(fileRepresentationDebugElement).toBeTruthy();

            // should not show the pdf viewer if the default document viewer is shown
            const pdfDebugElement = documentComponentDe.query(By.css('.pdf-viewer'));
            expect(pdfDebugElement).toBeFalsy();
        });
    });

});
