import { TestBed } from '@angular/core/testing';

import {
    Constants,
    KnoraDate,
    MockResource,
    ReadDateValue,
    ReadIntValue,
    ReadLinkValue,
    ReadTextValueAsHtml,
    ReadTextValueAsString,
    ReadTextValueAsXml,
    ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { ValueService } from './value.service';

describe('ValueService', () => {
    let service: ValueService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ValueService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getValueTypeOrClass', () => {
        it('should return type of int', () => {
            const readIntValue = new ReadIntValue();
            readIntValue.type =
                'http://api.knora.org/ontology/knora-api/v2#IntValue';
            expect(service.getValueTypeOrClass(readIntValue)).toEqual(
                'http://api.knora.org/ontology/knora-api/v2#IntValue'
            );
        });

        it('should return class of ReadTextValueAsString', () => {
            const readTextValueAsString = new ReadTextValueAsString();
            readTextValueAsString.type =
                'http://api.knora.org/ontology/knora-api/v2#TextValue';
            expect(service.getValueTypeOrClass(readTextValueAsString)).toEqual(
                'ReadTextValueAsString'
            );
        });
    });

    describe('isTextEditable', () => {
        it('should determine if a given text with the standard mapping is editable', () => {
            const readTextValueAsXml = new ReadTextValueAsXml();
            readTextValueAsXml.type =
                'http://api.knora.org/ontology/knora-api/v2#TextValue';
            readTextValueAsXml.mapping = Constants.StandardMapping;
            expect(service.isTextEditable(readTextValueAsXml)).toBeTruthy();
        });

        it('should determine if a given text with a custom mapping is editable', () => {
            const readTextValueAsXml = new ReadTextValueAsXml();
            readTextValueAsXml.type =
                'http://api.knora.org/ontology/knora-api/v2#TextValue';
            readTextValueAsXml.mapping =
                'http://rdfh.ch/standoff/mappings/CustomMapping';
            expect(service.isTextEditable(readTextValueAsXml)).toBeFalsy();
        });
    });

    describe('isReadOnly', () => {
        it('should not mark a ReadIntValue as ReadOnly', () => {
            const readIntValue = new ReadIntValue();
            readIntValue.type =
                'http://api.knora.org/ontology/knora-api/v2#IntValue';

            const resPropDef = new ResourcePropertyDefinition();
            resPropDef.isEditable = true;

            const valueClass = service.getValueTypeOrClass(readIntValue);
            expect(
                service.isReadOnly(valueClass, readIntValue, resPropDef)
            ).toBeFalsy();
        });

        it('should not mark ReadTextValueAsString as ReadOnly', () => {
            const readTextValueAsString = new ReadTextValueAsString();
            readTextValueAsString.type =
                'http://api.knora.org/ontology/knora-api/v2#TextValue';

            const resPropDef = new ResourcePropertyDefinition();
            resPropDef.isEditable = true;

            const valueClass = service.getValueTypeOrClass(
                readTextValueAsString
            );
            expect(
                service.isReadOnly(
                    valueClass,
                    readTextValueAsString,
                    resPropDef
                )
            ).toBeFalsy();
        });

        it('should mark ReadTextValueAsHtml as ReadOnly', () => {
            const readTextValueAsHtml = new ReadTextValueAsHtml();
            readTextValueAsHtml.type =
                'http://api.knora.org/ontology/knora-api/v2#TextValue';

            const resPropDef = new ResourcePropertyDefinition();
            resPropDef.isEditable = true;

            const valueClass = service.getValueTypeOrClass(readTextValueAsHtml);
            expect(
                service.isReadOnly(valueClass, readTextValueAsHtml, resPropDef)
            ).toBeTruthy();
        });

        it('should not mark ReadTextValueAsXml with standard mapping as ReadOnly', () => {
            const readTextValueAsXml = new ReadTextValueAsXml();
            readTextValueAsXml.type =
                'http://api.knora.org/ontology/knora-api/v2#TextValue';
            readTextValueAsXml.mapping = Constants.StandardMapping;

            const resPropDef = new ResourcePropertyDefinition();
            resPropDef.isEditable = true;

            const valueClass = service.getValueTypeOrClass(readTextValueAsXml);
            expect(
                service.isReadOnly(valueClass, readTextValueAsXml, resPropDef)
            ).toBeFalsy();
        });

        it('should mark ReadTextValueAsXml with custom mapping as ReadOnly', () => {
            const readTextValueAsXml = new ReadTextValueAsXml();
            readTextValueAsXml.type =
                'http://api.knora.org/ontology/knora-api/v2#TextValue';
            readTextValueAsXml.mapping =
                'http://rdfh.ch/standoff/mappings/CustomMapping';

            const resPropDef = new ResourcePropertyDefinition();
            resPropDef.isEditable = true;

            const valueClass = service.getValueTypeOrClass(readTextValueAsXml);
            expect(
                service.isReadOnly(valueClass, readTextValueAsXml, resPropDef)
            ).toBeTruthy();
        });

        it('should mark a standoff link value as ReadOnly', () => {
            const readStandoffLinkValue = new ReadLinkValue();
            readStandoffLinkValue.type =
                'http://api.knora.org/ontology/knora-api/v2#LinkValue';

            const resPropDef = new ResourcePropertyDefinition();
            resPropDef.isEditable = false;

            const valueClass = service.getValueTypeOrClass(
                readStandoffLinkValue
            );
            expect(
                service.isReadOnly(
                    valueClass,
                    readStandoffLinkValue,
                    resPropDef
                )
            ).toBeTruthy();
        });

        it('should not mark ReadDateValue with supported era as ReadOnly', (done) => {
            MockResource.getTestThing().subscribe((res) => {
                const date: ReadDateValue = res.getValuesAs(
                    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate',
                    ReadDateValue
                )[0];

                date.date = new KnoraDate('GREGORIAN', 'CE', 2019, 5, 13);

                const resPropDef = new ResourcePropertyDefinition();
                resPropDef.isEditable = true;

                const valueClass = service.getValueTypeOrClass(date);
                expect(
                    service.isReadOnly(valueClass, date, resPropDef)
                ).toBeFalsy();

                done();
            });
        });

        it('should not mark ReadDateValue with supported precision as ReadOnly', (done) => {
            MockResource.getTestThing().subscribe((res) => {
                const date: ReadDateValue = res.getValuesAs(
                    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate',
                    ReadDateValue
                )[0];

                date.date = new KnoraDate('GREGORIAN', 'CE', 2019, 5, 1);

                const resPropDef = new ResourcePropertyDefinition();
                resPropDef.isEditable = true;

                const valueClass = service.getValueTypeOrClass(date);
                expect(
                    service.isReadOnly(valueClass, date, resPropDef)
                ).toBeFalsy();

                done();
            });
        });
    });

    describe('compareObjectTypeWithValueType', () => {
        it('should successfully compare "http://api.knora.org/ontology/knora-api/v2#TextValue" with "ReadTextValueAsString"', () => {
            expect(
                service.compareObjectTypeWithValueType(
                    'ReadTextValueAsString',
                    'http://api.knora.org/ontology/knora-api/v2#TextValue'
                )
            ).toBeTruthy();
        });

        it('should successfully compare "http://api.knora.org/ontology/knora-api/v2#TextValue" with "ReadTextValueAsHtml"', () => {
            expect(
                service.compareObjectTypeWithValueType(
                    'ReadTextValueAsHtml',
                    'http://api.knora.org/ontology/knora-api/v2#TextValue'
                )
            ).toBeTruthy();
        });

        it('should successfully compare "http://api.knora.org/ontology/knora-api/v2#TextValue" with "ReadTextValueAsXml"', () => {
            expect(
                service.compareObjectTypeWithValueType(
                    'ReadTextValueAsXml',
                    'http://api.knora.org/ontology/knora-api/v2#TextValue'
                )
            ).toBeTruthy();
        });

        it('should successfully compare "http://api.knora.org/ontology/knora-api/v2#IntValue" with "http://api.knora.org/ontology/knora-api/v2#IntValue"', () => {
            expect(
                service.compareObjectTypeWithValueType(
                    'http://api.knora.org/ontology/knora-api/v2#IntValue',
                    'http://api.knora.org/ontology/knora-api/v2#IntValue'
                )
            ).toBeTruthy();
        });

        it('should fail to compare an IntValue with a DecimalValue', () => {
            expect(
                service.compareObjectTypeWithValueType(
                    'http://api.knora.org/ontology/knora-api/v2#IntValue',
                    'http://api.knora.org/ontology/knora-api/v2#DecimalValue'
                )
            ).toBeFalsy();
        });

        it('should fail to compare "http://api.knora.org/ontology/knora-api/v2#IntValue" with "ReadTextValueAsString"', () => {
            expect(
                service.compareObjectTypeWithValueType(
                    'ReadTextValueAsString',
                    'http://api.knora.org/ontology/knora-api/v2#IntValue'
                )
            ).toBeFalsy();
        });
    });

    describe('calculateDaysInMonth', () => {
        it('should calculate the number of days in February in a leap year', () => {
            expect(service.calculateDaysInMonth('GREGORIAN', 2020, 2)).toEqual(
                29
            );
        });

        it('should calculate the number of days in February in a non leap year', () => {
            expect(service.calculateDaysInMonth('GREGORIAN', 2021, 2)).toEqual(
                28
            );
        });

        it('should calculate the number of days in March', () => {
            expect(service.calculateDaysInMonth('GREGORIAN', 2021, 3)).toEqual(
                31
            );
        });
    });

    describe('createJDNCalendarDateFromKnoraDate', () => {
        it('should create a JDN calendar date from a Knora date with day precision in the Gregorian calendar', () => {
            const calDateJDN = service.createJDNCalendarDateFromKnoraDate(
                new KnoraDate('GREGORIAN', 'CE', 2021, 3, 15)
            );

            const period = calDateJDN.toJDNPeriod();

            expect(period.periodStart).toEqual(2459289);
            expect(period.periodEnd).toEqual(2459289);
        });

        it('should create a JDN calendar date from a Knora date BCE with day precision in the Gregorian calendar', () => {
            const calDateJDN = service.createJDNCalendarDateFromKnoraDate(
                new KnoraDate('GREGORIAN', 'BCE', 1, 1, 1)
            );

            const period = calDateJDN.toJDNPeriod();

            expect(period.periodStart).toEqual(1721058);
            expect(period.periodEnd).toEqual(1721058);
        });

        it('should create a JDN calendar date from a Knora date with day precision in the Julian calendar', () => {
            const calDateJDN = service.createJDNCalendarDateFromKnoraDate(
                new KnoraDate('JULIAN', 'CE', 2021, 3, 15)
            );

            const period = calDateJDN.toJDNPeriod();

            expect(period.periodStart).toEqual(2459302);
            expect(period.periodEnd).toEqual(2459302);
        });

        it('should create a JDN calendar date from a Knora date with month precision in the Gregorian calendar', () => {
            const calDateJDN = service.createJDNCalendarDateFromKnoraDate(
                new KnoraDate('GREGORIAN', 'CE', 2021, 3)
            );

            const period = calDateJDN.toJDNPeriod();

            expect(period.periodStart).toEqual(2459275);
            expect(period.periodEnd).toEqual(2459305);
        });

        it('should create a JDN calendar date from a Knora date with year precision in the Gregorian calendar', () => {
            const calDateJDN = service.createJDNCalendarDateFromKnoraDate(
                new KnoraDate('GREGORIAN', 'CE', 2021)
            );

            const period = calDateJDN.toJDNPeriod();

            expect(period.periodStart).toEqual(2459216);
            expect(period.periodEnd).toEqual(2459580);
        });
    });

    describe('convertHistoricalYearToAstronomicalYear', () => {
        it('should convert the year 1 BCE to its astronomical representation', () => {
            expect(
                service.convertHistoricalYearToAstronomicalYear(
                    1,
                    'BCE'
                )
            ).toEqual(0);
        });

        it('should convert the year 2 BCE to its astronomical representation', () => {
            expect(
                service.convertHistoricalYearToAstronomicalYear(
                    2,
                    'BCE'
                )
            ).toEqual(-1);
        });

        it('should convert the year 1 CE to its astronomical representation', () => {
            expect(
                service.convertHistoricalYearToAstronomicalYear(
                    1,
                    'CE'
                )
            ).toEqual(1);
        });

        it('should convert the year 1 in the Islamic to its astronomical representation', () => {
            expect(
                service.convertHistoricalYearToAstronomicalYear(
                    1,
                    'noEra'
                )
            ).toEqual(1);
        });
    });
});
