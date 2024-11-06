import { faker } from '@faker-js/faker';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { UploadedFileResponse } from '../../../../../libs/vre/shared/app-representations/src';
import {
  AudioThingClass,
  DocumentClass,
  MiscClass,
  SidebandClass,
  VideoThingClass,
} from '../../models/existing-data-models';
import { Project0001Page, Project0803Page } from '../../support/pages/existing-ontology-class-page';

describe.skip('View Existing Resource', () => {
  const onecolor = require('onecolor');

  let project0803Page: Project0803Page;
  let project0001Page: Project0001Page;

  const miscData: MiscClass = {
    label: faker.lorem.word(),
    color: faker.color.rgb(),
    colorComment: faker.lorem.sentence(),
    book: '',
    bookComment: faker.lorem.sentence(),
  };

  const sidebandData: SidebandClass = {
    label: faker.lorem.word(),
    file: '',
    title: faker.lorem.sentence(),
    titleComment: faker.lorem.sentence(),
    description: faker.lorem.sentence(),
    descriptionComment: faker.lorem.sentence(),
    comments: [{ text: faker.lorem.sentence(), comment: faker.lorem.sentence() }],
  };

  const videoThingData: VideoThingClass = createVideoThingClass('zzLabel');

  function createVideoThingClass(label: string): VideoThingClass {
    return {
      label: label,
      file: '',
      title: faker.lorem.sentence(),
      titleComment: faker.lorem.sentence(),
    };
  }

  const audioThingData: AudioThingClass = {
    label: faker.lorem.word(),
    file: '',
    title: faker.lorem.sentence(),
    titleComment: faker.lorem.sentence(),
  };

  const documentData: DocumentClass = {
    label: faker.lorem.word(),
    file: '',
    titleComments: [
      {
        text: faker.lorem.sentence(),
        comment: faker.lorem.sentence(),
      },
      {
        text: faker.lorem.sentence(),
        comment: faker.lorem.sentence(),
      },
    ],
  };

  const headless = Cypress.browser.isHeadless ? 'headless' : '';
  const screenshotsPath = Cypress.browser.isHeadless ? 'screenshots/logged-out-user/resource.cy.ts' : 'screenshots';
  const uploadedImageFilePath = '/uploads/Fingerprint_Logo_coloured.png';
  const fullUploadedImageFilePathScaled = `cypress/uploads/Fingerprint_Logo_coloured1024x768${headless}.png`;
  const uploadedVideoFilePath = '/uploads/dasch-short.mp4';
  const uploadedAudioFilePath = '/uploads/dasch-short.mp3';
  const uploadedDocumentFilePath = '/uploads/UNIBE_DaSCH_Workshop.pdf';
  const fullUploadedDocumentFilePathScaled = `cypress/uploads/UNIBE_DaSCH_Workshop1024x768${headless}.png`;
  const imageScreenshotPath = `${screenshotsPath}/osd-canvas-screenshot.png`;
  const documentScreenshotPath = `${screenshotsPath}/pdf-screenshot.png`;

  before(() => {
    cy.resetDatabase();
    Cypress.env('skipDatabaseCleanup', true);

    project0803Page = new Project0803Page();
    project0001Page = new Project0001Page();

    cy.uploadFile(<Cypress.IUploadFileParameters>{
      filePath: `../${uploadedImageFilePath}`,
      projectShortCode: Project0803Page.projectShortCode,
      mimeType: 'image/png',
    }).then(response => {
      sidebandData.file = (response as UploadedFileResponse).internalFilename;
      cy.createResource(project0803Page.payloads.sideband(sidebandData));
    });

    cy.uploadFile(<Cypress.IUploadFileParameters>{
      filePath: `../${uploadedVideoFilePath}`,
      projectShortCode: Project0001Page.projectShortCode,
    }).then(response => {
      videoThingData.file = (response as UploadedFileResponse).internalFilename;
      cy.createResource(project0001Page.payloads.videoThing(videoThingData));
    });
    cy.uploadFile(<Cypress.IUploadFileParameters>{
      filePath: `../${uploadedVideoFilePath}`,
      projectShortCode: Project0001Page.projectShortCode,
    }).then(response => {
      const videoThingData2 = createVideoThingClass(faker.lorem.word());
      videoThingData2.file = (response as UploadedFileResponse).internalFilename;
      cy.createResource(project0001Page.payloads.videoThing(videoThingData2));
    });

    cy.uploadFile(<Cypress.IUploadFileParameters>{
      filePath: `../${uploadedAudioFilePath}`,
      projectShortCode: Project0001Page.projectShortCode,
    }).then(response => {
      audioThingData.file = (response as UploadedFileResponse).internalFilename;
      cy.createResource(project0001Page.payloads.audioThing(audioThingData));
    });

    cy.uploadFile(<Cypress.IUploadFileParameters>{
      filePath: `../${uploadedDocumentFilePath}`,
      projectShortCode: Project0001Page.projectShortCode,
    }).then(response => {
      documentData.file = (response as UploadedFileResponse).internalFilename;
      cy.createResource(project0001Page.payloads.document(documentData));
      cy.screenshot('sipi-uploads-screenshot', {
        scale: false,
        overwrite: true,
        capture: 'runner',
      });
      cy.request(`${Cypress.env('sipiIIIfUrl')}/${Project0001Page.projectShortCode}/${documentData.file}/file`).then(
        response => {
          expect(response.status).to.eq(200);
        }
      );
    });

    cy.createResource(project0803Page.payloads.misc(miscData));
  });

  it('should not be accessible and return to page', () => {
    cy.visit(`/project/${Project0803Page.projectShortCode}/ontology/${Project0803Page.ontologyName}/book/add`);
    const regex = new RegExp(`/project/${Project0803Page.projectShortCode}$`);
    cy.url().should('match', regex);
  });

  it('object without representation with label, color, comment properties should be present', () => {
    project0803Page.visitClass('misc');
    cy.get('[data-cy=resource-list-item]').should('have.length.greaterThan', 0);
    cy.get('[data-cy=resource-list-item] h3.res-class-value').contains(miscData.label).click();
    cy.get('[data-cy=resource-header-label]').contains(miscData.label);
    cy.get('[data-cy=representation-container]').should('not.exist');
    cy.get('[data-cy=color-box]')
      .should('have.css', 'background-color')
      .should('contain', onecolor(miscData.color).css().replaceAll(',', ', '));
    cy.get('[data-cy=show-all-comments]').scrollIntoView().click();
    cy.get('[data-cy=property-value-comment]').contains(miscData.colorComment);
  });

  it('Sideband resource with still image, rich text and comments should be present', () => {
    cy.intercept('GET', '**/default.jpg').as('stillImageRequest');
    project0803Page.visitClass('Sideband');
    cy.get('[data-cy=accept-cookies]').click();
    cy.get('rn-banner').shadow().find('.rn-close-btn').click();
    cy.get('[data-cy=resource-list-item] h3.res-class-value').contains(sidebandData.label).click();
    cy.get('[data-cy=close-restricted-button]').click();
    cy.get('[data-cy=resource-header-label]').contains(sidebandData.label);
    cy.get('.representation-container').should('exist');
    cy.get('app-still-image').should('be.visible');
    cy.log('waiting for still image request');
    cy.wait('@stillImageRequest').its('request.url').should('include', sidebandData.file);
    cy.wait('@stillImageRequest').its('response.statusCode').should('eq', 200);

    // cy.log('checking SIPI image request');
    // cy.request(
    //   `${Cypress.env('sipiIIIfUrl')}/${project0803Page.projectShortCode}/${sidebandData.file}/full/135,45/0/default.jpg`
    // ).should(response => {
    //   expect(response.status).to.eq(200);
    // });
    cy.getCanvas('app-still-image canvas').screenshot('osd-canvas-screenshot', {
      clip: { x: 0, y: 164, width: 300, height: 100 },
      scale: false,
      overwrite: true,
      capture: 'viewport',
    });
    cy.fixture(imageScreenshotPath, 'base64').then(expectedImageBase64 => {
      const expectedImageBuffer = Buffer.from(expectedImageBase64, 'base64');
      const expectedImg = PNG.sync.read(expectedImageBuffer);
      cy.readFile(fullUploadedImageFilePathScaled, 'base64').then(binary => {
        expect(binary).to.exist;
        const imageBuffer = Cypress.Buffer.from(binary, 'base64');
        const pngImage = PNG.sync.read(imageBuffer);
        expect(pngImage).to.exist;
        expect(pngImage.width).to.be.greaterThan(0);
        expect(pngImage.height).to.be.greaterThan(0);
        const { width, height } = expectedImg;
        const diff = new PNG({ width, height });
        const pixelDiff = pixelmatch(expectedImg.data, pngImage.data, diff.data, width, height, {
          threshold: 0.1,
        });
        expect(pixelDiff).to.be.lessThan(100);
      });
    });

    cy.get('[data-cy=property-value]').contains(sidebandData.title);
    cy.get('[data-cy=show-all-comments]').scrollIntoView().click();
    cy.get('[data-cy=property-value-comment]').should('have.length.greaterThan', 0);
    cy.get('[data-cy=property-value-comment]').contains(sidebandData.titleComment).scrollIntoView();
    cy.get('[data-cy=rich-text-switch] p').contains(sidebandData.comments[0].text);
    cy.get('[data-cy=property-value-comment]').contains(sidebandData.comments[0].comment);
  });

  it('moving image representation should be present', () => {
    let interceptCall = 1;
    cy.intercept('GET', '**/file', req => {
      req.alias = `call${interceptCall++}`;
      req.continue();
    });
    project0001Page.visitClass('VideoThing');
    cy.wait('@call1').should(interception => {
      expect(interception.response?.statusCode).to.be.equal(206);
    });

    cy.get('[data-cy=accept-cookies]').click();
    cy.get('rn-banner').shadow().find('.rn-close-btn').click();

    cy.get('[data-cy=resource-list-item] h3.res-class-value').contains(videoThingData.label).click();
    cy.get('[data-cy=resource-header-label]').contains(videoThingData.label);
    cy.get('.representation-container').should('exist');
    cy.get('app-video').should('be.visible');

    // wait for selected resource file request to be intercepted
    cy.wait('@call2').should(interception => {
      expect(interception.request.url).to.include(videoThingData.file);
      expect(interception.response?.statusCode).to.be.equal(206);
    });
    cy.get('[data-cy=side-panel-collapse-btn]').click();
    cy.get('[data-cy=player-time]').contains('00:00');
    cy.get('[data-cy=play-pause-button]').contains('play_arrow');
    cy.get('[data-cy=play-pause-button]').click();
    cy.get('[data-cy=play-pause-button]').contains('pause');
    cy.wait(1000); //allow to play for 1 second
    cy.get('[data-cy=play-pause-button]').click();
    cy.get('[data-cy=player-time]')
      .invoke('text')
      .then(text => {
        cy.log('player time:', text);
        expect(text).to.include('00:01');
      });
    cy.get('[data-cy=play-pause-button]').contains('play_arrow');
    cy.get('[data-cy=go-to-start-button]').click();
    cy.get('[data-cy=player-time]').contains('00:00');
    cy.get('[data-cy=cinema-mode-button]').contains('fullscreen');
    cy.get('[data-cy=cinema-mode-button]').click();
    cy.get('[data-cy=cinema-mode-button]').contains('fullscreen_exit');
    cy.get('[data-cy=cinema-mode-button]').click();

    cy.get('[data-cy=property-value]').contains(videoThingData.title);
    cy.get('[data-cy=show-all-comments]').scrollIntoView().click();
    cy.get('[data-cy=property-value-comment]').should('have.length.greaterThan', 0);
    cy.get('[data-cy=property-value-comment]').contains(videoThingData.titleComment).scrollIntoView();
  });

  it('audio representation should be present', () => {
    cy.intercept('GET', '**/file').as('audioFileRequest');
    project0001Page.visitClass('AudioThing');

    cy.get('[data-cy=accept-cookies]').click();
    cy.get('rn-banner').shadow().find('.rn-close-btn').click();

    cy.get('[data-cy=resource-list-item] h3.res-class-value').contains(audioThingData.label).click();
    cy.get('[data-cy=resource-header-label]').contains(audioThingData.label);
    cy.get('.representation-container').should('exist');
    cy.get('app-audio').should('be.visible');

    cy.get('[data-cy=side-panel-collapse-btn]').click();
    cy.get('[data-cy=player-time]').contains('00:00');
    cy.intercept('GET', '**/file').as('audioFileRequest');
    cy.get('[data-cy=play-pause-button]').contains('play_arrow');
    cy.get('[data-cy=play-pause-button]').click();
    cy.wait('@audioFileRequest').then(xhr => {
      expect(xhr.request.url).to.include(audioThingData.file);
      expect(xhr.response.statusCode).to.eq(206);
    });
    cy.get('[data-cy=play-pause-button]').contains('pause');
    cy.wait(1000); //allow to play for 1 second
    cy.get('[data-cy=play-pause-button]').click();
    cy.get('[data-cy=player-time]')
      .invoke('text')
      .then(text => {
        cy.log('player time:', text);
        expect(text).to.include('00:01');
      });
    cy.get('[data-cy=play-pause-button]').contains('play_arrow');
    cy.get('[data-cy=go-to-start-button]').click();
    cy.get('[data-cy=player-time]').contains('00:00');

    cy.get('[data-cy=property-value]').contains(audioThingData.title);
    cy.get('[data-cy=show-all-comments]').scrollIntoView().click();
    cy.get('[data-cy=property-value-comment]').should('have.length.greaterThan', 0);
    cy.get('[data-cy=property-value-comment]').contains(audioThingData.titleComment).scrollIntoView();
  });

  it('document representation should be present', () => {
    cy.intercept('GET', '**/file').as('documentFileRequest');
    project0001Page.visitClass('ThingDocument');
    cy.get('.loadingIcon').then(() => {
      cy.get('.loadingIcon').should('not.exist');
      cy.get('[data-cy=accept-cookies]').click();
      cy.get('rn-banner').shadow().find('.rn-close-btn').click();
      cy.getCanvas('.canvasWrapper canvas').screenshot('pdf-screenshot', {
        scale: false,
        overwrite: true,
      });
    });

    cy.get('[data-cy=resource-header-label]').contains(documentData.label);
    cy.get('.representation-container').should('exist');
    cy.get('app-document').should('be.visible');

    cy.get('[data-cy=side-panel-collapse-btn]').click();
    cy.wait('@documentFileRequest').then(xhr => {
      expect(xhr.request.url).to.include(documentData.file);
      expect(xhr.response.statusCode).to.eq(200);
    });

    cy.fixture(documentScreenshotPath, 'base64').then(expectedImageBase64 => {
      const expectedImageBuffer = Buffer.from(expectedImageBase64, 'base64');
      const expectedImg = PNG.sync.read(expectedImageBuffer);
      cy.readFile(fullUploadedDocumentFilePathScaled, 'base64').then(binary => {
        expect(binary).to.exist;
        const imageBuffer = Cypress.Buffer.from(binary, 'base64');
        const pngImage = PNG.sync.read(imageBuffer);
        expect(pngImage).to.exist;
        expect(pngImage.width).to.be.greaterThan(0);
        expect(pngImage.height).to.be.greaterThan(0);
        const { width, height } = expectedImg;
        const diff = new PNG({ width, height });
        const pixelDiff = pixelmatch(expectedImg.data, pngImage.data, diff.data, width, height, {
          threshold: 0.1,
        });
        expect(pixelDiff).to.be.lessThan(100);
      });
    });

    cy.get('[data-cy=property-value]').contains(documentData.titleComments[0].text);
    cy.get('[data-cy=property-value]').contains(documentData.titleComments[1].text);
    cy.get('[data-cy=show-all-comments]').scrollIntoView().click();
    cy.get('[data-cy=property-value-comment]').should('have.length', 2);
    cy.get('[data-cy=property-value-comment]').contains(documentData.titleComments[0].comment);
    cy.get('[data-cy=property-value-comment]').contains(documentData.titleComments[1].comment);
  });

  after(() => {
    Cypress.env('skipDatabaseCleanup', false);
  });
});
