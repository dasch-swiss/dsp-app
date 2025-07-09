import { ConnectionPositionPair, ScrollStrategyOptions } from '@angular/cdk/overlay';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { ApiResponseData, GroupResponse, KnoraApiConnection, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { Interaction, ResourceUtil } from '@dasch-swiss/vre/resource-editor/representations';
import { filter, map, take } from 'rxjs/operators';
import {
  GroupPermissionsUtil,
  Permission,
  PermissionGroup,
  PermissionHeaderItem,
  USER_GROUP_LEVELS,
} from './resource-permission';

@Component({
  selector: 'app-permission-info',
  templateUrl: './permission-info.component.html',
  styleUrls: ['./permission-info.component.scss'],
})
export class PermissionInfoComponent implements OnInit {
  @Input({ required: true }) resource!: ReadResource;

  isOpen = false;

  permissionGroups: PermissionGroup[] = [];

  private _gpu!: GroupPermissionsUtil;

  get scrollStrategy() {
    return this._scrollStrategyOptions.reposition();
  }

  get userPermissions(): Permission[] {
    return this.PERMISSION_HEADERS.map(permission => ({
      interaction: permission.interaction,
      label: permission.label,
      granted: ResourceUtil.isInteractionGranted(this.resource, permission.interaction as Interaction),
    }));
  }

  readonly PERMISSION_HEADERS: PermissionHeaderItem[] = [
    {
      interaction: 'RV',
      label: 'resourceEditor.permissionInfo.interactions.restrictedView',
      icon: 'visibility_off',
    },
    {
      interaction: 'V',
      label: 'resourceEditor.permissionInfo.interactions.view',
      icon: 'visibility',
    },
    {
      interaction: 'M',
      label: 'resourceEditor.permissionInfo.interactions.modify',
      icon: 'mode_edit',
    },
    {
      interaction: 'D',
      label: 'resourceEditor.permissionInfo.interactions.delete',
      icon: 'delete',
    },
    {
      interaction: 'CR',
      label: 'resourceEditor.permissionInfo.interactions.changeRights',
      icon: 'admin_panel_settings',
    },
  ] as const;

  readonly INFOBOX_POSITIONS: ConnectionPositionPair[] = [
    new ConnectionPositionPair({ originX: 'end', originY: 'bottom' }, { overlayX: 'end', overlayY: 'top' }, 0, 0),
  ];

  constructor(
    private _scrollStrategyOptions: ScrollStrategyOptions,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection
  ) {}

  ngOnInit() {
    this._gpu = new GroupPermissionsUtil(this.resource);
    this._setGroupPermissions();
    this._setUsersPermissions();
    this._setCustomGroupsPermissions();
  }

  private _setGroupPermissions() {
    USER_GROUP_LEVELS.forEach((_level, group) => {
      const label = `resourceEditor.permissionInfo.${group.charAt(0).toLowerCase() + group.slice(1)}`;
      const permissions = this.PERMISSION_HEADERS.map(permission => {
        return {
          interaction: permission.interaction,
          granted: this._gpu.isInteractionGrantedForGroup(permission.interaction, group),
        };
      });

      this.permissionGroups.push({ group, label, permissions });
    });
  }

  private _setUsersPermissions() {
    this.permissionGroups.push({
      group: 'UsersPermissions',
      label: `resourceEditor.permissionInfo.usersPermissions`,
      permissions: this.userPermissions,
    });
  }

  private _setCustomGroupsPermissions() {
    this._gpu.customGroups.forEach((_permission, group) => {
      this._dspApiConnection.admin.groupsEndpoint
        .getGroupByIri(group)
        .pipe(
          take(1),
          filter((r): r is ApiResponseData<GroupResponse> => !!r.status && r.status === 200),
          map(groupData => groupData.body.group)
        )
        .subscribe(groupData => {
          const permissionGroup: PermissionGroup = {
            group: 'CustomGroup',
            label: groupData.name,
            permissions: this.PERMISSION_HEADERS.map(p => {
              return {
                interaction: p.interaction,
                granted: this._gpu.isInteractionGrantedForCustomGroup(p.interaction, group),
              };
            }),
          };
          this.permissionGroups.splice(this.permissionGroups.length - 1, 0, permissionGroup);
        });
    });
  }
}
