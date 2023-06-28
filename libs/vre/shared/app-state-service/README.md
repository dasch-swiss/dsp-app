# app-state-service

This library handles the state of the application. It works via a dictionary that stores a key and a `StateContent` object.

The value of the `StateContent` object can be one of the following:
- `ReadUser`
- `ReadUser[]`
- `ReadProject`
- `ReadOntology`
- `ReadOntology[]`
- `ReadGroup[]`
- `ListNodeInfo[]`

## Usage
To use the library, add it to the imports of your library:

    import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';

Then add it to the component via dependecy injection:

    constructor(
      private _applicationStateService: ApplicationStateService,
    ) {}

Normally you get the value for the `StateContent` object from a response from the DSP-API but you can also create your own object if need be.

## Example
Here is an example of making a request to the DSP-API to get all of the groups of which the response is an array of type `ReadGroup`.

    this._dspApiConnection.admin.groupsEndpoint.getGroups().subscribe(
        (response: ApiResponseData<GroupsResponse>) =>
            this._applicationStateService.set('groups_of_' + this.projectCode, response.body.groups)
    );
## Running unit tests

Run `nx test app-state-service` to execute the unit tests.
