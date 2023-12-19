import { OverlayModule } from '@angular/cdk/overlay';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { MockResource, ReadResource } from '@dasch-swiss/dsp-js';
import { TitleFromCamelCasePipe } from '@dsp-app/src/app/main/pipes/string-transformation/title-from-camel-case.pipe';
import { PermissionInfoComponent } from './permission-info.component';

/**
 * test host component to simulate parent component
 */
@Component({
  template: ` <app-permission-info
    #permissionInfo
    [hasPermissions]="resource.hasPermissions"
    [userHasPermission]="resource.userHasPermission">
  </app-permission-info>`,
})
class TestHostComponent implements OnInit {
  @ViewChild('permissionInfo', { static: false })
  permissionInfoComponent: PermissionInfoComponent;

  resource: ReadResource;

  constructor() {}

  ngOnInit() {
    // get a resource from DSP-JS-Lib test data
    MockResource.getTestThing().subscribe((response: ReadResource) => {
      this.resource = response;
    });
  }
}

describe('PermissionInfoComponent', () => {
  let testHostComponent: TestHostComponent;
  let testHostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MatButtonModule, MatIconModule, MatTooltipModule, OverlayModule, RouterTestingModule],
      declarations: [TestHostComponent, PermissionInfoComponent, TitleFromCamelCasePipe],
      providers: [],
    }).compileComponents();
  }));

  beforeEach(() => {
    testHostFixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = testHostFixture.componentInstance;
    testHostFixture.detectChanges();

    expect(testHostComponent).toBeTruthy();
  });

  it('should create', () => {
    expect(testHostComponent.permissionInfoComponent).toBeTruthy();
  });

  it('should have permission values and an icon button', () => {
    expect(testHostFixture.nativeElement.querySelector('button.permissions').innerText).toEqual('lock');
    expect(testHostComponent.permissionInfoComponent.hasPermissions).toEqual(
      'CR knora-admin:Creator|M knora-admin:ProjectMember|V knora-admin:KnownUser|RV knora-admin:UnknownUser'
    );
    expect(testHostComponent.permissionInfoComponent.userHasPermission).toEqual('RV');
  });

  it('should display all permissions as enabled in the first line (Creator has CR)', () => {
    const hostCompDe = testHostFixture.debugElement;
    const permissionInfoEl = hostCompDe.query(By.directive(PermissionInfoComponent));
    const permissionBtnEl = permissionInfoEl.query(By.css('button.permissions'));
    permissionBtnEl.triggerEventHandler('click', null);
    testHostFixture.detectChanges();

    const permissionInfoBox = permissionInfoEl.query(By.css('div.overlay-info-box'));
    const rowEle = permissionInfoBox.nativeElement.querySelector('tr.Creator');

    expect(rowEle.querySelector('td.first-col').innerText).toEqual('Creator');
    expect(rowEle.querySelector('td.perm-RV').querySelector('.mat-icon').innerText).toEqual('radio_button_checked');
    expect(rowEle.querySelector('td.perm-V').querySelector('.mat-icon').innerText).toEqual('radio_button_checked');
    expect(rowEle.querySelector('td.perm-M').querySelector('.mat-icon').innerText).toEqual('radio_button_checked');
    expect(rowEle.querySelector('td.perm-D').querySelector('.mat-icon').innerText).toEqual('radio_button_checked');
    expect(rowEle.querySelector('td.perm-CR').querySelector('.mat-icon').innerText).toEqual('radio_button_checked');
  });

  it('should display three permissions as enabled in the second line (Project Member has M)', () => {
    const hostCompDe = testHostFixture.debugElement;
    const permissionInfoEl = hostCompDe.query(By.directive(PermissionInfoComponent));
    const permissionBtnEl = permissionInfoEl.query(By.css('button.permissions'));
    permissionBtnEl.triggerEventHandler('click', null);
    testHostFixture.detectChanges();

    const permissionInfoBox = permissionInfoEl.query(By.css('div.overlay-info-box'));
    const rowEle = permissionInfoBox.nativeElement.querySelector('tr.ProjectMember');

    expect(rowEle.querySelector('td.first-col').innerText).toEqual('Project Member');
    expect(rowEle.querySelector('td.perm-RV').querySelector('.mat-icon').innerText).toEqual('radio_button_checked');
    expect(rowEle.querySelector('td.perm-V').querySelector('.mat-icon').innerText).toEqual('radio_button_checked');
    expect(rowEle.querySelector('td.perm-M').querySelector('.mat-icon').innerText).toEqual('radio_button_checked');
    expect(rowEle.querySelector('td.perm-D').querySelector('.mat-icon').innerText).toEqual('radio_button_unchecked');
    expect(rowEle.querySelector('td.perm-CR').querySelector('.mat-icon').innerText).toEqual('radio_button_unchecked');
  });

  it('should display two permissions as enabled in the third line (Known User has V)', () => {
    const hostCompDe = testHostFixture.debugElement;
    const permissionInfoEl = hostCompDe.query(By.directive(PermissionInfoComponent));
    const permissionBtnEl = permissionInfoEl.query(By.css('button.permissions'));
    permissionBtnEl.triggerEventHandler('click', null);
    testHostFixture.detectChanges();

    const permissionInfoBox = permissionInfoEl.query(By.css('div.overlay-info-box'));
    const rowEle = permissionInfoBox.nativeElement.querySelector('tr.KnownUser');

    expect(rowEle.querySelector('td.first-col').innerText).toEqual('Known User');
    expect(rowEle.querySelector('td.perm-RV').querySelector('.mat-icon').innerText).toEqual('radio_button_checked');
    expect(rowEle.querySelector('td.perm-V').querySelector('.mat-icon').innerText).toEqual('radio_button_checked');
    expect(rowEle.querySelector('td.perm-M').querySelector('.mat-icon').innerText).toEqual('radio_button_unchecked');
    expect(rowEle.querySelector('td.perm-D').querySelector('.mat-icon').innerText).toEqual('radio_button_unchecked');
    expect(rowEle.querySelector('td.perm-CR').querySelector('.mat-icon').innerText).toEqual('radio_button_unchecked');
  });

  it('should display only one permissions as enabled in the fourth line (Unknown User has RV)', () => {
    const hostCompDe = testHostFixture.debugElement;
    const permissionInfoEl = hostCompDe.query(By.directive(PermissionInfoComponent));
    const permissionBtnEl = permissionInfoEl.query(By.css('button.permissions'));
    permissionBtnEl.triggerEventHandler('click', null);
    testHostFixture.detectChanges();

    const permissionInfoBox = permissionInfoEl.query(By.css('div.overlay-info-box'));
    const rowEle = permissionInfoBox.nativeElement.querySelector('tr.UnknownUser');

    expect(rowEle.querySelector('td.first-col').innerText).toEqual('Unknown User');
    expect(rowEle.querySelector('td.perm-RV').querySelector('.mat-icon').innerText).toEqual('radio_button_checked');
    expect(rowEle.querySelector('td.perm-V').querySelector('.mat-icon').innerText).toEqual('radio_button_unchecked');
    expect(rowEle.querySelector('td.perm-M').querySelector('.mat-icon').innerText).toEqual('radio_button_unchecked');
    expect(rowEle.querySelector('td.perm-D').querySelector('.mat-icon').innerText).toEqual('radio_button_unchecked');
    expect(rowEle.querySelector('td.perm-CR').querySelector('.mat-icon').innerText).toEqual('radio_button_unchecked');
  });

  it('should display only one permissions as enabled in the logged-in-user line (Logged-in User has RV)', () => {
    const hostCompDe = testHostFixture.debugElement;
    const permissionInfoEl = hostCompDe.query(By.directive(PermissionInfoComponent));
    const permissionBtnEl = permissionInfoEl.query(By.css('button.permissions'));
    permissionBtnEl.triggerEventHandler('click', null);
    testHostFixture.detectChanges();

    const permissionInfoBox = permissionInfoEl.query(By.css('div.overlay-info-box'));
    const rowEle = permissionInfoBox.nativeElement.querySelector('tr.LoggedInUser');

    expect(rowEle.querySelector('td.first-col').innerText).toEqual('Your permissions');
    expect(rowEle.querySelector('td.perm-RV').querySelector('.mat-icon').innerText).toEqual('radio_button_checked');
    expect(rowEle.querySelector('td.perm-V').querySelector('.mat-icon').innerText).toEqual('radio_button_unchecked');
    expect(rowEle.querySelector('td.perm-M').querySelector('.mat-icon').innerText).toEqual('radio_button_unchecked');
    expect(rowEle.querySelector('td.perm-D').querySelector('.mat-icon').innerText).toEqual('radio_button_unchecked');
    expect(rowEle.querySelector('td.perm-CR').querySelector('.mat-icon').innerText).toEqual('radio_button_unchecked');
  });
});
