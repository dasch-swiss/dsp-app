import { CdkCopyToClipboard } from '@angular/cdk/clipboard';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
    MatDialogModule,
    MatDialogRef,
    MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    Constants,
    MockResource,
    ReadGeomValue,
    ReadResource,
    ReadValue,
} from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { AppInitService } from '@dsp-app/src/app/app-init.service';
import { DspApiConnectionToken } from '@dsp-app/src/app/main/declarations/dsp-api-tokens';
import { FileRepresentation } from '../file-representation';
import { RepresentationService } from '../representation.service';
import { Region, StillImageComponent } from './still-image.component';
import { map } from "rxjs/operators";

// --> TODO: get test data from dsp-js
// --> TODO: get this from dsp-js: https://dasch.myjetbrains.com/youtrack/issue/DSP-506
const stillImageFileValue = {
    type: 'http://api.knora.org/ontology/knora-api/v2#StillImageFileValue',
    id: 'http://rdfh.ch/0803/00014b43f902/values/18dc0912cd05',
    attachedToUser: 'http://rdfh.ch/users/91e19f1e01',
    arkUrl: 'http://0.0.0.0:3336/ark:/72163/1/0803/00014b43f902l/000000000018dc0912cd0wl',
    versionArkUrl:
        'http://0.0.0.0:3336/ark:/72163/1/0803/00014b43f902l/000000000018dc0912cd0wl.20121121T165038Z',
    valueCreationDate: '2012-11-21T16:50:38Z',
    hasPermissions:
        'CR knora-admin:Creator|M knora-admin:ProjectMember|V knora-admin:KnownUser|RV knora-admin:UnknownUser',
    userHasPermission: 'RV',
    uuid: '000000000018dc0912cd0w',
    filename: 'incunabula_0000003328.jp2',
    fileUrl:
        'http://0.0.0.0:1024/0803/incunabula_0000003328.jp2/full/1312,1815/0/default.jpg',
    dimX: 1312,
    dimY: 1815,
    iiifBaseUrl: 'http://0.0.0.0:1024/0803',
    strval: 'http://0.0.0.0:1024/0803/incunabula_0000003328.jp2/full/1312,1815/0/default.jpg',
    property:
        'http://api.knora.org/ontology/knora-api/v2#hasStillImageFileValue',
    propertyLabel: 'has image file',
    propertyComment: 'Connects a Representation to an image file',
};

const knoraJson = `{
    "@context": "http://sipi.io/api/file/3/context.json",
    "id": "http://0.0.0.0:1024/0123/4QDrmFc74t3-CcHrliRmPWZ.jp2",
    "checksumOriginal": "2de469409abf8781d38e63fcb26149404c18067906054b75731e2acc57275214",
    "checksumDerivative": "15c749335d5feacfe93dd05ce661a30a42ac332ab55d7476d599b98a58f7057a",
    "width": 640,
    "height": 426,
    "internalMimeType": "image/jpx",
    "originalMimeType": "image/jpeg",
    "originalFilename": "test.jpeg"
}`;

// --> TODO: remove dummy regions: https://dasch.myjetbrains.com/youtrack/issue/DSP-506
const rectangleGeom = `{
        "status": "active",
        "lineColor": "#ff3333",
        "lineWidth": 2,
        "points": [{
            "x": 0.0989010989010989,
            "y": 0.18055555555555555
        }, {
            "x": 0.7252747252747253,
            "y": 0.7245370370370371
        }],
        "type": "rectangle"
    }`;

class Geom extends ReadValue {
    geometryString: string;
}

function makeRegion(geomString: string[], iri: string): ReadResource {
    const geomVals = geomString.map((geom) => {
        const parseReg = new Geom();
        parseReg.geometryString = geom;

        return new ReadGeomValue(parseReg);
    });

    const regionRes = new ReadResource();
    regionRes.id = iri;
    regionRes.properties[Constants.HasGeometry] = geomVals;

    return regionRes;
}

