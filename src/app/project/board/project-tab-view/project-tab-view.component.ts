import { Component, Input, OnInit } from '@angular/core';
import {
    DataManagementPlan,
    Grant, IId, Organization, Person, SingleProject
} from '@dasch-swiss/dsp-js';
import { MetadataService } from '../dataset-metadata.service';

@Component({
    selector: 'app-project-tab-view',
    templateUrl: './project-tab-view.component.html',
    styleUrls: ['./project-tab-view.component.scss']
})
export class ProjectTabViewComponent implements OnInit {

    // metadata object
    @Input() selectedProject: SingleProject;
    @Input() subProperties: Object;

    // metadata keys that we do not want to display in template
    excludeKeys = ['contactPoint'];

    // list of date keys from metadata object
    // used for formatting
    dateKeys = ['startDate', 'endDate'];

    // keys that require IUrl template
    iUrlTemplatesKeys = ['discipline', 'temporalCoverage', 'url'];

    dmps: DataManagementPlan[] = [];
    funders: Person[] | Organization[] = [];
    funderType: string;
    grants = [];

    constructor(private _metadataService: MetadataService) {
    }

    ngOnInit() {

        // get DMP
        if (this.selectedProject.dataManagementPlan) {
            this.dmps = this.getDMP(this.selectedProject.dataManagementPlan);
        }

        // get funder details
        this.getFunders(this.selectedProject.funder);

        // get grants if present
        if (this.selectedProject.grant) {
            this.getGrants(this.selectedProject.grant);
        }

    }

    getDMP(currenDmps: DataManagementPlan | IId[]): DataManagementPlan[] {
        if (currenDmps instanceof DataManagementPlan) {
            return [currenDmps];
        }

        const tmp: DataManagementPlan[] = [];
        for (const iid of currenDmps) {
            tmp.push(this.subProperties[iid.id]);
        }
        return tmp;
    }

    getFunders(flist: any[]) {
        // check if it is person, organization or IId
        this.funderType = this._metadataService.getContactType(flist[0]);

        if (this.funderType) {
            this.funders = flist;
            return;
        }

        for (const funder of flist) {
            this.funders.push(this.subProperties[funder.id]);
        }
        this.funderType = this._metadataService.getContactType(this.funders[0]);
    }

    getGrants(glist: any[]) {
        let tmpGrants: Grant[] = [];

        if (glist[0] instanceof Grant) {
            tmpGrants = glist;
        } else {
            // if it is IId objects array, retrive it's details
            for (const iid of glist) {
                tmpGrants.push(this.subProperties[iid.id]);
            }
        }
        // get funder details along with other details
        for (const grant of tmpGrants) {

            // checck if grant contains person, organization or IId objects
            let ftype = this._metadataService.getContactType(grant.funder[0]);
            let flist = [];
            if (ftype) {
                // it is a person of organization object
                flist = grant.funder;
            } else {
                // it means it is a IId object. So we need to retrive the details
                // of every funder using the id provided here
                for (const fund of grant.funder) {
                    flist.push(this.subProperties[fund.id]);
                }
                ftype = this._metadataService.getContactType(flist[0]);
            }

            const tmpGrantObj = {
                funder : flist,
                funderType: ftype,
                name: grant.name ? grant.name : undefined,
                number: grant.number ? grant.number : undefined,
                url: grant.url ? grant.url : undefined
            };

            this.grants.push(tmpGrantObj);
        }
    }

}
