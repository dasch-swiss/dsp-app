import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ListChildNodeResponse, ListNode, ListNodeInfo, ListResponse } from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { startWith, Subscription, switchMap } from 'rxjs';
import { ListItemElementComponent } from '../list-item-element/list-item-element.component';
import { ListItemFormComponent } from '../list-item-form/list-item-form.component';
import { ListItemService } from './list-item.service';

@Component({
  selector: 'app-list-item',
  template: `
    @for (child of children; track trackByFn($index, child); let index = $index) {
      <app-list-item-element
        [position]="index"
        [length]="children.length"
        [node]="child"
        [parentNodeIri]="node.id"
        [isAdmin]="isAdmin" />
    }
    @if (isAdmin) {
      <app-list-item-form [parentNode]="node" style="display: block; margin-left: 46px" />
    }
  `,
  styles: [':host { display: block; }'],
  standalone: true,
  imports: [ListItemElementComponent, ListItemFormComponent],
})
export class ListItemComponent implements OnInit, OnDestroy {
  @Input({ required: true }) node!: ListNodeInfo;
  @Input() parentNodeIri?: string;
  @Input() isAdmin = false;

  children: ListNode[] = [];
  subscription!: Subscription;

  constructor(
    private readonly _listApiService: ListApiService,
    private readonly _listItemService: ListItemService,
    private readonly _cd: ChangeDetectorRef
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

  trackByFn(_index: number, item: any): string {
    return item.id;
  }
}
