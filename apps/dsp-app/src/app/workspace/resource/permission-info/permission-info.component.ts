import {
  ConnectionPositionPair,
  OriginConnectionPosition,
  OverlayConnectionPosition,
  ScrollStrategy,
  ScrollStrategyOptions,
} from '@angular/cdk/overlay';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { PermissionUtil } from '@dasch-swiss/dsp-js';

export interface PermissionObj {
  name: string;
  label: string;
  icon: string;
}

export interface PermissionGroup {
  group: string; // e.g knora-admin:ProjectAdmin
  restriction: PermissionUtil.Permissions[];
}

@Component({
  selector: 'app-permission-info',
  templateUrl: './permission-info.component.html',
  styleUrls: ['./permission-info.component.scss'],
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
  // https://docs.dasch.swiss/latest/DSP-API/02-knora-ontologies/knora-base/?h=unknown#permissions
  defaultPermissions: PermissionObj[] = [
    {
      name: 'RV',
      label: 'Restricted view permission (RV)',
      icon: 'visibility_off', // or disabled_visible or block
    },
    {
      name: 'V',
      label: 'View permission (V)',
      icon: 'visibility',
    },
    {
      name: 'M',
      label: 'Modify permission (M)',
      icon: 'mode_edit',
    },
    {
      name: 'D',
      label: 'Delete permission (D)',
      icon: 'delete',
    },
    {
      name: 'CR',
      label: 'Change rights permission (CR)',
      icon: 'admin_panel_settings', // or key
    },
  ];

  // default user groups based on DSP-API users and groups concept:
  // https://docs.dasch.swiss/latest/DSP-API/02-knora-ontologies/knora-base/?h=unknown#users-and-groups
  defaultGroups: string[] = [
    'knora-admin:SystemAdmin',
    'knora-admin:ProjectAdmin',
    'knora-admin:Creator',
    'knora-admin:ProjectMember',
    'knora-admin:KnownUser',
    'knora-admin:UnknownUser',
  ];

  listOfPermissions: PermissionGroup[] = [];

  userRestrictions: PermissionUtil.Permissions[];

  scrollStrategy: ScrollStrategy;

  infoBoxPositions: ConnectionPositionPair[];
  private _originPos: OriginConnectionPosition = {
    originX: 'end',
    originY: 'bottom',
  };

  private _overlayPos: OverlayConnectionPosition = {
    overlayX: 'end',
    overlayY: 'top',
  };

  constructor(private _sso: ScrollStrategyOptions) {
    // close the info box on scrolling
    this.scrollStrategy = this._sso.close();
  }

  ngOnInit(): void {
    if (this.hasPermissions) {
      // split by | to get each permission section
      const sections = this.hasPermissions.split('|');

      sections.forEach(section => {
        // split by space
        const unit = section.split(' ');

        const allPermissions = PermissionUtil.allUserPermissions(
          unit[0] as 'RV' | 'V' | 'M' | 'D' | 'CR'
        );

        // a section could look like CR knora-admin:Creator
        // but also like CR knora-admin:Creator,knora-admin:ProjectAdmin --> in this case we have to split the section again
        if (unit[1].indexOf(',') > -1) {
          unit[1].split(',').forEach(group => {
            // add to list of permissions
            this.pushToListOfPermissions(group, allPermissions);
          });
        } else {
          // add to list of permissions
          this.pushToListOfPermissions(unit[1], allPermissions);
        }
      });

      // bring the list of group permissions into correct order: from high to low user group
      this.defaultGroups.forEach((group, i) => {
        // current index
        const currentIndex = this.listOfPermissions.findIndex(
          e => e.group === group
        );

        if (currentIndex !== -1) {
          // new index = i
          this.arrayMove(this.listOfPermissions, currentIndex, i);
        }
      });
    }

    // display current user's permission
    if (this.userHasPermission) {
      this.userRestrictions = PermissionUtil.allUserPermissions(
        this.userHasPermission as 'RV' | 'V' | 'M' | 'D' | 'CR'
      );
    }
  }

  /**
   * open or close permission info box
   */
  toggleMenu() {
    this.isOpen = !this.isOpen;

    const pos: ConnectionPositionPair = new ConnectionPositionPair(
      this._originPos,
      this._overlayPos,
      0,
      0
    );

    this.infoBoxPositions = [pos];
  }

  /**
   * returns status of a permission value if it's set or not
   * @param restriction
   * @param listOfRestrictions
   * @returns true if permission value is set
   */
  getStatus(restriction: string, listOfRestrictions: number[]): boolean {
    return (
      listOfRestrictions.indexOf(PermissionUtil.Permissions[restriction]) !== -1
    );
  }

  /**
   * sorts the array
   * @param arr
   * @param fromIndex
   * @param toIndex
   */
  arrayMove(arr: PermissionGroup[], fromIndex: number, toIndex: number) {
    const element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
  }

  /**
   * pushs user group's permission to list of permissions, if this group does not exist
   * otherwise it compares the permission level and replaces it, if it's higher
   * @param group
   * @param restriction
   */
  pushToListOfPermissions(
    group: string,
    restriction: PermissionUtil.Permissions[]
  ) {
    // in API v17.5.1 (and all prev versions) the default string could look like:
    // "CR knora-admin:ProjectAdmin|D knora-admin:ProjectAdmin|M knora-admin:ProjectAdmin|V knora-admin:ProjectAdmin|RV knora-admin:ProjectAdmin"
    // in this case we should display this user group only once but with the highest permission only

    const index = this.listOfPermissions.findIndex(
      (object: PermissionGroup) => object.group === group
    );
    const permission: PermissionGroup = {
      group: group,
      restriction: restriction,
    };

    // add to list of Permissions if it does not exist yet
    if (index === -1) {
      this.listOfPermissions.push(permission);
    } else {
      // if it exists, compare the permission level and replace if it's higher
      if (
        this.listOfPermissions[index].restriction.length < restriction.length
      ) {
        this.listOfPermissions[index] = permission;
      }
    }
  }
}
