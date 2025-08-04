import { ChangeDetectorRef, Component, ElementRef, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import {
  KnoraApiConnection,
  ReadLinkValue,
  ReadResource,
  ReadValue,
  ResourceClassDefinition,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { EMPTY, expand, filter, finalize, Subject, switchMap, takeUntil } from 'rxjs';
import { CreateResourceDialogComponent, CreateResourceDialogProps } from '../create-resource-dialog.component';
import { LinkValueDataService } from './link-value-data.service';

@Component({
  selector: 'app-link-value',
  template: `
    <mat-form-field style="width: 100%">
      <input
        #input
        matInput
        [formControl]="control"
        aria-label="resource"
        placeholder="Name of an existing resource"
        data-cy="link-input"
        (input)="onInputValueChange()"
        [matAutocomplete]="auto" />
      <mat-autocomplete
        #auto="matAutocomplete"
        requireSelection
        [displayWith]="displayResource.bind(this)"
        (closed)="handleNonSelectedValues()">
        <mat-option *ngIf="resources.length === 0 && !loading" [disabled]="true"> No results were found.</mat-option>
        <mat-option
          *ngFor="let rc of _linkValueDataService.resourceClasses; trackBy: trackByResourceClassFn"
          (click)="openCreateResourceDialog($event, rc.id, rc.label)">
          Create New: {{ rc?.label }}
        </mat-option>
        <mat-option *ngFor="let res of resources; trackBy: trackByResourcesFn" [value]="res.id">
          {{ res.label }}
        </mat-option>
        <mat-option *ngIf="loading" [disabled]="true" class="loader">
          <app-progress-indicator />
        </mat-option>
      </mat-autocomplete>
      <mat-hint>{{ 'resourceEditor.resourceProperties.valueComponents.searchHelp' | translate }}</mat-hint>
      <mat-error *ngIf="control.errors as errors">{{ errors | humanReadableError }}</mat-error>
    </mat-form-field>
  `,
  providers: [LinkValueDataService],
})
export class LinkValueComponent implements OnInit {
  private cancelPreviousSearchRequest$ = new Subject<void>();

  @Input({ required: true }) control!: FormControl<string | null>;
  @Input({ required: true }) propIri!: string;
  @Input({ required: true }) resourceClassIri!: string;
  @Input() defaultValue?: ReadValue;
  @ViewChild(MatAutocompleteTrigger) autoComplete!: MatAutocompleteTrigger;
  @ViewChild(MatAutocomplete) auto!: MatAutocomplete;
  @ViewChild('input') input!: ElementRef<HTMLInputElement>;

  loading = false;
  useDefaultValue = true;
  resources: ReadResource[] = [];
  readResource?: ReadResource;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _dialog: MatDialog,
    private _cd: ChangeDetectorRef,
    public _linkValueDataService: LinkValueDataService
  ) {}

  ngOnInit() {
    this._getResourceProperties();
  }

  handleNonSelectedValues() {
    if (this.input.nativeElement.value !== this.displayResource(this.control.value)) {
      this.input.nativeElement.value = '';
    }
  }

  onInputValueChange() {
    this.resources = [];
    const searchTerm = this.input.nativeElement.value;
    if (!this.readResource || searchTerm?.length < 3) {
      return;
    }

    this.loading = true;
    this._search(searchTerm);
  }

  openCreateResourceDialog(event: any, resourceClassIri: string, resourceType: string) {
    let myResourceId: string;
    event.stopPropagation();
    this._dialog
      .open<CreateResourceDialogComponent, CreateResourceDialogProps, string>(CreateResourceDialogComponent, {
        ...DspDialogConfig.mediumDialog({
          resourceType,
          resourceClassIri,
        }),
      })
      .afterClosed()
      .pipe(
        filter(resourceId => {
          if (!resourceId) {
            this.control.reset();
            return false;
          }
          return true;
        }),
        switchMap(resourceId => {
          myResourceId = resourceId as string;
          return this._dspApiConnection.v2.res.getResource(myResourceId);
        })
      )
      .subscribe(res => {
        this.resources = [];
        this.resources.push(res as ReadResource);
        this.control.setValue(myResourceId);
        this.autoComplete.closePanel();
        this._cd.detectChanges();
      });
  }

  trackByResourcesFn = (index: number, item: ReadResource) => `${index}-${item.id}`;

  trackByResourceClassFn = (index: number, item: ResourceClassDefinition) => `${index}-${item.id}`;

  displayResource(resId: string | null): string {
    if (this.useDefaultValue) {
      return (this.defaultValue as unknown as ReadLinkValue | undefined)?.strval ?? '';
    }

    if (resId === null) return '';
    return this.resources.find(res => res.id === resId)?.label ?? '';
  }

  private _search(searchTerm: string) {
    let offset = 0;
    this.cancelPreviousSearchRequest$.next();
    const resourceClassIri = this._getRestrictToResourceClass(this.readResource as ReadResource)!;

    this._searchApi(searchTerm, offset, resourceClassIri)
      .pipe(
        takeUntil(this.cancelPreviousSearchRequest$),
        expand(response => {
          if (response.mayHaveMoreResults) {
            offset += 1;
            return this._searchApi(searchTerm, offset, resourceClassIri);
          } else {
            return EMPTY;
          }
        }),
        finalize(() => {
          this.loading = false;
          this._cd.detectChanges();
        })
      )
      .subscribe(response => {
        this.resources = response.resources;
        this._cd.detectChanges();
      });
  }

  private _searchApi = (searchTerm: string, offset: number, resourceClassIri: string) =>
    this._dspApiConnection.v2.search.doSearchByLabel(searchTerm, offset, {
      limitToResourceClass: resourceClassIri,
    });

  private _getRestrictToResourceClass(resource: ReadResource) {
    const linkType = resource.getLinkPropertyIriFromLinkValuePropertyIri(this.propIri);
    return resource.entityInfo.properties[linkType].objectType;
  }

  private _getResourceProperties() {
    const ontologyIri = this.resourceClassIri.split('#')[0];
    this._dspApiConnection.v2.ontologyCache
      .reloadCachedItem(ontologyIri)
      .pipe(switchMap(() => this._dspApiConnection.v2.ontologyCache.getResourceClassDefinition(this.resourceClassIri)))
      .subscribe(onto => {
        const readResource = new ReadResource();
        readResource.entityInfo = onto;
        this.readResource = readResource;

        this._linkValueDataService.onInit(ontologyIri, readResource, this.propIri);
        this.useDefaultValue = false;
        this._cd.detectChanges();
      });
  }
}
