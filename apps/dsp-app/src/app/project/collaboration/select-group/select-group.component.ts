import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import {
    ReadGroup,
} from '@dasch-swiss/dsp-js';
import { AutocompleteItem } from '@dsp-app/src/app/workspace/search/operator';
import { IKeyValuePairs, ProjectsSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-select-group',
    templateUrl: './select-group.component.html',
    styleUrls: ['./select-group.component.scss'],
})
export class SelectGroupComponent implements OnInit, OnDestroy, AfterViewInit {
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    // project short code
    @Input() projectCode: string;

    // project iri
    @Input() projectid: string;

    // users permissions from user data
    @Input() permissions: any;

    // disable the selection; in case a user doesn't have the rights to change the permission
    @Input() disabled?: boolean = false;

    // send the changes to the parent
    @Output() groupChange: EventEmitter<any> = new EventEmitter<any>();

    // default system groups and project specific groups
    get projectGroups$(): Observable<AutocompleteItem[]> {
        return this.allProjectGroups$
        .pipe(
            takeUntil(this.ngUnsubscribe),
            map((projectGroups) => {
                if (!projectGroups[this.projectid]) {
                    return [];
                }

                return projectGroups[this.projectid].value.map(group => <AutocompleteItem>{
                    iri: group.id,
                    name: group.name,
                });
            })
        );
    }

    groupCtrl = new UntypedFormControl();

    // send data only, when the selection has changed
    sendData = false;

    @Select(ProjectsSelectors.projectGroups) allProjectGroups$: Observable<IKeyValuePairs<ReadGroup>[]>;

    constructor(private _cd: ChangeDetectorRef) {}

    ngOnInit() {
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.groupCtrl.setValue(this.permissions);
        });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    trackByFn = (index: number, item: AutocompleteItem) => `${index}-${item.label}`;

    onGroupChange() {
        // get the selected values onOpen and onClose
        // and compare them with the current values from user profile
        // compare the selected data with the permissions data
        this.sendData = this.compare(this.permissions, this.groupCtrl.value);

        if (this.sendData) {
            this.permissions = this.groupCtrl.value;
            this.groupChange.emit(this.groupCtrl.value);
        }
    }

    onGroupSelect() {
        // if change is true, the onGroupChange is active
        // with this method we prevent to submit data already by opening the selection
        // it should emit the data when closing the selection and if the data has changed!
        // this.sendData = (this.groupCtrl.value !== this.permissions);
    }

    /**
     * compare two arrays and return true, if they are different
     * @param arrOne string array
     * @param arrTwo string array
     */
    compare(arrOne: string[], arrTwo: string[]): boolean {
        arrOne = arrOne.sort((n1, n2) => {
            if (n1 > n2) {
                return 1;
            }

            if (n1 < n2) {
                return -1;
            }

            return 0;
        });

        arrTwo = arrTwo.sort((n1, n2) => {
            if (n1 > n2) {
                return 1;
            }

            if (n1 < n2) {
                return -1;
            }

            return 0;
        });

        return JSON.stringify(arrOne) !== JSON.stringify(arrTwo);
    }
}
