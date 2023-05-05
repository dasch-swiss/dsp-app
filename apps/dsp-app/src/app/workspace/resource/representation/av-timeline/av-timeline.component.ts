import { CdkDragMove } from '@angular/cdk/drag-drop';
import {
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    OnChanges,
    Output,
    SimpleChange,
    ViewChild,
} from '@angular/core';
import { SplitSize } from '@dsp-app/src/app/workspace/results/results.component';

export interface PointerValue {
    position: number;
    time: number;
}
/**
 * this component can be used in video and audio players
 */
@Component({
    selector: 'app-av-timeline',
    templateUrl: './av-timeline.component.html',
    styleUrls: ['./av-timeline.component.scss'],
})
export class AvTimelineComponent implements OnChanges {
    // current time value
    @Input() value: number;

    // start time value
    @Input() min? = 0;

    // end time value: Normally this is the duration
    @Input() max: number;

    // in case parent resized: Will be used in video player when switching between cinema and default view
    @Input() resized: boolean;

    // disable in case of missing file
    @Input() disabled: boolean;

    // split size changed
    @Input() splitSizeChanged: SplitSize;

    // send click position to parent
    @Output() changed = new EventEmitter<number>();

    // send mouse position to parent
    @Output() move = new EventEmitter<PointerValue>();

    // send dimension and position of the timeline
    @Output() dimension = new EventEmitter<DOMRect>();

    // timeline element: main container
    @ViewChild('timeline') timelineEle: ElementRef;

    // progress element: thin bar line
    @ViewChild('progress') progressEle: ElementRef;

    // thumb element: current postion pointer
    @ViewChild('thumb') thumbEle: ElementRef;

    // in case of draging the thumb element
    dragging = false;

    // size of timeline; will be used to calculate progress position in pixel corresponding to time value
    timelineDimension: DOMRect | null = null;

    constructor() {}

    @HostListener('mouseenter', ['$event']) onEnter() {
        this._onMouseenter();
    }

    @HostListener('mousemove', ['$event']) onMousemove(e: MouseEvent) {
        this._onMousemove(e);
    }

    @HostListener('mouseup', ['$event']) onMouseup(e: MouseEvent) {
        this._onMouseup(e);
    }

    @HostListener('window:resize', ['$event']) onWindowResize() {
        this._onWindowResize();
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {
        if (!this.timelineEle && !this.progressEle) {
            return;
        }

        if (changes.splitSizeChanged) {
            // reset the timeline dimension
            this.timelineDimension = this._getResizedTimelineDimensions();
        }

        if (!this.timelineDimension) {
            // calculate timeline dimension if it doesn't exist
            this.timelineDimension = this._getTimelineDimensions();
        } else {
            // recalculate timeline dimension because resized parameter has changed
            if (changes.resized) {
                this.timelineDimension = this._getResizedTimelineDimensions();
            }
        }

        // emit the dimension to the parent
        this.dimension.emit(this.timelineDimension);

        // update pointer position from time
        this.updatePositionFromTime(this.value);
    }

    /**
     * updates position from time value
     * @param time
     */
    updatePositionFromTime(time: number) {
        // calc position on the x axis from time value
        const percent: number = time / this.max;

        const pos: number = this.timelineDimension.width * percent;

        this.updatePosition(pos);
    }

    /**
     * updates position of the thumb
     * @param pos
     */
    updatePosition(pos: number) {
        // already played time: fill with red background color
        const fillPos = pos / this.timelineDimension.width;

        // background (timeline fill) start position
        const bgPos = 1 - fillPos;

        if (!this.dragging) {
            // update thumb position if not dragging
            this.thumbEle.nativeElement.style.transform =
                'translateX(' + pos + 'px) scale(.7)';
        }
        // adjust progress width / fill already played time
        this.progressEle.nativeElement.children[0].style.transform =
            'translateX(0px) scale3d(' + bgPos + ', 1, 1)';
        // adjust progress width / progress background
        this.progressEle.nativeElement.children[2].style.transform =
            'translateX(0px) scale3d(' + fillPos + ', 1, 1)';
    }

    /**
     * toggles dragging
     */
    toggleDragging() {
        this.dragging = !this.dragging;
    }

    /**
     * drags action
     * @param ev
     */
    dragAction(ev: CdkDragMove) {
        const pos: number = ev.pointerPosition.x - this.timelineDimension.left;
        this.updatePosition(pos);
    }

    /**
     * mouse enters timeline
     */
    private _onMouseenter() {
        this.timelineDimension = this._getTimelineDimensions();
    }

    /**
     * mouse moves on timeline
     */
    private _onMousemove(ev: MouseEvent) {
        const pos: number = ev.clientX - this.timelineDimension.left;

        const percent: number = pos / this.timelineDimension.width;

        let time: number = percent * this.max;

        if (time < 0) {
            time = 0;
        } else if (time > this.max) {
            time = this.max;
        }

        this.move.emit({ position: ev.clientX, time });
    }

    /**
     * determines action after click or drop event
     * @param ev
     */
    private _onMouseup(ev: MouseEvent) {
        if (!this.disabled) {
            const pos: number = ev.clientX - this.timelineDimension.left;

            this.updatePosition(pos);

            const percentage: number = pos / this.timelineDimension.width;

            // calc time value to submit to parent
            const time: number = percentage * this.max;

            this.changed.emit(time);
        }
    }

    /**
     * event listener on window resize
     */
    private _onWindowResize() {
        this.timelineDimension = this._getResizedTimelineDimensions();
        this.updatePositionFromTime(this.value);
        this.dimension.emit(this.timelineDimension);
    }

    /**
     * get the bounding client rect of the slider track element.
     * The track is used rather than the native element to ignore the extra space that the thumb can
     * take up.
     */
    private _getTimelineDimensions(): DOMRect | null {
        return this.timelineEle
            ? this.timelineEle.nativeElement.getBoundingClientRect()
            : null;
    }

    /**
     * gets resized timeline dimensions
     * @returns resized timeline dimensions
     */
    private _getResizedTimelineDimensions(): DOMRect | null {
        // recalculate timeline dimension
        const newDimension: DOMRect = this._getTimelineDimensions();

        if (this.timelineDimension.width !== newDimension.width) {
            return newDimension;
        } else {
            return;
        }
    }
}
