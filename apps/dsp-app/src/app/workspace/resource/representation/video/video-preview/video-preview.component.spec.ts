import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReadMovingImageFileValue } from '@dasch-swiss/dsp-js';
import { TimePipe } from '@dsp-app/src/app/main/pipes/time.pipe';
import { FileRepresentation } from '../../file-representation';
import { VideoPreviewComponent } from './video-preview.component';

const videoFileValue: ReadMovingImageFileValue = {
  type: 'http://api.knora.org/ontology/knora-api/v2#MovingImageFileValue',
  id: 'http://rdfh.ch/1111/dyNT0dvbSgGrxVONpaH5FA/values/73Re06_TQDS4FM8SOyCHcQ',
  attachedToUser: 'http://rdfh.ch/users/root',
  arkUrl: 'http://0.0.0.0:3336/ark:/72163/1/1111/dyNT0dvbSgGrxVONpaH5FAT/73Re06_TQDS4FM8SOyCHcQG',
  versionArkUrl:
    'http://0.0.0.0:3336/ark:/72163/1/1111/dyNT0dvbSgGrxVONpaH5FAT/73Re06_TQDS4FM8SOyCHcQG.20220329T112456951082Z',
  valueCreationDate: '2022-03-29T11:24:56.951082Z',
  hasPermissions: 'CR knora-admin:ProjectAdmin|M knora-admin:ProjectMember',
  userHasPermission: 'CR',
  uuid: '73Re06_TQDS4FM8SOyCHcQ',
  filename: '5AiQkeJNbQn-ClrXWkJVFvB.mp4',
  fileUrl: 'http://0.0.0.0:1024/1111/5AiQkeJNbQn-ClrXWkJVFvB.mp4/file',
  dimX: 0,
  dimY: 0,
  duration: 0,
  fps: 0,
  strval: 'http://0.0.0.0:1024/1111/5AiQkeJNbQn-ClrXWkJVFvB.mp4/file',
  property: 'http://api.knora.org/ontology/knora-api/v2#hasMovingImageFileValue',
  propertyLabel: 'hat Filmdatei',
  propertyComment: 'Connects a Representation to a movie file',
};

@Component({
  template: ` <app-video-preview [src]="videoFileRepresentation"> </app-video-preview>`,
})
class TestHostComponent implements OnInit {
  @ViewChild(VideoPreviewComponent) videoPreviewComp: VideoPreviewComponent;

  videoFileRepresentation: FileRepresentation;

  ngOnInit() {
    this.videoFileRepresentation = new FileRepresentation(videoFileValue);
  }
}

describe('VideoPreviewComponent', () => {
  let testHostComponent: TestHostComponent;
  let testHostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VideoPreviewComponent, TimePipe],
      imports: [HttpClientTestingModule],
      providers: [],
    }).compileComponents();
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
