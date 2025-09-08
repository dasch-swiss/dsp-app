import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ListChildNodeResponse, ListNode, ListNodeInfo, ListResponse } from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { startWith, Subscription, switchMap } from 'rxjs';
import { ListItemService } from './list-item.service';

@Component({
  selector: 'app-list-item',
  template: `
    @for (child of children; track trackByFn(index, child); let index = $index; let first = $first; let last = $last) {
      <app-list-item-element [position]="index" [length]="children.length" [node]="child" [isAdmin]="isAdmin" />
    }
    @if (isAdmin) {
      <app-list-item-form [parentNode]="node" style="display: block; margin-left: 46px" />
    }
  `,
  styles: [':host { display: block; }'],
})
export class ListItemComponent implements OnInit, OnDestroy {
  @Input({ required: true }) node!: ListNodeInfo;
  @Input() isAdmin = false;

  children: ListNode[] = [];
  subscription!: Subscription;

  constructor(
    private _listApiService: ListApiService,
    private _listItemService: ListItemService,
    private _cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscription = this._listItemService.onUpdate$
      .pipe(
        startWith(true),
        switchMap(() => this._listApiService.get(this.node.id))
      )
      .subscribe(result => {
        if ('node' in result) {
          this.children = (result as ListChildNodeResponse).node.children;
        } else {
          this.children = (result as ListResponse).list.children;
        }
        this._cd.markForCheck();
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  trackByFn(index: number, item: any): string {
    return item.id;
  }
}
