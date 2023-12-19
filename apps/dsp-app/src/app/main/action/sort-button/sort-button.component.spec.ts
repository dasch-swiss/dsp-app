import { Component, DebugElement, OnInit, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SortingService } from '../../services/sorting.service';
import { SortButtonComponent } from './sort-button.component';

/**
 * test host component to simulate parent component with a progress bar.
 */
@Component({
  template: `
    <app-sort-button
      #sortButton
      [sortProps]="sortProps"
      [position]="position"
      (sortKeyChange)="sortList($event)">
    </app-sort-button>
    <ul class="list">
      <li *ngFor="let item of list" class="item">
        <span>{{ item.firstname }} </span>
        <span>{{ item.lastname }} </span>
        by
        <span>{{ item.creator }}</span>
      </li>
    </ul>
  `,
})
class TestHostComponent implements OnInit {
  @ViewChild('sortButton', { static: false })
  sortButtonComponent: SortButtonComponent;

  sortingService: SortingService = new SortingService();

  sortProps: any = [
    {
      key: 'firstname',
      label: 'First name',
    },
    {
      key: 'lastname',
      label: 'Last name',
    },
    {
      key: 'creator',
      label: 'Creator',
    },
  ];
  position = 'left';

  list = [
    {
      firstname: 'a',
      lastname: 'z',
      creator: 'André Franquin',
    },
    {
      firstname: 'b',
      lastname: 'y',
      creator: 'Walt Disney',
    },
    {
      firstname: 'c',
      lastname: 'x',
      creator: 'William Shakespeare',
    },
    {
      firstname: 'd',
      lastname: 'w',
      creator: 'Charles M. Schulz',
    },
  ];

  constructor() {}

  ngOnInit() {}

  sortList(key) {
    this.list = this.sortingService.keySortByAlphabetical(this.list, key);
  }
}

describe('SortButtonComponent', () => {
  let testHostComponent: TestHostComponent;
  let testHostFixture: ComponentFixture<TestHostComponent>;
  const listData = [
    { firstname: 'a', lastname: 'z', creator: 'André Franquin' },
    { firstname: 'b', lastname: 'y', creator: 'Walt Disney' },
    { firstname: 'c', lastname: 'x', creator: 'William Shakespeare' },
    { firstname: 'd', lastname: 'w', creator: 'Charles M. Schulz' },
  ];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MatIconModule, MatMenuModule, BrowserAnimationsModule],
      declarations: [SortButtonComponent, TestHostComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    testHostFixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = testHostFixture.componentInstance;
    testHostFixture.detectChanges();

    expect(testHostComponent).toBeTruthy();
  });

  it('should create an instance', () => {
    expect(testHostComponent.sortButtonComponent).toBeTruthy();
  });

  it('should sort the list by lastname', () => {
    expect(testHostComponent.sortButtonComponent).toBeTruthy();
    expect(testHostComponent.list).toEqual(listData);

    const hostCompDe = testHostFixture.debugElement;

    const spanEl: DebugElement = hostCompDe.query(By.css('span'));

    // expect the button position to be 'right'
    // expect(spanEl.properties).toEqual({ 'className': 'left' });

    const sortSelectionBtnEl: DebugElement = spanEl.query(By.css('button'));

    const matIconEl: DebugElement = sortSelectionBtnEl.query(
      By.css('mat-icon')
    );

    // expect that the button label is 'sort'
    expect(matIconEl.nativeElement.innerText).toEqual('sort');

    // click on the sort button to trigger the sort selection menu
    sortSelectionBtnEl.triggerEventHandler('click', null);

    const matMenuEl = spanEl.query(By.css('mat-menu'));

    const sortSelectionEl = matMenuEl.references.sortSelection;

    // expect that items's names of the sort list are 'Firstname', 'Last name' and 'Creator'
    expect(
      sortSelectionEl.items._results[0]._elementRef.nativeElement.innerText
    ).toEqual('First name');
    expect(
      sortSelectionEl.items._results[1]._elementRef.nativeElement.innerText
    ).toEqual('Last name');
    expect(
      sortSelectionEl.items._results[2]._elementRef.nativeElement.innerText
    ).toEqual('Creator');

    // sort by 'lastname' through a click event
    const item2 = sortSelectionEl.items._results[1]._elementRef.nativeElement;
    item2.click();
    testHostFixture.detectChanges();

    const listEl: DebugElement = hostCompDe.query(By.css('.list'));
    const children = listEl.nativeNode.children;
    expect(children[0].innerText).toEqual('d w by Charles M. Schulz');
    expect(children[1].innerText).toEqual('c x by William Shakespeare');
    expect(children[2].innerText).toEqual('b y by Walt Disney');
    expect(children[3].innerText).toEqual('a z by André Franquin');
  });
});
