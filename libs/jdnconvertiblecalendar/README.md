# JDNConvertibleCalendar

## Introduction

`JDNConvertibleCalendar` offers a convenient way to convert a given date to other calendars making use of the *Julian Day*.
The Julian Day is the continuous count of days since the beginning of the Julian Period in 4713 BCE.
The Julian Day Count (JDC) contains a fraction that represents the daytime.
A fraction of .5 represents midnight and .0 represents noon.
For example, the day with the date January 27th 1987 starts with the JDC of 2446822.5 and ends with a JDC of 2446823.4999…
Hence, noon is at 2446823.0.
The corresponding Julian Day Number (JDN) is at noon, which is 2446823 for the given example (January 27th 1987).

For more information about the Julian Day, see: Jean Meeus, Astronomical Algorithms, 1998, 59pp. and <https://en.wikipedia.org/wiki/Julian_day>

Please note that this software uses the (astronomical) convention that BCE dates are represented as negative years and that the year zero (0) is used.
This means that the year 1 BCE must be given as year 0,
and the year 2 BCE corresponds to -1 etc.

Currently, the Gregorian, Julian, and Islamic calendars are supported.

## Focus

The focus of this project is to provide a design or architecture that makes it easy to convert between calendars. It is, however, not primarily a library for astronomical algorithms.
For now, we put the these methods in the module `JDNConvertibleConversionModule`.
We would like to make this an separate module which could be used with `JDNConvertibleCalendar` (see <https://github.com/dhlab-basel/JDNConvertibleCalendar/issues/1>).

## Design

`JDNConvertibleCalendar` is an abstract class that can be implemented for various calendars, provided that those can be converted from and to a Julian Day.

The abstract base class offers a generic way to convert from and to any of its subclasses. Also calculations based on JDN are already implemented in the base class (shifting of a given period to the future or the past).

All dates are treated as periods. This allows for the handling of different precisions.

## Adding more Calendars

When adding a new subclass for `JDNConvertibleCalendar`, calendar specific methods have to be implemented, e.g., the conversion from and to the Julian Day.
Calendar specific methods are declared abstract in the base class and have to be implemented when making a subclass. The new subclass has to be added to `supportedCalendars` (configuration array) and `convertCalendar` (conversion method) in `JDNConvertibleCalendar`.

## Change from the Julian to the Gregorian Calendar

In order to reproduce BCE leap years and the respective length of the month February correctly
we have to distinguish between the Gregorian and Julian calendar when calculating the Julian Day Number.
The separating date is October 15th, 1582 when the Gregorian calendar was introduced in parts of Europe.
Please note that in the Gregorian calendar October 4th, 1582 is immediately followed by October 15th, 1582.

## Scientific board

The project is scientifically accompanied by Rita Gautschy (University of Basel).
She reviewed the calendar conversion algorithms in `JDNConvertibleConversionModule` and provided an implementation in Fortran that allows for comparison of the results.

## Documentation

See <https://dhlab-basel.github.io/JDNConvertibleCalendar/docs/index.html>.

The HTML-documentation can also be built locally running `npm run builddocs` in the project root.

## Examples

For working examples, please see the tests in the test directory. Run the test with `npm test` from the project root.

## Known Problems

- The static configuration of how many months a year has per calendar may not be good enough for other calendars than Gregorian and Julian (lunar calendars).
  Maybe this has to be made a function that returns the number of months for a given year. This would make transposing by month more complicated.

## NPM Package

This project is available as an npm module: <https://www.npmjs.com/package/jdnconvertiblecalendar>.

## Integration in Angular Material

`JDNConvertibleCalendar` can used with Angular Material (<https://material.angular.io>). Please see <https://github.com/dhlab-basel/JDNConvertibleCalendarDateAdapter> for more details.

## Building

Run `nx build jdnconvertiblecalendar` to build the library.

## Running unit tests

Run `nx test jdnconvertiblecalendar` to execute the unit tests via [Jest](https://jestjs.io).
