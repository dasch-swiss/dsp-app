import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Constants, ReadGeomValue, ReadResource, ReadValue } from '@dasch-swiss/dsp-js';
import { AppInitService } from 'src/app/app-init.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { FileRepresentation } from '../file-representation';
import { Region, StillImageComponent } from './still-image.component';

// --> TODO: get test data from dsp-js
// --> TODO: get this from dsp-js: https://dasch.myjetbrains.com/youtrack/issue/DSP-506
const stillImageFileValue = {
    'type': 'http://api.knora.org/ontology/knora-api/v2#StillImageFileValue',
    'id': 'http://rdfh.ch/0803/00014b43f902/values/18dc0912cd05',
    'attachedToUser': 'http://rdfh.ch/users/91e19f1e01',
    'arkUrl': 'http://0.0.0.0:3336/ark:/72163/1/0803/00014b43f902l/000000000018dc0912cd0wl',
    'versionArkUrl': 'http://0.0.0.0:3336/ark:/72163/1/0803/00014b43f902l/000000000018dc0912cd0wl.20121121T165038Z',
    'valueCreationDate': '2012-11-21T16:50:38Z',
    'hasPermissions': 'CR knora-admin:Creator|M knora-admin:ProjectMember|V knora-admin:KnownUser|RV knora-admin:UnknownUser',
    'userHasPermission': 'RV',
    'uuid': '000000000018dc0912cd0w',
    'filename': 'incunabula_0000003328.jp2',
    'fileUrl': 'http://0.0.0.0:1024/0803/incunabula_0000003328.jp2/full/1312,1815/0/default.jpg',
    'dimX': 1312,
    'dimY': 1815,
    'iiifBaseUrl': 'http://0.0.0.0:1024/0803',
    'strval': 'http://0.0.0.0:1024/0803/incunabula_0000003328.jp2/full/1312,1815/0/default.jpg',
    'property': 'http://api.knora.org/ontology/knora-api/v2#hasStillImageFileValue',
    'propertyLabel': 'has image file',
    'propertyComment': 'Connects a Representation to an image file'
};

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

    const geomVals = geomString.map(geom => {

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
    template: `
        <app-still-image [images]="stillImageFileRepresentations"
                         [imageCaption]="caption"
                         [iiifUrl]="iiifUrl"
                         [activateRegion]="inputActivateRegion"
                         [currentTab]="'annotations'"
                         (regionClicked)="regHovered($event)">
        </app-still-image>`
})
class TestHostComponent implements OnInit {

    @ViewChild(StillImageComponent) osdViewerComp: StillImageComponent;

    stillImageFileRepresentations: FileRepresentation[] = [];
    caption = 'test image';
    iiifUrl = 'https://iiif.test.dasch.swiss:443/0803/incunabula_0000003840.jp2/full/3210,5144/0/default.jpg';
    inputActivateRegion: string;

    activeRegion: string;

    ngOnInit() {

        this.stillImageFileRepresentations
            = [
                new FileRepresentation(stillImageFileValue,
                    [
                        new Region(makeRegion([rectangleGeom], 'first'))
                    ])
            ];
    }

    regHovered(regIri: string) {
        this.activeRegion = regIri;
    }
}

describe('StillImageComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(waitForAsync(() => {

        const adminSpyObj = {
            v2: {
                res: jasmine.createSpyObj('res', ['createResource'])
            }
        };

        TestBed.configureTestingModule({
            declarations: [
                StillImageComponent,
                TestHostComponent
            ],
            imports: [
                BrowserAnimationsModule,
                HttpClientModule,
                MatDialogModule,
                MatIconModule,
                MatSnackBarModule,
                MatToolbarModule,
            ],
            providers: [
                AppInitService,
                {
                    provide: DspApiConnectionToken,
                    useValue: adminSpyObj
                },
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();
    });

    it('should create', () => {
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
        expect(testHostComponent.osdViewerComp['_viewer'].isVisible()).toBeTruthy();
    });

    it('should have 1 image loaded after resources change with 1 full size image', done => {

        testHostComponent.osdViewerComp['_viewer'].addHandler('open', (args) => {
            expect(testHostComponent.osdViewerComp['_viewer'].world.getItemCount()).toEqual(1);
            done();
        });

    });

    it('should display the image caption', () => {

        const hostCompDe = testHostFixture.debugElement;
        const stillImageComponentDe = hostCompDe.query(By.directive(StillImageComponent));

        const captionDebugElement = stillImageComponentDe.query(By.css('.caption'));
        const captionEle = captionDebugElement.nativeElement;

        expect(captionEle.innerText).toEqual('test image');

    });

    it('should display the iiifUrl of the image', () => {

        const hostCompDe = testHostFixture.debugElement;
        const stillImageComponentDe = hostCompDe.query(By.directive(StillImageComponent));

        const iiifUrlDebugElement = stillImageComponentDe.query(By.css('.iiif-url a'));
        const iiifUrlEle = iiifUrlDebugElement.nativeElement;

        expect(iiifUrlEle.innerText).toEqual('https://iiif.test.dasch.swiss:443/0803/incunabula_0000003840.jp2/full/3210,5144/0/default.jpg');
        expect(iiifUrlEle.getAttribute('target')).toEqual('_blank');
        expect(iiifUrlEle.getAttribute('href')).toEqual('https://iiif.test.dasch.swiss:443/0803/incunabula_0000003840.jp2/full/3210,5144/0/default.jpg');
    });

    it('should have 1 test region loaded (rectangle)', () => {

        const osd = testHostComponent.osdViewerComp['_viewer'];
        expect(osd.element.getElementsByClassName('region').length).toEqual(1);
    });

    it('should emit the region\'s Iri when a region is clicked', () => {

        const osd = testHostComponent.osdViewerComp['_viewer'];
        const overlayElement = osd.element.getElementsByClassName('region')[0];

        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });

        overlayElement.dispatchEvent(event);

        testHostFixture.detectChanges();

        expect(testHostComponent.activeRegion).toEqual('first');

    });

});
