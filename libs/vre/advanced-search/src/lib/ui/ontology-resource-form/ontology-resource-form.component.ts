import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { ApiData } from '../../data-access/advanced-search-service/advanced-search.service';

@Component({
    selector: 'dasch-swiss-ontology-resource-form',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSelectModule],
    templateUrl: './ontology-resource-form.component.html',
    styleUrls: ['./ontology-resource-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OntologyResourceFormComponent {
    @Input() ontologies: ApiData[] | null = []; // todo: handle null case in html
    @Input() ontologiesLoading: boolean | null = false;
    @Input() resourceClasses: ApiData[] | null = [];
    @Input() resourceClassesLoading: boolean | null = false;

    @Input() set selectedOntology(ontology: ApiData | null | undefined) {
        if(!this.ontologiesList) return;
        if (ontology) {
            this.ontologiesList.value = ontology;
        } else {
            this.ontologiesList.value = '';
        }
    }

    @Input() set selectedResourceClass(resourceClass: ApiData | null | undefined) {
        if(!this.resourceClassesList) return;
        if (resourceClass) {
            this.resourceClassesList.value = resourceClass;
        } else {
            this.resourceClassesList.value = '';
        }
    }

    @Output() emitSelectedOntology = new EventEmitter<ApiData>();
    @Output() emitSelectedResourceClass = new EventEmitter<ApiData>();

    @ViewChild('ontologiesList') ontologiesList!: MatSelect;
    @ViewChild('resourceClassesList') resourceClassesList!: MatSelect;

    onSelectedOntologyChanged(): void {
        const selectedOntology = this.ontologiesList.value;
        this.emitSelectedOntology.emit(selectedOntology);
    }

    onSelectedResourceClassChanged(): void {
        const selectedResourceClass = this.resourceClassesList.value;
        this.emitSelectedResourceClass.emit(selectedResourceClass);
    }
}
