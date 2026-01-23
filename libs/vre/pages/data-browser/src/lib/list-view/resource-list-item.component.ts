import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';
import { MultipleViewerService } from '../comparison/multiple-viewer.service';
import { ProjectShortnameService } from '../project-shortname.service';

@Component({
  selector: 'app-resource-list-item',
  template: `
    <div
      class="item"
      [ngClass]="{ highlighted: isHighlighted$ | async, search: multipleViewerService.searchKeyword !== undefined }"
      data-cy="resource-list-item"
      (mouseenter)="showCheckbox = true"
      (mouseleave)="showCheckbox = false"
      (click)="multipleViewerService.selectOneResource(resource)">
      <div style="display: flex; align-items: center; min-height: 40px">
        <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <div style="color: black">
            @if (showProjectShortname && (projectShortname$ | async); as shortname) {
              <span style="font-weight: 500; color: #555;">[{{ shortname }}]</span>
            }
            {{ resource.label }}
          </div>
          @if (foundIn.length > 0) {
            <div class="found-in">
              {{ 'pages.dataBrowser.resourceListItem.foundIn' | translate }}{{ foundIn.join(', ') }}
            </div>
          }
        </div>

        @if (showCheckbox || multipleViewerService.selectMode) {
          <mat-checkbox
            [checked]="isSelected$ | async"
            (change)="onCheckboxChanged($event)"
            (click)="$event.stopPropagation()" />
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .item {
        padding: 0 16px;
        cursor: pointer;
        &:hover {
          background-color: #ebebeb;
        }
        &.search {
          padding: 8px 16px;
        }
      }
      .highlighted {
        border-left: 2px solid #33678f;
        background-color: #d6e0e8;
      }
      mat-list-item {
        border-bottom: 1px solid #ebebeb;
      }

      .found-in {
        white-space: nowrap;
        text-overflow: ellipsis;
        margin-top: 8px;
        font-size: 12px;
      }
    `,
  ],
  imports: [AsyncPipe, NgClass, MatCheckbox, TranslatePipe],
})
export class ResourceListItemComponent implements OnInit {
  @Input({ required: true }) resource!: ReadResource;
  @Input() showProjectShortname = false;

  showCheckbox = false;
  foundIn: string[] = [];

  isHighlighted$ = this.multipleViewerService.selectedResources$.pipe(
    map(resources => {
      if (this.multipleViewerService.selectMode) {
        return resources.map(r => r.id).includes(this.resource.id);
      } else {
        return resources.length > 0 && resources[0].id === this.resource.id;
      }
    })
  );

  isSelected$ = this.multipleViewerService.selectedResources$.pipe(
    map(resources => resources.map(r => r.id).includes(this.resource.id) && this.multipleViewerService.selectMode)
  );

  projectShortname$!: Observable<string>;

  constructor(
    public readonly multipleViewerService: MultipleViewerService,
    private readonly _projectShortnameService: ProjectShortnameService
  ) {}

  ngOnInit() {
    const searchKeyword = this.multipleViewerService.searchKeyword;
    if (searchKeyword) {
      this._searchInResourceLabel(searchKeyword);
      this._searchInResourceProperty(searchKeyword);
    }

    this.projectShortname$ = this._projectShortnameService.getProjectShortname(this.resource.attachedToProject);
  }

  onCheckboxChanged(event: MatCheckboxChange) {
    if (event.checked) {
      this.multipleViewerService.addResources([this.resource]);
    } else {
      this.multipleViewerService.removeResources([this.resource]);
    }
  }

  private _searchInResourceLabel(keyword: string) {
    if (this.resource.label.toLowerCase().includes(keyword.toLowerCase())) {
      this.foundIn.push('Label');
    }
  }

  private _searchInResourceProperty(keyword: string) {
    Object.values(this.resource.properties).forEach(values => {
      values.forEach(value => {
        if (!value.propertyLabel) {
          return;
        }

        if (
          value.strval &&
          value.strval.toLowerCase().includes(keyword.toLowerCase()) &&
          !this.foundIn.includes(value.propertyLabel)
        ) {
          this.foundIn.push(value.propertyLabel);
        }
      });
    });
  }
}
