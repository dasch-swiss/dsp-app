import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CompoundService } from './compound.service';

@Component({
  selector: 'app-compound-navigation',
  template: ` <span style="display: flex; align-items: center">
    <button
      mat-icon-button
      [disabled]="compoundNavigation.page <= 1"
      [matTooltip]="'resourceEditor.navigation.firstPage' | translate"
      (click)="openPage(1)">
      <mat-icon>first_page</mat-icon>
    </button>
    <button
      mat-icon-button
      [disabled]="compoundNavigation.page <= 1"
      [matTooltip]="'resourceEditor.navigation.previousPage' | translate"
      (click)="openPage(compoundNavigation.page - 1)">
      <mat-icon>navigate_before</mat-icon>
    </button>
    <span class="range"
      >{{ compoundNavigation.page }} {{ 'resourceEditor.navigation.of' | translate }}
      {{ compoundNavigation.totalPages }}</span
    >
    <button
      mat-icon-button
      [disabled]="isForwardButtonDisabled"
      [matTooltip]="'resourceEditor.navigation.nextPage' | translate"
      (click)="openPage(compoundNavigation.page + 1)">
      <mat-icon>navigate_next</mat-icon>
    </button>
    <button
      mat-icon-button
      [disabled]="compoundNavigation.page === compoundNavigation.totalPages"
      [matTooltip]="'resourceEditor.navigation.lastPage' | translate"
      (click)="openPage(compoundNavigation.totalPages)">
      <mat-icon>last_page</mat-icon>
    </button>
  </span>`,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe],
})
export class CompoundNavigationComponent {
  private readonly _translateService = inject(TranslateService);
  get compoundNavigation() {
    return this.compoundService.compoundPosition;
  }

  get isForwardButtonDisabled() {
    return !this.compoundNavigation || this.compoundNavigation.isLastPage;
  }

  openPage(page: number) {
    this.compoundService.openPage(page);
  }

  constructor(public readonly compoundService: CompoundService) {}
}
