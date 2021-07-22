import { Component, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileRepresentation } from '../file-representation';
import { AudioComponent } from './audio.component';

// --> TODO: get test data from dsp-js or from dsp-api test data
const audioFileValue = {
    'type': 'http://api.knora.org/ontology/knora-api/v2#AudioFileValue',
    'id': 'http://rdfh.ch/1111/hgWTQVPRRTSI87PnlRmUxg/values/VKiMFffXQ9SzWeeCVrk8gw',
    'attachedToUser': 'http://rdfh.ch/users/Iscj52QaSk-LNurRU6z3Hw',
    'arkUrl': 'http://0.0.0.0:3336/ark:/72163/1/1111/hgWTQVPRRTSI87PnlRmUxgI/RVy0rG=vTe=vU=QW6zDToAY',
    'versionArkUrl': 'http://0.0.0.0:3336/ark:/72163/1/1111/hgWTQVPRRTSI87PnlRmUxgI/RVy0rG=vTe=vU=QW6zDToAY.20210719T074023813773Z',
    'valueCreationDate': '2021-07-19T07:40:23.813773Z',
    'hasPermissions': 'CR knora-admin:ProjectAdmin|D knora-admin:ProjectAdmin|M knora-admin:ProjectAdmin|V knora-admin:ProjectAdmin|RV knora-admin:ProjectAdmin',
    'userHasPermission': 'CR',
    'uuid': 'RVy0rG-vTe-vU-QW6zDToA',
    'filename': '7vpVORXYoFV-FkzJ5Fg4bkU.mp3',
    'fileUrl': 'http://0.0.0.0:1024/1111/7vpVORXYoFV-FkzJ5Fg4bkU.mp3/file',
    'duration': 0,
    'strval': 'http://0.0.0.0:1024/1111/7vpVORXYoFV-FkzJ5Fg4bkU.mp3/file',
    'property': 'http://api.knora.org/ontology/knora-api/v2#hasAudioFileValue',
    'propertyLabel': 'hat Audiodatei',
    'propertyComment': 'Connects a Representation to an audio file'
};

@Component({
    template: `
        <app-audio [src]="audioFileRepresentation">
        </app-audio>`
})
class TestHostComponent implements OnInit {

    @ViewChild(AudioComponent) audioPlayerComp: AudioComponent;

    audioFileRepresentation: FileRepresentation;

    ngOnInit() {

        this.audioFileRepresentation = new FileRepresentation(audioFileValue);
    }
}

describe('AudioComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;


    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AudioComponent]
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
