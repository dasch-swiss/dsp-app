# Adding translations

Translation values are added by default to all the locale files in English and
once a while are translated in bulk.

# Translation labels structure

1. Root library name segment. I.e.: 3rdPartyServices, core, etc. (Required)
2. Secondary identifier from top segment. I.e.: userSettings, propertiesDisplay, etc. (Optional)
3. Tertiary and deeper identifier segments according to the path of the label file in nx lib folder. I.e.: passwordForm, imageSettings etc. (Optional)
4. Label name

## Label path examples:

ui.pager.firstPage in libs/vre/ui/ui/src/lib/pager/pager.component.html - root and secondary segments only
pages.userSettings.account.deleteButton in libs/vre/pages/user-settings/user/src/lib/account/account.component.html - root, secondary and tertiary segments

Label and path names should be in camelCase
