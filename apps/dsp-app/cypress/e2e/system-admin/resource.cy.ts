import { faker } from '@faker-js/faker';
import { ListGetResponseADM } from '../../../../../libs/vre/open-api/src';
import { Project00FFPayloads } from '../../fixtures/project00FF-resource-payloads';
import { ClassPropertyPayloads } from '../../fixtures/property-definition-payloads';
import { ResourceRequests, ResponseUtil } from '../../fixtures/requests';
import { AddResourceInstancePage } from '../../support/pages/add-resource-instance-page';

describe('Resource', () => {
  let finalLastModificationDate: string;
  let po: AddResourceInstancePage;
  const project00FFPayloads = new Project00FFPayloads();

  beforeEach(() => {
    po = new AddResourceInstancePage();

    cy.request(
      'POST',
      `${Cypress.env('apiUrl')}/v2/ontologies/classes`,
      project00FFPayloads.createClassPayload('datamodelclass')
    ).then(response => {
      finalLastModificationDate = ResponseUtil.lastModificationDate(response);
    });
  });

  describe('can add an instance, edit, and delete for a property', () => {
    it('text', () => {
      const initialValue = faker.lorem.word();
      const editedValue = faker.lorem.word();

      ResourceRequests.resourceRequest(ClassPropertyPayloads.textShort(finalLastModificationDate));
      po.visitAddPage();

      // create
      po.addInitialLabel();
      cy.get('[data-cy=text-input]').type(initialValue);
      po.clickOnSubmit();
      cy.contains(initialValue);

      // edit
      po.setupEdit();
      cy.get('[data-cy=text-input] input').clear().type(editedValue);
      po.saveEdit();
      cy.contains(editedValue);

      // delete
      po.delete();
    });

    it('number', () => {
      const intInput = () => cy.get('[data-cy=int-input]');
      const initialValue = faker.number.int({ min: 0, max: 100 });
      const editedValue = faker.number.int({ min: 0, max: 100 });

      ResourceRequests.resourceRequest(ClassPropertyPayloads.number(finalLastModificationDate));
      po.visitAddPage();

      // create
      po.addInitialLabel();
      intInput().type(initialValue.toString());
      po.clickOnSubmit();
      cy.contains(initialValue.toString());

      // edit
      po.setupEdit();
      intInput().clear().type(editedValue.toString());
      po.saveEdit();
      cy.contains(editedValue);

      // delete
      po.delete();
    });

    it('boolean', () => {
      const addBoolToggle = () => cy.get('[data-cy=add-bool-toggle]');
      const boolToggle = () => cy.get('[data-cy=bool-toggle]');
      ResourceRequests.resourceRequest(ClassPropertyPayloads.boolean(finalLastModificationDate));
      po.visitAddPage();

      // create
      po.addInitialLabel();
      addBoolToggle().click();
      boolToggle().click();
      po.clickOnSubmit();

      // edit
      po.setupEdit();
      boolToggle().click();
      po.saveEdit();

      // delete
      po.delete();
    });

    it('color', () => {
      const color = { hex: '#02A2A2', rgb: 'rgb(2, 162, 162)' };
      const editedColor = { hex: '#A3B3F3', rgb: 'rgb(163, 179, 243)' };

      const enterNewValue = (value: string) => {
        cy.get('[data-cy=color-picker-input]').click({ force: true });
        cy.get('.color-picker .hex-text .box input').clear().type(value);
      };

      const checkColor = (rgb: string) => {
        cy.get('[data-cy=color-box]').should('have.css', 'background-color').and('eq', rgb);
      };

      ResourceRequests.resourceRequest(ClassPropertyPayloads.color(finalLastModificationDate));
      po.visitAddPage();

      // create
      po.addInitialLabel();
      enterNewValue(color.hex);
      po.clickOnSubmit();
      checkColor(color.rgb);
      // edit
      po.setupEdit();
      enterNewValue(editedColor.hex);
      po.saveEdit();
      checkColor(editedColor.rgb);

      // delete
      po.delete();
    });

    it.skip('place', () => {
      const initialValue = 'Basel';
      const editedValue = 'Allschwil';

      const enterAutocomplete = (value: string) => {
        cy.get('[data-cy=geoname-autocomplete]')
          .type(value)
          .click({ force: true })
          .wait(1000)
          .type('{downarrow}{enter}');
      };

      ResourceRequests.resourceRequest(ClassPropertyPayloads.place(finalLastModificationDate));
      po.visitAddPage();

      // create
      po.addInitialLabel();
      enterAutocomplete(initialValue);
      po.clickOnSubmit();
      cy.contains(initialValue);

      // edit
      po.setupEdit();
      enterAutocomplete(editedValue);
      po.saveEdit();
      cy.contains(editedValue);

      // delete
      po.delete();
    });

    const propertyListPayload = (lastModificationDate: string, listId: string) => {
      return {
        '@id': 'http://0.0.0.0:3333/ontology/00FF/images/v2',
        '@type': 'http://www.w3.org/2002/07/owl#Ontology',
        'http://api.knora.org/ontology/knora-api/v2#lastModificationDate': {
          '@type': 'http://www.w3.org/2001/XMLSchema#dateTimeStamp',
          '@value': lastModificationDate,
        },
        '@graph': [
          {
            'http://api.knora.org/ontology/knora-api/v2#objectType': {
              '@id': 'http://api.knora.org/ontology/knora-api/v2#ListValue',
            },
            'http://www.w3.org/2000/01/rdf-schema#label': {
              '@language': 'de',
              '@value': 'property',
            },
            'http://www.w3.org/2000/01/rdf-schema#subPropertyOf': {
              '@id': 'http://api.knora.org/ontology/knora-api/v2#hasValue',
            },
            'http://api.knora.org/ontology/salsah-gui/v2#guiElement': {
              '@id': 'http://api.knora.org/ontology/salsah-gui/v2#Pulldown',
            },
            'http://api.knora.org/ontology/salsah-gui/v2#guiAttribute': [`hlist=<${listId}>`],
            '@id': 'http://0.0.0.0:3333/ontology/00FF/images/v2#property',
            '@type': 'http://www.w3.org/2002/07/owl#ObjectProperty',
          },
        ],
      };
    };
    it('list', () => {
      let listId: string;
      const item1Name = faker.lorem.word();
      const item2Name = faker.lorem.word();

      const sendCreateListItemRequest = (_listId: string, name: string) => {
        return cy.request('POST', `${Cypress.env('apiUrl')}/admin/lists/${encodeURIComponent(_listId)}`, {
          parentNodeIri: listId,
          projectIri: 'http://rdfh.ch/projects/00FF',
          labels: [
            {
              language: 'de',
              value: name,
            },
          ],
          name: `RandomName${name}`,
        });
      };

      const clickOnListElement = (index: number) => {
        cy.get('[data-cy=select-list-button]').click();
        cy.get('[data-cy=list-item-button]').eq(index).click();
      };

      cy.request<ListGetResponseADM>('POST', `${Cypress.env('apiUrl')}/admin/lists`, {
        comments: [{ language: 'de', value: faker.lorem.words(2) }],
        labels: [{ language: 'de', value: faker.lorem.words(2) }],
        projectIri: 'http://rdfh.ch/projects/00FF',
      })
        .then(response => {
          listId = response.body.list.listinfo.id;
          sendCreateListItemRequest(listId, item1Name);
        })
        .then(() => sendCreateListItemRequest(listId, item2Name))
        .then(() => ResourceRequests.resourceRequest(propertyListPayload(finalLastModificationDate, listId)))
        .then(() => {
          po.visitAddPage();

          // create
          po.addInitialLabel();
          clickOnListElement(1); // as the list property is not required, there is an empty list entry at index 0 to select.
          po.clickOnSubmit();
          cy.contains(item1Name);

          // edit
          po.setupEdit();
          clickOnListElement(1);
          po.saveEdit();
          cy.contains(item2Name);

          // delete
          po.delete();
        });
    });

    it('link', () => {
      // create John Smith person
      cy.request('POST', `${Cypress.env('apiUrl')}/v2/resources`, {
        '@type': 'http://0.0.0.0:3333/ontology/00FF/images/v2#person',
        'http://www.w3.org/2000/01/rdf-schema#label': 'john',
        'http://api.knora.org/ontology/knora-api/v2#attachedToProject': {
          '@id': 'http://rdfh.ch/projects/00FF',
        },
        'http://0.0.0.0:3333/ontology/00FF/images/v2#lastname': {
          '@type': 'http://api.knora.org/ontology/knora-api/v2#TextValue',
          'http://api.knora.org/ontology/knora-api/v2#valueAsString': 'john',
        },
        'http://0.0.0.0:3333/ontology/00FF/images/v2#firstname': {
          '@type': 'http://api.knora.org/ontology/knora-api/v2#TextValue',
          'http://api.knora.org/ontology/knora-api/v2#valueAsString': 'smith',
        },
      })
        .then(response => {
          ResourceRequests.resourceRequest(ClassPropertyPayloads.link(finalLastModificationDate));
        })
        .then(() => {
          po.visitAddPage();
          const input = cy.get('[data-cy=link-input]');

          // create
          po.addInitialLabel();
          input.type('John').click({ force: true });
          cy.wait(2000);
          input.type('{downarrow}{downarrow}{downarrow}{enter}');
          po.clickOnSubmit();

          // edit
          po.setupEdit();
          po.saveEdit();

          // delete
          po.delete();
        });
    });
    it.skip('date', () => {
      ResourceRequests.resourceRequest(ClassPropertyPayloads.date(finalLastModificationDate));
      po.visitAddPage();

      // create
      po.addInitialLabel();
      cy.get('.mat-mdc-form-field-icon-suffix > .mat-icon').click();
      cy.get('#mat-input-6').clear({ force: true }).type('2023');
      cy.get(':nth-child(4) > :nth-child(4) > .selectable').click();
      po.clickOnSubmit();

      // edit
      po.setupEdit();
      cy.get('.date-form-grid > .mat-mdc-tooltip-trigger > .mat-mdc-button-touch-target').click();
      po.saveEdit();

      // delete
      po.delete();
    });

    it('timestamp', () => {
      ResourceRequests.resourceRequest(ClassPropertyPayloads.timestamp(finalLastModificationDate));
      po.visitAddPage();

      // create
      po.addInitialLabel();
      cy.get('.mat-datepicker-toggle > .mdc-icon-button > .mat-mdc-button-touch-target').click();
      cy.get(':nth-child(4) > [data-mat-col="3"] > .mat-calendar-body-cell > .mat-calendar-body-cell-content').type(
        '{enter}'
      );
      cy.get('[data-cy=time-input]').clear().type('00:00');
      po.clickOnSubmit();

      // edit
      po.setupEdit();
      cy.get('[data-cy=time-input]').clear().type('09:40');
      po.saveEdit();

      // delete
      po.delete();
    });

    it('time sequence', () => {
      ResourceRequests.resourceRequest(ClassPropertyPayloads.timesequence(finalLastModificationDate));
      po.visitAddPage();
      const start = () => cy.get('[data-cy=start-input] input');
      const end = () => cy.get('[data-cy=end-input] input');

      const randomFloat = () => faker.number.float({ min: 0, max: 10, precision: 2 }).toString();
      // create
      po.addInitialLabel();
      start().type(randomFloat());
      end().type(randomFloat());
      po.clickOnSubmit();

      // edit
      po.setupEdit();
      start().clear().type(randomFloat());
      end().clear().type(randomFloat());
      po.saveEdit();

      // delete
      po.delete();
    });
  });

  describe('can not add an empty value when it is required', () => {
    const types = new Map<string, any>([
      ['text', () => ClassPropertyPayloads.textShort(finalLastModificationDate)],
      ['number', () => ClassPropertyPayloads.number(finalLastModificationDate)],
      ['place', () => ClassPropertyPayloads.place(finalLastModificationDate)],
      ['time sequence', () => ClassPropertyPayloads.timesequence(finalLastModificationDate)],
      ['link', () => ClassPropertyPayloads.link(finalLastModificationDate)],
    ]);

    types.forEach((value, name) => {
      it(name, () => {
        ResourceRequests.resourceRequest(value(), true);
        // po.visitAddPage();
        // po.addInitialLabel();
        // po.clickOnSubmit();
        // cy.contains('This field is required');
      });
    });
  });
});
