import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { ProjectsService } from '@knora/core';
import { CacheService } from '../../main/cache/cache.service';

@Component({
  selector: 'app-ontology-list',
  templateUrl: './ontology-list.component.html',
  styleUrls: ['./ontology-list.component.scss']
})
export class OntologyListComponent implements OnInit {

    loading: boolean;

    projectcode: string;

    constructor(private _cache: CacheService,
                private _projectsService: ProjectsService,
                private _route: ActivatedRoute,
                private _titleService: Title) {

        // get the shortcode of the current project
        this._route.parent.paramMap.subscribe((params: Params) => {
            this.projectcode = params.get('shortcode');
        });

        // set the page title
        this._titleService.setTitle('Project ' + this.projectcode + ' | Ontologies');

    }

  ngOnInit() {
  }

}
