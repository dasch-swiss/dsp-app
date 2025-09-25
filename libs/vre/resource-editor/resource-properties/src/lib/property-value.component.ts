import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { PropertyValueService } from './property-value.service';

@Component({
  selector: 'app-property-value',
  template: `
    @if (displayMode) {
      <app-property-value-display [index]="index" />
    }
    @if (!displayMode) {
      <app-property-value-update [index]="index" />
    }
  `,
  standalone: false,
})
export class PropertyValueComponent implements OnInit, OnDestroy {
  @Input({ required: true }) index!: number;

  displayMode = false;
  private _subscription!: Subscription;

  constructor(public propertyValueService: PropertyValueService) {}

  ngOnInit() {
    this._subscription = this.propertyValueService.lastOpenedItem$.pipe(distinctUntilChanged()).subscribe(value => {
      this.displayMode = this.index !== value;
    });
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }
}
