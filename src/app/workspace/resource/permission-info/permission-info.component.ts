import {
    ConnectionPositionPair,
    OriginConnectionPosition,
    OverlayConnectionPosition,
    ScrollStrategy,
    ScrollStrategyOptions
} from '@angular/cdk/overlay';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { PermissionUtil } from '@dasch-swiss/dsp-js';

export interface PermissionObj {
    name: string;
    label: string;
    icon: string;
}

export interface PermissionGroup {
    group: string;
    restriction: PermissionUtil.Permissions[];
}

@Component({
    selector: 'app-permission-info',
    templateUrl: './permission-info.component.html',
    styleUrls: ['./permission-info.component.scss']
})
export class PermissionInfoComponent implements OnInit {

    // the permission info can display the `hasPermission` of a resource and `userHasPermission`together
    // or only user's permission in case of restricted view
    @Input() hasPermissions: string;

    @Input() userHasPermission: string;

    @ViewChild('infoButton', { static: false }) infoButton: ElementRef;

    // info menu is open or not
    isOpen = false;

    // default premission values based on DSP-API permissions concept:
    // https://docs.dasch.swiss/DSP-API/02-knora-ontologies/knora-base/?h=unknown#permissions
    defaultPermissions: PermissionObj[] = [
        {
            name: 'RV',
            label: 'Restricted view permission (RV)',
            icon: 'visibility_off' // or disabled_visible or block
        },
        {
            name: 'V',
            label: 'View permission (V)',
            icon: 'visibility'
        },
        {
            name: 'M',
            label: 'Modify permission (M)',
            icon: 'mode_edit'
        },
        {
            name: 'D',
            label: 'Delete permission (D)',
            icon: 'delete'
        },
        {
            name: 'CR',
            label: 'Change rights permission (CR)',
            icon: 'admin_panel_settings' // or key
        }
    ];

    // default user groups based on DSP-API users and groups concept:
    // https://docs.dasch.swiss/DSP-API/02-knora-ontologies/knora-base/?h=unknown#users-and-groups
    defaultGroups: string[] = [
        'knora-admin:SystemAdmin',
        'knora-admin:ProjectAdmin',
        'knora-admin:Creator',
        'knora-admin:ProjectMember',
        'knora-admin:KnownUser',
        'knora-admin:UnknownUser'
    ];

    listOfPermissions: PermissionGroup[] = [];

    userRestrictions: PermissionUtil.Permissions[];

    scrollStrategy: ScrollStrategy;

    infoBoxPositions: ConnectionPositionPair[];
    private _originPos: OriginConnectionPosition = {
        originX: 'end',
        originY: 'bottom'
    };

    private _overlayPos: OverlayConnectionPosition = {
        overlayX: 'end',
        overlayY: 'top'
    };

    constructor(
        private _sso: ScrollStrategyOptions
    ) {
        this.scrollStrategy = this._sso.noop();
    }

    ngOnInit(): void {

        if (this.hasPermissions) {
            // split by | to get each permission section
            const sections = this.hasPermissions.split('|');

            sections.forEach(item => {
                // split by space
                const unit = item.split(' ');

                const allPermissions = PermissionUtil.allUserPermissions(
                    unit[0] as 'RV' | 'V' | 'M' | 'D' | 'CR'
                );

                const permission: PermissionGroup = {
                    'group': unit[1],
                    'restriction': allPermissions
                };

                this.listOfPermissions.push(permission);

            });

            this.defaultGroups.forEach((group, i) => {

                // current index
                const currentIndex = this.listOfPermissions.findIndex(e => e.group === group);

                if (currentIndex !== -1) {
                    // new index = i
                    this.arrayMove(this.listOfPermissions, currentIndex, i);
                }

            });
        }

        if (this.userHasPermission) {
            this.userRestrictions = PermissionUtil.allUserPermissions(
                this.userHasPermission as 'RV' | 'V' | 'M' | 'D' | 'CR'
            );
        }

    }

    toggleMenu() {
        this.isOpen = !this.isOpen;
        // console.log(this.infoButton)
        const pos: ConnectionPositionPair = new ConnectionPositionPair(
            this._originPos,
            this._overlayPos,
            0,
            0
        );

        this.infoBoxPositions = [pos];
    }

    getStatus(restriction: string, listOfRestrictions: number[]): boolean {
        return (listOfRestrictions.indexOf(PermissionUtil.Permissions[restriction]) !== -1);
    }

    arrayMove(arr: PermissionGroup[], fromIndex: number, toIndex: number) {
        const element = arr[fromIndex];
        arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, element);
    }

}