@Component({
    template: ` <app-still-image
        [images]="stillImageFileRepresentations"
        [imageCaption]="caption"
        [activateRegion]="inputActivateRegion"
        [currentTab]="'annotations'"
        [parentResource]="readresource"
        (regionClicked)="regHovered($event)"
    >
    </app-still-image>`,
})
class TestHostComponent implements OnInit {
    @ViewChild(StillImageComponent) osdViewerComp: StillImageComponent;

    readResource: ReadResource;
    stillImageFileRepresentations: FileRepresentation[] = [];
    caption = 'test image';
    inputActivateRegion: string;

    activeRegion: string;

    ngOnInit() {
        MockResource.getTestThing().subscribe((res) => {
            this.readResource = res;
        });

        this.stillImageFileRepresentations = [
            new FileRepresentation(stillImageFileValue, [
                new Region(makeRegion([rectangleGeom], 'first')),
            ]),
        ];
    }

    regHovered(regIri: string) {
        this.activeRegion = regIri;
    }
}

describe('StillImageComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(() => {
        const adminSpyObj = {
            v2: {
                res: jasmine.createSpyObj('res', ['createResource']),
            },
        };

        const representationServiceSpyObj = jasmine.createSpyObj(
            'RepresentationService',
            ['getFileInfo', 'doesFileExist']
        );

        TestBed.configureTestingModule({
            declarations: [
                StillImageComponent,
                TestHostComponent,
                CdkCopyToClipboard,
            ],
            imports: [
                BrowserAnimationsModule,
                HttpClientTestingModule,
                MatDialogModule,
                MatIconModule,
                MatMenuModule,
                MatSnackBarModule,
                MatToolbarModule,
            ],
            providers: [
                AppInitService,
                {
                    provide: DspApiConnectionToken,
                    useValue: adminSpyObj,
                },
                {
                    provide: RepresentationService,
                    useValue: representationServiceSpyObj,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {},
                },
                {
                    provide: MatDialogRef,
                    useValue: {},
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        const representationServiceSpy = TestBed.inject(RepresentationService);
        (
            representationServiceSpy as jasmine.SpyObj<RepresentationService>
        ).getFileInfo.and.callFake(() => of(knoraJson).pipe(map((response: any) => response as object)));

        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.osdViewerComp).toBeTruthy();
    });

    // atm StillImageOSDViewerComponent has not many public methods or members.
    // to be able to still test state of StillImageOSDViewerComponent we use the following technique for the first couple of tests:
    // test private methods, members with: component["method"](param), or component["member"]
    // this prevents TS compiler from restricting access, while still checking type safety.

    it('should have initialized viewer after resources change', () => {
        expect(testHostComponent.osdViewerComp['_viewer']).toBeTruthy();
    });

    it('should have OpenSeadragon.Viewer.isVisible() == true after resources change', () => {
        expect(
            testHostComponent.osdViewerComp['_viewer'].isVisible()
        ).toBeTruthy();
    });

    it('should have 1 image loaded after resources change with 1 full size image', (done) => {
        testHostComponent.osdViewerComp['_viewer'].addHandler(
            'open',
            () => {
                expect(
                    testHostComponent.osdViewerComp[
                        '_viewer'
                    ].world.getItemCount()
                ).toEqual(1);
                done();
            }
        );
    });

    it('should have 1 test region loaded (rectangle)', () => {
        const osd = testHostComponent.osdViewerComp['_viewer'];
        expect(osd.element.getElementsByClassName('region').length).toEqual(1);
    });

    it("should emit the region's Iri when a region is clicked", () => {
        const osd = testHostComponent.osdViewerComp['_viewer'];
        const overlayElement = osd.element.getElementsByClassName('region')[0];

        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
        });

        overlayElement.dispatchEvent(event);

        testHostFixture.detectChanges();

        expect(testHostComponent.activeRegion).toEqual('first');
    });

    // it('should open the dialog box when the replace image button is clicked', async () => {

    //     const replaceImageButton = await rootLoader.getHarness(MatButtonHarness.with({ selector: '.replace-image' }));
    //     console.log('replaceImageButton: ', replaceImageButton);
    //     await replaceImageButton.click();

    //     const dialogHarnesses = await rootLoader.getAllHarnesses(MatDialogHarness);
    //     expect(dialogHarnesses.length).toEqual(1);
    // });
});
