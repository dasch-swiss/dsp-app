import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiData } from '../../../data-access/advanced-search-service/advanced-search.service';
import { MatInputModule } from '@angular/material/input';
import {
    MatAutocompleteModule,
    MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatAutocompleteOptionsScrollDirective } from '../../directives/mat-autocomplete-options-scroll.directive';
import { PropertyFormItem } from '../../../data-access/advanced-search-store/advanced-search-store.service';
@Component({
    selector: 'dasch-swiss-property-form-link-value',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        MatAutocompleteModule,
        MatAutocompleteOptionsScrollDirective,
    ],
    templateUrl: './property-form-link-value.component.html',
    styleUrls: ['./property-form-link-value.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyFormLinkValueComponent implements OnInit, AfterViewInit {
    @Input() value: string | PropertyFormItem[] | undefined = undefined;
    @Input() label: string | undefined = undefined;
    @Input() resourcesSearchResultsLoading: boolean | null = false;
    @Input() resourcesSearchResultsCount: number | null = 0;
    @Input() resourcesSearchResults: ApiData[] | null = null;
    @Input() resourcesSearchNoResults: boolean | null = false;

    @Output() emitResourceSearchValueChanged = new EventEmitter<string>();
    @Output() emitLoadMoreSearchResults = new EventEmitter<string>();
    @Output() emitResourceSelected = new EventEmitter<ApiData>();

    inputControl = new FormControl();

    ngOnInit() {
        this.inputControl.valueChanges
            .pipe(debounceTime(300), distinctUntilChanged())
            .subscribe((value) => {
                this.emitResourceSearchValueChanged.emit(value);
            });
    }

    ngAfterViewInit(): void {
        if (this.value && typeof this.value === 'string' && this.label) {
            this.inputControl.setValue({ label: this.label, iri: this.value });
        }
    }

    onResourceSelected(event: MatAutocompleteSelectedEvent) {
        const data = event.option.value as ApiData;
        this.emitResourceSelected.emit(data);
    }

    onInputFocused() {
        this.emitResourceSearchValueChanged.emit(this.inputControl.value);
    }

    onScroll() {
        if (!this.resourcesSearchResultsLoading) {
            this.emitLoadMoreSearchResults.emit(this.inputControl.value);
        }
    }

    /**
     * used in the template to display the label of the selected resource
     * because the value we want to display is different than the value we want to emit
     *
     * @param resource the resource containing the label to be displayed (or no selection yet).
     */
    displayResource(resource: ApiData | null): string {
        // null is the initial value (no selection yet)
        if (resource !== null) {
            return resource.label;
        }
        return '';
    }
}
