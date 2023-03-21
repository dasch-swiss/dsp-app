import { Injectable } from '@angular/core';
import { DeleteValue, ReadFileValue, ReadValue } from '@dasch-swiss/dsp-js';
import { Subject, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

/**
 * https://stackoverflow.com/questions/56290722/how-pass-a-event-from-deep-nested-child-to-parent-in-angular-2
 * This service is used as a way to enable components to communicate with each other no matter how nested they are.
 * This is intended to provide a cleaner way to emit events from nested components than chaining '@Outputs'.
 * The ValueOperationEventService essentially creates a direct communication channel between
 * the emitting component and the listening component.
 */
@Injectable({
    providedIn: 'root',
}) // must be provided on component level, i.e. resource view component.
export class ValueOperationEventService {
    // create a subject to hold data which can be subscribed to.
    // you only get the data after you subscribe.
    private _subject$ = new Subject();

    // used in the listening component.
    // i.e. this.valueOperationEventSubscription = this._valueOperationEventService.on(Events.ValueAdded, () => doSomething());
    on(event: Events, action: (value: EventValue) => void): Subscription {
        return this._subject$
            .pipe(
                // filter down based on event name to any events that are emitted out of the subject from the emit method below.
                filter((e: EmitEvent) => e.name === event),
                map((e: EmitEvent) => e.value)
            )
            .subscribe(action); // subscribe to the subject to get the data.
    }

    // used in the emitting component.
    // i.e. this.valueOperationEventService.emit(new EmitEvent(Events.ValueAdded, new EventValues(new ReadValue()));
    emit(event: EmitEvent) {
        this._subject$.next(event);
    }
}

export class EmitEvent {
    constructor(public name: Events, public value?: EventValue) {}
}

// possible events that can be emitted.
export enum Events {
    ValueAdded,
    ValueDeleted,
    ValueUpdated,
    FileValueUpdated,
}

export abstract class EventValue {}

export class AddedEventValue extends EventValue {
    constructor(public addedValue: ReadValue) {
        super();
    }
}

export class UpdatedEventValues extends EventValue {
    constructor(
        public currentValue: ReadValue,
        public updatedValue: ReadValue
    ) {
        super();
    }
}

export class DeletedEventValue extends EventValue {
    constructor(public deletedValue: DeleteValue) {
        super();
    }
}

export class UpdatedFileEventValue extends EventValue {
    constructor(public updatedFileValue: ReadValue) {
        super();
    }
}
