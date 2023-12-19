export class SetCurrentPageAction {
  static readonly type = '[CurrentPage] Set current page';
  constructor(public page: string) {}
}

export class ReloadCurrentPageAction {
  static readonly type = '[CurrentPage] Reload current page';
}

export class AppInitAction {
  static readonly type = '[CurrentPage] App has finished init';
}

export class SetLoginReturnLinkAction {
  static readonly type = '[CurrentPage] Set login return link';
  constructor(public loginReturnLink: string) {}
}
