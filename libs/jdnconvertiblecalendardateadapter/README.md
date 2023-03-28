# JDNConvertibleCalendarDateAdapter

## Introduction

`JDNConvertibleCalendarDateAdapter` provides an implementation of the Angular Material [DateAdapter](https://material.angular.io/components/datepicker/overview#choosing-a-date-implementation-and-date-format-settings>) for [JDNConvertibleCalendar](https://www.npmjs.com/package/jdnconvertiblecalendar),
so that the Angular Material DatePicker UI can be used with different calendars.

## NPM Package

`JDNConvertibleCalendarDateAdapter` is available as an [npm module](https://www.npmjs.com/package/jdnconvertiblecalendardateadapter).

## Use with Angular Material Datepicker

Add `jdnconvertiblecalendardateadapter` and `jdnconvertiblecalendar` to the dependencies in your `package.json` and run `npm install`.
Add `MatJDNConvertibleCalendarDateAdapterModule` to your application's module configuration. See [app.module.ts](../../src/app/app.module.ts) as an example.

See also [Angular Material docs](https://material.angular.io/components/datepicker/overview#choosing-a-date-implementation-and-date-format-settings) for instructions how to integrate it with Angular Material.

## Angular Version

This module works with Angular 15 and Angular Material 15 (see [package.json](package.json)).
