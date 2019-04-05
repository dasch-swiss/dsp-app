import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiServiceError, Project, ProjectsService, User } from '@knora/core';
import { CacheService } from '../../main/cache/cache.service';
import { Session } from '@knora/authentication';

@Component({
    selector: 'app-board',
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {
    loading: boolean;

    projectcode: string;

    project: Project;
    loggedInAdmin: boolean = false;
    projectMembers: User[] = [];

    // i18n setup
    itemPluralMapping = {
        member: {
            // '=0': '0 Members',
            '=1': '1 Member',
            other: '# Members'
        },
        ontology: {
            // '=0': '0 Ontologies',
            '=1': '1 Ontology',
            other: '# Ontologies'
        },
        keyword: {
            // '=0': '0 Keywords',
            '=1': '1 Keyword',
            other: '# Keywords'
        }
    };

    constructor(
        private _cache: CacheService,
        private _route: ActivatedRoute,
        private _projectsService: ProjectsService,
        private _titleService: Title
    ) {
        // get the shortcode of the current project
        this.projectcode = this._route.parent.snapshot.params.shortcode;

        // set the page title
        this._titleService.setTitle('Project ' + this.projectcode);
    }

    ngOnInit() {
        this.loading = true;

        // get project data from cache
        this._cache
            .get(
                this.projectcode,
                this._projectsService.getProjectByShortcode(this.projectcode)
            )
            .subscribe(
                (result: any) => {
                    this.project = result;

                    this._cache.get('projectAdmin').subscribe(
                        (pa: boolean) => {
                            this.loggedInAdmin = pa;
                        }
                    );

                    this.loading = false;
                },
                (error: ApiServiceError) => {
                    console.error(error);
                }
            );

        /*
        this._cache.get('members_of_' + this.projectcode, this._projectsService.getProjectMembersByShortcode(this.projectcode)).subscribe(
            (result: User[]) => {
                this.projectMembers = result;
            },
            (error: ApiServiceError) => {
                console.error(error);
            }
        );
        */

        this.loading = false;
    }
}
