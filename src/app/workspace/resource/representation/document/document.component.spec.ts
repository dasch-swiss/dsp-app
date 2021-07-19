import { Component, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { FileRepresentation } from '../file-representation';
import { DocumentComponent } from './document.component';

// --> TODO: get test data from dsp-js or from dsp-api test data
const documentFileValue = {
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

@Component({
    template: `
        <app-document [src]="documnetFileRepresentation">
        </app-document>`
})
class TestHostComponent implements OnInit {

    @ViewChild(DocumentComponent) pdfViewerComp: DocumentComponent;

    documnetFileRepresentation: FileRepresentation;
    caption = 'test image';
    inputActivateRegion: string;

    activeRegion: string;

    ngOnInit() {

        this.documnetFileRepresentation = new FileRepresentation(documentFileValue);
    }

    regHovered(regIri: string) {
        this.activeRegion = regIri;
    }
}

describe('DocumentComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DocumentComponent],
            imports: [
                MatButtonModule,
                MatIconModule,
                PdfViewerModule

            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();
    });

    it('should create', () => {
        expect(testHostComponent).toBeTruthy();
    });
});
