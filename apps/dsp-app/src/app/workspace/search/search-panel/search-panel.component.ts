import { ConnectionPositionPair, Overlay, OverlayConfig, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { SearchParams } from '../../results/list-view/list-view.component';

@Component({
  selector: 'app-search-panel',
  templateUrl: './search-panel.component.html',
  styleUrls: ['./search-panel.component.scss'],
})
export class SearchPanelComponent {
  /**
   * @param [projectfilter] If true it shows the selection of projects to filter by one of them
   * Default value: false
   */
  @Input() projectfilter?: boolean = false;

  /**
   * filter ontologies in advanced search or query in fulltext search by specified project IRI
   *
   * @param limitToProject
   */
  @Input() limitToProject?: string;

  /**
   * @param [advanced] Adds the extended / advanced search to the panel
   * Default value: false
   */
  @Input() advanced?: boolean = false;

  /**
   * @param [expert] Adds the expert search / gravsearch editor to the panel
   * Default value: false
   */
  @Input() expert?: boolean = false;

  /**
   * the data event emitter of type SearchParams
   *
   * @param  search
   */
  @Output() search = new EventEmitter<SearchParams>();

  @ViewChild('fullSearchPanel', { static: false }) searchPanel: ElementRef;

  @ViewChild('searchMenu', { static: false }) searchMenu: TemplateRef<any>;

  // overlay reference
  overlayRef: OverlayRef;

  // show advanced or expert search
  showAdvanced: boolean;
  showExpert: boolean;
  showHint: boolean;

  constructor(
    private _overlay: Overlay,
    private _viewContainerRef: ViewContainerRef,
    private _router: Router,
    private _route: ActivatedRoute
  ) {}

  routeToAdvancedSearch() {
    this._route.firstChild.paramMap.subscribe((params: Params) => {
      const uuid = params.get('uuid');

      const navigationExtras = {
        state: { uuid },
      };

      this._router.navigate(['advanced-search'], navigationExtras);
    });
  }

  openPanelWithBackdrop(type: string) {
    this.showAdvanced = type === 'advanced';
    this.showExpert = type === 'expert';
    this.showHint = type === 'hint';

    const config = new OverlayConfig({
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      positionStrategy: this.getOverlayPosition(),
      scrollStrategy: this._overlay.scrollStrategies.block(),
    });

    this.overlayRef = this._overlay.create(config);
    this.overlayRef.attach(new TemplatePortal(this.searchMenu, this._viewContainerRef));
    this.overlayRef.backdropClick().subscribe(() => {
      this.showAdvanced = false;
      this.showExpert = false;
      this.showHint = false;
      this.overlayRef.detach();
    });
  }

  getOverlayPosition(): PositionStrategy {
    const positions = [
      new ConnectionPositionPair({ originX: 'start', originY: 'bottom' }, { overlayX: 'start', overlayY: 'top' }),
      new ConnectionPositionPair({ originX: 'start', originY: 'top' }, { overlayX: 'start', overlayY: 'bottom' }),
    ];

    // tslint:disable-next-line: max-line-length
    const overlayPosition = this._overlay
      .position()
      .flexibleConnectedTo(this.searchPanel)
      .withPositions(positions)
      .withLockedPosition(false);

    return overlayPosition;
  }

  updateLimitToProject(id: string) {
    this.limitToProject = id;
  }

  /**
   * emit the search parameters
   *
   * @param data
   */
  emitSearch(data: any) {
    this.search.emit(data);
    this.closeMenu();
  }

  /**
   * close the search menu
   */
  closeMenu(): void {
    this.showAdvanced = false;
    this.showExpert = false;
    this.showHint = false;
    if (this.overlayRef) {
      this.overlayRef.detach();
    }
  }
}
