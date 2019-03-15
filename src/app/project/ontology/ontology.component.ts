import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ApplicationRef, Component, ComponentFactoryResolver, EmbeddedViewRef, Injector, OnInit, ElementRef, ViewChild, ViewContainerRef, Directive, Type } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SelectListComponent } from './select-list/select-list.component';
import { ResourceTypeComponent } from './resource-type/resource-type.component';
import { ComponentFactory } from '@angular/core/src/render3';

@Directive({
    selector: '[add-host]'
})
export class AddToDirective {
    constructor(public viewContainerRef: ViewContainerRef) {}
}

@Component({
    selector: 'app-ontology',
    templateUrl: './ontology.component.html',
    styleUrls: ['./ontology.component.scss']
})
export class OntologyComponent implements OnInit {

    sourcetypes = ['Text', 'Image', 'Video'];

    @ViewChild('ontologyEditor', {read: ViewContainerRef}) ontologyEditor: ViewContainerRef;

    @ViewChild(AddToDirective) addToHost: AddToDirective;

    constructor(private _titleService: Title,
        private _componentFactoryResolver: ComponentFactoryResolver,
        private _appRef: ApplicationRef,
        private _injector: Injector) {

        // set the page title
        this._titleService.setTitle('Ontology Editor');
    }

    ngOnInit() {
    }

    drop(event: CdkDragDrop<string[]>) {
        console.log(event);
    }

    addResourceType(id: string) {
        console.log(id);
        // this.ontologyEditor.nativeElement.insertAdjacentHTML('beforeend', ``);
        // this.appendComponentToBody(SelectListComponent);
    }

    loadComponent() {
        const componentFactory = this._componentFactoryResolver.resolveComponentFactory(ResourceTypeComponent);
        //this._componentFactoryResolver.resolveComponentFactory(ResourceTypeComponent);

        // const viewContainerRef = this.ontologyEditor.
        // viewContainerRef.clear();

        this.ontologyEditor.createComponent(componentFactory);
    }

}
