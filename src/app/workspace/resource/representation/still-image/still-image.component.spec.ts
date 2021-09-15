import { Component, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { By } from '@angular/platform-browser';
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

const rectangleGeom2 = `{
        "status": "active",
        "lineColor": "#ff3333",
        "lineWidth": 2,
        "points": [{
            "x": 0.17296511627906977,
            "y": 0.08226691042047532
        }, {
            "x": 0.7122093023255814,
            "y": 0.16544789762340037
        }],
        "type": "rectangle"
    }`;

const polygonGeom = `{
	"status": "active",
	"lineColor": "#ff3333",
	"lineWidth": 2,
	"points": [{
		"x": 0.17532467532467533,
		"y": 0.18049792531120332
	}, {
		"x": 0.8051948051948052,
		"y": 0.17012448132780084
	}, {
		"x": 0.8311688311688312,
		"y": 0.7261410788381742
	}, {
		"x": 0.19480519480519481,
		"y": 0.7323651452282157
	}, {
		"x": 0.17857142857142858,
		"y": 0.17842323651452283
	}, {
		"x": 0.18506493506493507,
		"y": 0.1825726141078838
	}, {
		"x": 0.17857142857142858,
		"y": 0.1825726141078838
	}],
	"type": "polygon"
}`;

const circleGeom = `{
	"status": "active",
	"lineColor": "#3333ff",
	"lineWidth": 2,
	"points": [{
		"x": 0.3400735294117647,
		"y": 0.45376078914919854
	}],
	"type": "circle",
	"radius": {
		"x": 0.04595588235294118,
		"y": 0.03082614056720101
	},
	"original_index": 1
}`;

const circleGeom2 = `{
	"status": "active",
	"lineColor": "#3333ff",
	"lineWidth": 2,
	"points": [{
		"x": 0.5305232558139537,
		"y": 0.3126142595978062
	}],
	"type": "circle",
	"radius": {
		"x": 0.18023255813953487,
		"y": 0.08957952468007313
	},
	"original_index": 1
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
                         [imageCaption]="caption" [activateRegion]="inputActivateRegion"
                         (regionClicked)="regHovered($event)">
        </app-still-image>`
})
class TestHostComponent implements OnInit {

    @ViewChild(StillImageComponent) osdViewerComp: StillImageComponent;

    stillImageFileRepresentations: FileRepresentation[] = [];
    caption = 'test image';
    inputActivateRegion: string;

    activeRegion: string;

    ngOnInit() {

        this.stillImageFileRepresentations
            = [
                new FileRepresentation(stillImageFileValue,
                    [
                        new Region(makeRegion([rectangleGeom], 'first')),
                        new Region(makeRegion([polygonGeom], 'second')),
                        new Region(makeRegion([circleGeom], 'third')),
                        new Region(makeRegion([circleGeom2, rectangleGeom2], 'fourth'))
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
            declarations: [StillImageComponent, TestHostComponent],
            imports: [
                MatDialogModule,
                MatIconModule,
                MatSnackBarModule,
                MatToolbarModule
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

        const captionDebugElement = stillImageComponentDe.query(By.css('.mat-caption'));
        const captionEle = captionDebugElement.nativeElement;

        expect(captionEle.innerText).toEqual('test image');

    });

    it('should have 5 test regions loaded (rectangle, polygon, circle, [circle, rectangle])', () => {

        const overlay = testHostComponent.osdViewerComp['_viewer'].svgOverlay();
        expect(overlay.node().childElementCount).toEqual(5);
    });

    it('should emit the region\'s Iri when a region is hovered', () => {

        const overlay = testHostComponent.osdViewerComp['_viewer'].svgOverlay();

        // first region -> polygon element (second element in <g> element)
        const regionSvgEle: HTMLElement = overlay.node().childNodes[0].childNodes[1];

        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });

        regionSvgEle.dispatchEvent(event);

        testHostFixture.detectChanges();

        expect(testHostComponent.activeRegion).toEqual('first');

    });

    it('should highlight a region', () => {

        testHostComponent.osdViewerComp['_highlightRegion']('first');
        testHostFixture.detectChanges();

        const overlay = testHostComponent.osdViewerComp['_viewer'].svgOverlay();

        // first region -> polygon element (second element in <g> element)
        const regionSvgEle: HTMLElement = overlay.node().childNodes[0].childNodes[1];

        let attr = regionSvgEle.getAttribute('class');
        expect(attr).toEqual('roi-svgoverlay active');

        testHostComponent.osdViewerComp['_unhighlightAllRegions']();
        testHostFixture.detectChanges();

        attr = regionSvgEle.getAttribute('class');
        expect(attr).toEqual('roi-svgoverlay');

    });

    it('should highlight a region using the input "activateRegion"', () => {
        testHostComponent.inputActivateRegion = 'first';
        testHostFixture.detectChanges();

        const overlay = testHostComponent.osdViewerComp['_viewer'].svgOverlay();

        // first region -> polygon element (second element in <g> element)
        const regionSvgEle: HTMLElement = overlay.node().childNodes[0].childNodes[1];

        const attr = regionSvgEle.getAttribute('class');
        expect(attr).toEqual('roi-svgoverlay active');
    });

});
