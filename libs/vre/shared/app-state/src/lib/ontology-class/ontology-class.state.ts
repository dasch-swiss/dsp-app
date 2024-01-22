import { Inject, Injectable } from '@angular/core';
import { ApiResponseError, CountQueryResponse, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { Action, State, StateContext } from '@ngxs/store';
import { finalize, map, take, tap } from 'rxjs/operators';
import { ClearOntologyClassAction, LoadClassItemsCountAction } from './ontology-class.actions';
import { OntologyClassStateModel } from './ontology-class.state-model';

const defaults: OntologyClassStateModel = <OntologyClassStateModel>{
  isLoading: false,
  classItems: {},
};

@State<OntologyClassStateModel>({
  defaults,
  name: 'ontologyClass',
})
@Injectable()
export class OntologyClassState {
  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection
  ) {}

  @Action(LoadClassItemsCountAction)
  loadClassItemsCountAction(
    ctx: StateContext<OntologyClassStateModel>,
    { ontologyIri, resClassId }: LoadClassItemsCountAction
  ) {
    ctx.patchState({ isLoading: true });
    const gravsearch = this._getGravsearch(resClassId);

    return this._dspApiConnection.v2.search.doExtendedSearchCountQuery(gravsearch).pipe(
      take(1),
      map((response: CountQueryResponse | ApiResponseError) => response as CountQueryResponse),
      tap({
        next: (countQueryResponse: CountQueryResponse) => {
          const classItems = ctx.getState().classItems;
          if (!classItems || !classItems[resClassId]) {
            classItems[resClassId] = { ontologyIri, classItemsCount: countQueryResponse.numberOfResults };
          } else {
            classItems[resClassId].ontologyIri = ontologyIri;
            classItems[resClassId].classItemsCount = countQueryResponse.numberOfResults;
          }

          ctx.setState({
            ...ctx.getState(),
            classItems,
          });
        },
      }),
      finalize(() => {
        ctx.patchState({ isLoading: false });
      })
    );
  }

  @Action(ClearOntologyClassAction)
  clearOntologyClass(ctx: StateContext<OntologyClassStateModel>) {
    ctx.setState({ ...defaults });
  }

  private _getGravsearch(iri: string): string {
    return `
        PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
        CONSTRUCT {

        ?mainRes knora-api:isMainResource true .

        } WHERE {

        ?mainRes a knora-api:Resource .

        ?mainRes a <${iri}> .

        }

        OFFSET 0`;
  }
}
